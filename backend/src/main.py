from fastapi import FastAPI, UploadFile, File, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from .models import Base, Image
from .database import engine, SessionLocal
from .auth import (
    get_db, create_user, auth_user,
    get_current_user, create_token
)
import os
from .aws import get_labels
from botocore.exceptions import NoCredentialsError, ClientError

Base.metadata.create_all(bind=engine)
app = FastAPI()

# Enable CORS for local frontend development. Adjust origins for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates directory (templates is located at ../templates relative to src)
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), '..', 'templates'))
@app.post("/api/signup")
def signup(username: str, password: str, db: Session = Depends(get_db)):
    user = create_user(db, username, password)
    return {"message": "ok"}

@app.post("/api/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = auth_user(db, username, password)
    if not user:
        return {"error": "invalid"}
    token = create_token(user)
    return {"token": token}

@app.post("/api/upload")
async def upload(
    file: UploadFile = File(...),
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content = await file.read()

    try:
        labels = get_labels(content)
    except NoCredentialsError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ClientError as e:
        raise HTTPException(status_code=502, detail=f"AWS error: {e}")

    img = Image(
        filename=file.filename,
        labels=",".join(labels),
        owner_id=user.id
    )
    db.add(img)
    db.commit()

    return {"filename": file.filename, "labels": labels}


@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request):
    """Serve a simple frontend to interact with signup/login/upload/list/delete."""
    return templates.TemplateResponse('dashboard.html', {"request": request})

@app.get("/api/images")
def list_images(
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    images = db.query(Image).filter(Image.owner_id == user.id).all()
    return [
        {
            "id": img.id,
            "filename": img.filename,
            "labels": img.labels.split(",")
        }
        for img in images
    ]

@app.delete("/api/images/{image_id}")
def delete_image(
    image_id: int,
    user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    img = db.query(Image).filter(
        Image.id == image_id,
        Image.owner_id == user.id
    ).first()

    if not img:
        return {"error": "not found"}

    db.delete(img)
    db.commit()
    return {"ok": True}
