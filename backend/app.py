# app.py (Đã cập nhật 2 buckets)
import os
import uuid
import time
import json
from datetime import datetime
from flask import Flask, request, jsonify, render_template
import boto3
from botocore.exceptions import ClientError

# --- THAY ĐỔI 1: Đọc 2 biến bucket mới ---
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_IN = os.getenv("S3_BUCKET_IN")   # Bucket ảnh vào
S3_BUCKET_OUT = os.getenv("S3_BUCKET_OUT") # Bucket kết quả ra
INPUT_QUEUE_URL = os.getenv("INPUT_QUEUE_URL")
RESULT_S3_PREFIX = os.getenv("RESULT_S3_PREFIX", "results/")
UPLOAD_S3_PREFIX = os.getenv("UPLOAD_S3_PREFIX", "requests/")
RESULT_TIMEOUT = int(os.getenv("RESULT_TIMEOUT", "30"))

# Cập nhật kiểm tra
if not S3_BUCKET_IN or not S3_BUCKET_OUT or not INPUT_QUEUE_URL:
    raise RuntimeError("Missing env vars: S3_BUCKET_IN, S3_BUCKET_OUT, INPUT_QUEUE_URL")
# --- KẾT THÚC THAY ĐỔI 1 ---

session = boto3.session.Session(region_name=AWS_REGION)
s3 = session.client("s3")
sqs = session.client("sqs")

app = Flask(__name__)

# (Hàm upload_file_to_s3 và s3_object_exists không đổi)
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

# (API "/result/<uid>" nếu bạn đã thêm thì cũng cần sửa S3_BUCKET -> S3_BUCKET_OUT)
# (API "/" (GET) để render 'index.html' không đổi)
@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

# --- THAY ĐỔI 2: Sửa API POST ---
@app.route("/predict", methods=["POST"]) # Hoặc "/" nếu bạn dùng file app.py cũ
def submit_image():
    if 'image_file' not in request.files:
        return render_template("index.html", error="Không có file nào được cung cấp")

    upload_file = request.files['image_file']
    if upload_file.filename == "":
        return render_template("index.html", error="Tên file rỗng")

    uid = str(uuid.uuid4())
    s3_key = f"{UPLOAD_S3_PREFIX}{uid}/{upload_file.filename}"

    # Sửa: Upload lên BUCKET_IN
    ok = upload_file_to_s3(upload_file.stream, S3_BUCKET_IN, s3_key)
    if not ok:
        return render_template("index.html", error="Lỗi khi upload S3")

    # Sửa: Gửi cả 2 bucket name cho worker qua SQS
    message_payload = {
        "uid": uid,
        "s3_bucket_in": S3_BUCKET_IN,   # Bucket ảnh gốc
        "s3_key_in": s3_key,           # Key ảnh gốc
        "s3_bucket_out": S3_BUCKET_OUT, # Bucket chứa kết quả
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
        return render_template("index.html", error="Lỗi khi gửi SQS")

    # Sửa: Polling kết quả từ BUCKET_OUT
    result_key = f"{RESULT_S3_PREFIX}{uid}.json"
    poll_interval = 1.0
    deadline = time.time() + RESULT_TIMEOUT
    while time.time() < deadline:
        if s3_object_exists(S3_BUCKET_OUT, result_key): # Chờ ở BUCKET_OUT
            res_obj = s3.get_object(Bucket=S3_BUCKET_OUT, Key=result_key) # Lấy từ BUCKET_OUT
            body = res_obj['Body'].read().decode('utf-8')
            try:
                data = json.loads(body)
                first_label = "Không tìm thấy nhãn"
                if data.get('labels'):
                    first_label_data = data.get('labels')[0]
                    prediction_text = f"{first_label_data['name']} ({first_label_data['confidence']:.2f}%)"
                else:
                    prediction_text = "Không nhận diện được đối tượng"
                
                return render_template("index.html", prediction=prediction_text)
            except Exception as e:
                app.logger.exception("Error parsing result JSON")
                return render_template("index.html", error=f"Lỗi đọc kết quả: {e}")
        
        time.sleep(poll_interval)
        poll_interval = min(poll_interval * 1.5, 5.0)

    return render_template("index.html", error="Quá thời gian chờ xử lý (30 giây)")
# --- KẾT THÚC THAY ĐỔI 2 ---

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)