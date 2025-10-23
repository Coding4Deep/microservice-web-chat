# Real-Time Chat Microservices Application

## Architecture
- **Service A**: Spring Boot (User Management, Auth, Dashboard) + PostgreSQL
- **Service B**: Node.js (Real-time Chat) + Socket.IO + Kafka + MongoDB + Redis
- **Frontend**: React (Login, Dashboard, Chat UI)
- **Orchestration**: Docker Compose

## Services
1. **user-service** (Port 8080): Spring Boot + PostgreSQL
2. **chat-service** (Port 3001): Node.js + Socket.IO + Kafka + MongoDB + Redis
3. **frontend** (Port 3000): React App

## Quick Start
```bash
docker-compose up --build
```

Access: http://localhost:3000
