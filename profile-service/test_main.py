import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import tempfile
import os
from unittest.mock import patch, AsyncMock

from main import app
from database import get_db
from models import Base

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def mock_auth():
    with patch('auth.verify_token', return_value="testuser"):
        yield

class TestProfileService:
    
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "OK", "service": "profile-service"}
    
    def test_get_profile_creates_default(self, client):
        response = client.get("/api/profile/newuser")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newuser"
        assert data["bio"] == ""
        assert data["profile_picture"] is None
    
    def test_get_existing_profile(self, client):
        # First create a profile
        client.get("/api/profile/testuser")
        
        # Get it again
        response = client.get("/api/profile/testuser")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
    
    def test_update_profile_bio(self, client, mock_auth):
        response = client.put(
            "/api/profile/testuser",
            data={"bio": "This is my test bio"}
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Profile updated successfully"
        
        # Verify update
        profile_response = client.get("/api/profile/testuser")
        assert profile_response.json()["bio"] == "This is my test bio"
    
    def test_update_profile_picture(self, client, mock_auth):
        # Create a test image
        from PIL import Image
        import io
        
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        response = client.put(
            "/api/profile/testuser",
            files={"profile_picture": ("test.jpg", img_bytes, "image/jpeg")}
        )
        assert response.status_code == 200
        
        # Verify profile picture was set
        profile_response = client.get("/api/profile/testuser")
        assert profile_response.json()["profile_picture"] is not None
    
    def test_update_profile_unauthorized(self, client):
        with patch('auth.verify_token', return_value="otheruser"):
            response = client.put(
                "/api/profile/testuser",
                data={"bio": "Unauthorized update"}
            )
            assert response.status_code == 403
    
    def test_invalid_image_upload(self, client, mock_auth):
        response = client.put(
            "/api/profile/testuser",
            files={"profile_picture": ("test.txt", b"not an image", "text/plain")}
        )
        assert response.status_code == 400
        assert "File must be an image" in response.json()["detail"]
    
    @patch('httpx.AsyncClient')
    def test_change_password_success(self, mock_client, client, mock_auth):
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
        
        response = client.post(
            "/api/profile/testuser/change-password",
            json={
                "current_password": "oldpass",
                "new_password": "newpass"
            }
        )
        assert response.status_code == 200
    
    @patch('httpx.AsyncClient')
    def test_change_password_wrong_current(self, mock_client, client, mock_auth):
        mock_response = AsyncMock()
        mock_response.status_code = 400
        mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
        
        response = client.post(
            "/api/profile/testuser/change-password",
            json={
                "current_password": "wrongpass",
                "new_password": "newpass"
            }
        )
        assert response.status_code == 400
    
    def test_search_profiles(self, client):
        # Create some test profiles
        client.get("/api/profile/alice")
        client.get("/api/profile/bob")
        client.get("/api/profile/charlie")
        
        response = client.get("/api/profiles/search?q=a")
        assert response.status_code == 200
        data = response.json()
        usernames = [p["username"] for p in data]
        assert "alice" in usernames
        assert "charlie" in usernames
    
    def test_search_profiles_empty_query(self, client):
        response = client.get("/api/profiles/search")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

class TestAuthIntegration:
    
    @patch('httpx.AsyncClient')
    def test_valid_token(self, mock_client):
        from auth import verify_token
        from fastapi.security import HTTPAuthorizationCredentials
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"valid": True, "username": "testuser"}
        mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
        
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid_token")
        
        async def test():
            result = await verify_token(credentials)
            assert result == "testuser"
        
        asyncio.run(test())
    
    @patch('httpx.AsyncClient')
    def test_invalid_token(self, mock_client):
        from auth import verify_token
        from fastapi.security import HTTPAuthorizationCredentials
        from fastapi import HTTPException
        
        mock_response = AsyncMock()
        mock_response.status_code = 401
        mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
        
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid_token")
        
        async def test():
            with pytest.raises(HTTPException) as exc_info:
                await verify_token(credentials)
            assert exc_info.value.status_code == 401
        
        asyncio.run(test())

class TestImageProcessing:
    
    def test_image_resize(self, client, mock_auth):
        from PIL import Image
        import io
        
        # Create a large test image
        img = Image.new('RGB', (1000, 800), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        response = client.put(
            "/api/profile/testuser",
            files={"profile_picture": ("large.jpg", img_bytes, "image/jpeg")}
        )
        assert response.status_code == 200
        
        # Verify the image was processed (we can't easily check size in test)
        profile_response = client.get("/api/profile/testuser")
        assert profile_response.json()["profile_picture"] is not None

if __name__ == "__main__":
    pytest.main([__file__])
