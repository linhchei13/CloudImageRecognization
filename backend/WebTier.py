"""
FastAPI Backend for Hybrid Cloud Image Recognition
Replaces Flask appTier.py from OpenStack_AWS_Project
Maintains exact same logic and flow as original implementation
"""

import os
import base64
import uuid
import boto3
import logging
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# AWS Configuration (from original appTier.py)
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')

INPUT_QUEUE_URL = os.getenv('INPUT_QUEUE_URL', 'https://sqs.us-east-1.amazonaws.com/637902131290/InputQueue')
INPUT_QUEUE_NAME = os.getenv('INPUT_QUEUE_NAME', 'InputQueue')
OUTPUT_QUEUE_URL = os.getenv('OUTPUT_QUEUE_URL', 'https://sqs.us-east-1.amazonaws.com/637902131290/OutputQueue')

# S3 Configuration (from original recognition.py)
INPUT_BUCKET = os.getenv('INPUT_BUCKET', 'inputbucket117')
OUTPUT_BUCKET = os.getenv('OUTPUT_BUCKET', 'outputbucket117')

# Paths
REQUESTS_FILES_PATH = os.getenv('REQUESTS_FILES_PATH', 'requests_files')
CLASSIFIER_PATH = os.getenv('CLASSIFIER_PATH', '/home/ubuntu/classifier')

# Create requests_files directory if it doesn't exist
Path(REQUESTS_FILES_PATH).mkdir(exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="Hybrid Cloud Image Recognition API",
    description="FastAPI replacement for Flask appTier.py",
    version="1.0.0"
)

# Initialize AWS clients (from original appTier.py)
session = boto3.session.Session()
sqs_res = session.resource(
    "sqs",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

sqs_client = boto3.client(
    "sqs",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

s3 = boto3.resource(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

input_bucket = s3.Bucket(INPUT_BUCKET)
output_bucket = s3.Bucket(OUTPUT_BUCKET)

MESSAGE_ATTRIBUTES = ['ImageName', 'UID']


@app.post("/")
async def read_image_file(image_file: UploadFile = File(...)):
    """
    Main endpoint - matches original Flask appTier.py POST / endpoint
    
    Flow (from original code):
    1. Receive image file
    2. Save temporarily
    3. Encode to Base64
    4. Send to SQS Input Queue with ImageName and UID attributes
    5. Wait for result file (created by outputQueueListener.py)
    6. Return result
    
    Args:
        image_file: Image file uploaded by user
        
    Returns:
        Classification result as plain text
    """
    
    try:
        # Check if file has filename (from original appTier.py line 27)
        if image_file.filename == '':
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Read file content
        content = await image_file.read()
        
        # Save temporarily (from original appTier.py line 28)
        temp_path = os.path.join(REQUESTS_FILES_PATH, image_file.filename)
        with open(temp_path, 'wb') as f:
            f.write(content)
        
        # Encode to Base64 (from original appTier.py line 30)
        encoded_string = base64.b64encode(content).decode('utf-8')
        
        # Generate UUID (from original appTier.py line 33)
        msg_uuid = str(uuid.uuid4())
        
        # Get input queue (from original appTier.py line 24)
        input_q = sqs_res.get_queue_by_name(QueueName=INPUT_QUEUE_NAME)
        
        # Send message to SQS (from original appTier.py line 37-46)
        try:
            input_q.send_message(
                MessageBody=encoded_string,
                MessageAttributes={
                    'ImageName': {
                        'StringValue': image_file.filename,
                        'DataType': 'String'
                    },
                    'UID': {
                        'StringValue': msg_uuid,
                        'DataType': 'String'
                    }
                }
            )
            logger.info(f"Message sent for {image_file.filename} at {datetime.now()}")
        
        except Exception as e:
            logger.error(f"Exception while sending message to SQS: {image_file.filename} ::: {repr(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to send message to SQS: {str(e)}")
        
        # Clean up temporary file (from original appTier.py line 53)
        os.system(f"rm {temp_path}")
        
        # Wait for result (from original appTier.py line 57-64)
        # This polls for a file created by outputQueueListener.py
        res = None
        max_attempts = 300  # 5 minutes with 1 second intervals
        attempts = 0
        
        while res is None and attempts < max_attempts:
            result_file_path = os.path.join(REQUESTS_FILES_PATH, f"{msg_uuid}.txt")
            
            if os.path.exists(result_file_path):
                with open(result_file_path) as file:
                    res = file.read()
                    logger.info(f"Result for {image_file.filename}: {res}")
                
                if res:
                    # Clean up result file (from original appTier.py line 63)
                    os.system(f"rm {result_file_path}")
                    return PlainTextResponse(res)
            
            # Wait before next check
            import asyncio
            await asyncio.sleep(1)
            attempts += 1
        
        # Timeout
        logger.error(f"Timeout waiting for result for {image_file.filename}")
        raise HTTPException(status_code=504, detail="Processing timeout - no result received")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in read_image_file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Hybrid Cloud Image Recognition API",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Hybrid Cloud Image Recognition API",
        "version": "1.0.0",
        "description": "FastAPI replacement for Flask appTier.py",
        "endpoints": {
            "upload": "POST /",
            "health": "GET /health",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8000))
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True
    )
