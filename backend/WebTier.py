# WebTier.py
import os
import uuid
import time
import json
from datetime import datetime
from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError

# Config from env
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET = os.getenv("S3_BUCKET")
INPUT_QUEUE_URL = os.getenv("INPUT_QUEUE_URL")
RESULT_S3_PREFIX = os.getenv("RESULT_S3_PREFIX", "results/")
UPLOAD_S3_PREFIX = os.getenv("UPLOAD_S3_PREFIX", "requests/")
RESULT_TIMEOUT = int(os.getenv("RESULT_TIMEOUT", "30"))  # seconds

if not S3_BUCKET or not INPUT_QUEUE_URL:
    raise RuntimeError("Missing required env vars: S3_BUCKET and INPUT_QUEUE_URL")

# boto3 session (will use IAM role if available or env creds)
session = boto3.session.Session(region_name=AWS_REGION)
s3 = session.client("s3")
sqs = session.client("sqs")

app = Flask(__name__)

def upload_file_to_s3(fileobj, bucket, key):
    try:
        fileobj.seek(0)
        s3.upload_fileobj(fileobj, bucket, key)
        return True
    except ClientError:
        app.logger.exception("S3 upload failed")
        return False

def s3_object_exists(bucket, key):
    try:
        s3.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError:
        return False

@app.route("/health", methods=["GET"])
def health_check():
    
    # Checks Web Tier status and AWS connectivity.
    
    health_status = {
        "web_tier": "OK",
        "aws_sqs": "FAIL",
        "aws_s3": "FAIL",
        "region": AWS_REGION,
        "bucket": S3_BUCKET
    }
    
    try:
        # Check SQS connection by getting queue URL
        sqs.get_queue_url(QueueName=INPUT_QUEUE_URL.split('/')[-1])
        health_status["aws_sqs"] = "OK"
    except Exception:
        pass
        
    try:
        # Check S3 connection by getting bucket info
        s3.head_bucket(Bucket=S3_BUCKET)
        health_status["aws_s3"] = "OK"
    except Exception:
        pass

    # Return 503 if any critical service fails
    if health_status["aws_sqs"] == "FAIL" or health_status["aws_s3"] == "FAIL":
        return jsonify(health_status), 503
        
    return jsonify(health_status), 200

@app.route("/", methods=["POST"])
def submit_image():
    if 'image_file' not in request.files:
        return jsonify({"error": "no image_file provided"}), 400

    upload_file = request.files['image_file']
    if upload_file.filename == "":
        return jsonify({"error": "empty filename"}), 400

    uid = str(uuid.uuid4())
    s3_key = f"{UPLOAD_S3_PREFIX}{uid}/{upload_file.filename}"

    ok = upload_file_to_s3(upload_file.stream, S3_BUCKET, s3_key)
    if not ok:
        return jsonify({"error": "s3 upload failed"}), 500

    message_payload = {
        "uid": uid,
        "s3_bucket": S3_BUCKET,
        "s3_key": s3_key,
        "filename": upload_file.filename,
        "timestamp": datetime.utcnow().isoformat()
    }

    try:
        sqs.send_message(
            QueueUrl=INPUT_QUEUE_URL,
            MessageBody=json.dumps(message_payload),
            MessageAttributes={
                "UID": {"StringValue": uid, "DataType": "String"},
                "Filename": {"StringValue": upload_file.filename, "DataType": "String"}
            }
        )
    except ClientError:
        app.logger.exception("Failed to send message to SQS")
        return jsonify({"error": "sqs send failed"}), 500

    # Poll S3 for result (simple approach)
    result_key = f"{RESULT_S3_PREFIX}{uid}.json"
    poll_interval = 1.0
    deadline = time.time() + RESULT_TIMEOUT
    while time.time() < deadline:
        if s3_object_exists(S3_BUCKET, result_key):
            res_obj = s3.get_object(Bucket=S3_BUCKET, Key=result_key)
            body = res_obj['Body'].read().decode('utf-8')
            try:
                data = json.loads(body)
            except Exception:
                data = {"raw": body}
            # optionally delete result object: s3.delete_object(...)
            return jsonify({"uid": uid, "result": data}), 200
        time.sleep(poll_interval)
        poll_interval = min(poll_interval * 1.5, 5.0)

# If timeout, return 202 (accepted) with uid so client can poll later
	return jsonify({"uid": uid, "status": "pending", "message": "Result not ready (timeout)"}), 202

@app.route("/result/<uid>", methods=["GET"])
def get_result(uid):
    
    # API for client to poll for processing result using UID.

    result_key = f"{RESULT_S3_PREFIX}{uid}.json"
    
    if not s3_object_exists(S3_BUCKET, result_key):
        return jsonify({"uid": uid, "status": "pending", "message": "Result not yet available"}), 202

    try:
        res_obj = s3.get_object(Bucket=S3_BUCKET, Key=result_key)
        body = res_obj['Body'].read().decode('utf-8')
        
        try:
            data = json.loads(body)
        except Exception:
            # If not valid JSON, return raw content
            data = {"raw_result": body}
            
        # Optional: Delete result object after retrieval
        # s3.delete_object(Bucket=S3_BUCKET, Key=result_key)
        
        return jsonify({"uid": uid, "status": "completed", "result": data}), 200
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            return jsonify({"uid": uid, "status": "pending", "message": "Result not yet available"}), 202
        app.logger.exception(f"S3 error retrieving result for UID {uid}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)