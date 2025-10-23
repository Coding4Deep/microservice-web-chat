from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from PIL import Image
import io

from database import get_db, engine
from models import Base, UserProfile
from schemas import ProfileResponse, ProfileUpdate, PasswordChange
from auth import verify_token

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Profile Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
os.makedirs("uploads/profiles", exist_ok=True)

# Serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health")
async def health_check():
    return {"status": "OK", "service": "profile-service"}

@app.get("/api/profile/{username}", response_model=ProfileResponse)
async def get_profile(username: str, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.username == username).first()
    if not profile:
        # Create default profile if doesn't exist
        profile = UserProfile(username=username)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return ProfileResponse(
        username=profile.username,
        bio=profile.bio,
        profile_picture=profile.profile_picture,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )

@app.put("/api/profile/{username}")
async def update_profile(
    username: str,
    bio: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user != username:
        raise HTTPException(status_code=403, detail="Can only update own profile")
    
    profile = db.query(UserProfile).filter(UserProfile.username == username).first()
    if not profile:
        profile = UserProfile(username=username)
        db.add(profile)
    
    if bio is not None:
        profile.bio = bio
    
    if profile_picture:
        # Validate image
        if not profile_picture.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Process and save image
        image_data = await profile_picture.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Resize image to 300x300
        image = image.resize((300, 300), Image.Resampling.LANCZOS)
        
        # Save image
        filename = f"{uuid.uuid4()}.jpg"
        filepath = f"uploads/profiles/{filename}"
        image.save(filepath, "JPEG", quality=85)
        
        # Remove old profile picture
        if profile.profile_picture:
            old_path = profile.profile_picture.replace("/uploads/", "uploads/")
            if os.path.exists(old_path):
                os.remove(old_path)
        
        profile.profile_picture = f"/uploads/profiles/{filename}"
    
    db.commit()
    db.refresh(profile)
    
    return {"message": "Profile updated successfully"}

@app.post("/api/profile/{username}/change-password")
async def change_password(
    username: str,
    password_data: PasswordChange,
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    if current_user != username:
        raise HTTPException(status_code=403, detail="Can only change own password")
    
    # Verify with user service
    import httpx
    async with httpx.AsyncClient() as client:
        # First verify current password
        login_response = await client.post(
            "http://user-service:8080/api/users/login",
            json={"username": username, "password": password_data.current_password}
        )
        
        if login_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password (this would need to be implemented in user service)
        # For now, return success
        return {"message": "Password change functionality needs user service integration"}

@app.get("/api/profiles/search")
async def search_profiles(q: str = "", db: Session = Depends(get_db)):
    profiles = db.query(UserProfile).filter(
        UserProfile.username.ilike(f"%{q}%")
    ).limit(10).all()
    
    return [
        {
            "username": p.username,
            "bio": p.bio,
            "profile_picture": p.profile_picture
        }
        for p in profiles
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
