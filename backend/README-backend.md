Backend README — CloudImageRecognization

This repo runs a FastAPI backend that can serve a server-rendered template (`templates/index.html`) and also exposes JSON endpoints (`/upload`, `/result/{id}`).

Quick run (local Python virtualenv)

1) Create and activate venv (if not already):

```powershell
cd d:\CloudImageRecognization\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

2) Create or update `.env` with your AWS values (do NOT commit credentials):

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=ap-southeast-2
BUCKET_NAME=your-bucket
SQS_QUEUE_URL=https://sqs.../queue-name
DYNAMO_TABLE=RecognitionResults
RESULT_TIMEOUT=30
```

3) Run the app with uvicorn:

```powershell
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

4) Visit:
- Server-rendered UI: http://localhost:8000/
- JSON APIs: POST http://localhost:8000/upload and GET http://localhost:8000/result/{id}

Docker

Build and run (example):

```powershell
cd d:\CloudImageRecognization\backend
docker build -t cloud-backend:dev .
docker run --env-file .env -p 8000:8000 cloud-backend:dev
```

Notes
- The backend reads AWS credentials from env vars or from AWS CLI config.
- If your worker writes results to S3 instead of DynamoDB, update the `/predict` polling logic accordingly.
- Remove any stray files named `app` (no extension) to avoid import confusion.
