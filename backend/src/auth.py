from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import jwt
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import User
import os
from dotenv import load_dotenv
load_dotenv()

SECRET = os.getenv('JWT_SECRET', 'supersecretkey')
oauth = OAuth2PasswordBearer(tokenUrl="/login")

# Use argon2 (recommended) to avoid bcrypt 72-byte input limit and backend issues
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_user(db, username, password):
    hashed = pwd_context.hash(password)
    user = User(username=username, password_hash=hashed)
    db.add(user)
    db.commit()
    return user

def auth_user(db, username, password):
    user = db.query(User).filter(User.username == username).first()
    if not user or not pwd_context.verify(password, user.password_hash):
        return False
    return user

def create_token(user):
    payload = {"id": user.id, "username": user.username}
    return jwt.encode(payload, SECRET, algorithm="HS256")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth)):
    try:
        data = jwt.decode(token, SECRET, algorithms=["HS256"])
    except:
        raise HTTPException(401, "Invalid token")

    return db.query(User).filter(User.id == data["id"]).first()
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)