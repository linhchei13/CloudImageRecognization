import boto3
import os
from dotenv import load_dotenv
from botocore.exceptions import NoCredentialsError, ClientError

load_dotenv()

# --- CẤU HÌNH AWS (hỗ trợ nhiều tên biến môi trường phổ biến) ---
# Prefer the standard AWS env var names if present
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('AWS_ACCESS_KEY') or os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('AWS_SECRET_KEY')
REGION = os.getenv('AWS_DEFAULT_REGION') or os.getenv('AWS_REGION') or 'ap-southeast-2'
BUCKET_NAME = os.getenv('BUCKET_NAME')
QUEUE_URL = os.getenv('SQS_QUEUE_URL')
DYNAMO_TABLE_NAME = os.getenv('DYNAMO_TABLE', 'RecognitionResults')


def _make_rekognition_client():
    """Create a boto3 Rekognition client. If explicit credentials are provided via
    env vars it will use them; otherwise boto3 will fall back to its normal
    credential chain (shared credentials file, IAM role, etc.)."""
    if AWS_ACCESS_KEY and AWS_SECRET_KEY:
        session = boto3.Session(
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            region_name=REGION,
        )
    else:
        # Let boto3 find credentials (env, ~/.aws/credentials, instance role)
        session = boto3.Session(region_name=REGION)

    return session.client('rekognition')


def get_labels(img_bytes, max_labels: int = 5, min_confidence: int = 80):
    """Detect labels from image bytes using AWS Rekognition.

    Raises NoCredentialsError if no credentials are available.
    """
    client = _make_rekognition_client()
    try:
        response = client.detect_labels(
            Image={"Bytes": img_bytes},
            MaxLabels=max_labels,
            MinConfidence=min_confidence,
        )
    except NoCredentialsError:
        # Surface a clearer error to the caller
        raise NoCredentialsError("AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or configure the AWS CLI credentials or an IAM role.")
    except ClientError as e:
        # propagate other AWS client errors
        raise

    labels = [l.get("Name") for l in response.get("Labels", []) if l.get("Name")]
    return labels
