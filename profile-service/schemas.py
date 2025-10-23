from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProfileResponse(BaseModel):
    username: str
    bio: Optional[str] = ""
    profile_picture: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
