# schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ImageOut(BaseModel):
    id: int
    filename: str
    filepath: str
    labels: Optional[List[dict]] = None
    created_at: datetime

    class Config:
        orm_mode = True
