Clone repository
```powershell
git clone https://github.com/linhchei13/CloudReco.git
```
**Backend:**

Quick run (local Python virtualenv)

1) Create and activate venv (if not already):

```powershell
cd d:\CloudImageRecognization\backend
python -m venv .venv
.\.venv\Scripts\activate (Window) or source .vrnv/bin/activate (Linux)
pip install -r requirements.txt
```

2) Create or update `.env` with your AWS values (do NOT commit credentials):

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=ap-southeast-2
BUCKET_NAME=your-bucket
SWIFT_AUTH_URL=http:.../identity
SWIFT_USER=user_name
SWIFT_KEY=swift_key
SWIFT_TENANT=your_project
SWIFT_CONTAINER=your_container
```

3) Run the app with uvicorn:

```powershell
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

4) Visit:

- Server-rendered UI: http://localhost:8000/

**Frontend:**

```powershell
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000/
