# Setup Instructions

## Prerequisites
- Docker and Docker Compose
- Java 17+ (for local development)
- Node.js 18+ (for local development)
- Maven (for Spring Boot service)

## Quick Start (Production)
```bash
# Clone and navigate to project
cd chat-microservices

# Build and start all services
./build.sh
```

## Development Setup

### 1. Start Infrastructure Services
```bash
docker-compose up postgres mongodb redis zookeeper kafka
```

### 2. Run User Service (Spring Boot)
```bash
cd user-service
mvn spring-boot:run
```

### 3. Run Chat Service (Node.js)
```bash
cd chat-service
npm install
npm start
```

### 4. Run Frontend (React)
```bash
cd frontend
npm install
npm start
```

## Service URLs
- **Frontend**: http://localhost:3000
- **User Service**: http://localhost:8080
- **Chat Service**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Kafka**: localhost:9092

## API Endpoints

### User Service (Port 8080)
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/validate` - Validate JWT token

### Chat Service (Port 3001)
- `GET /api/messages` - Get all messages
- `DELETE /api/messages/:id` - Delete specific message
- `DELETE /api/messages` - Clear all messages
- WebSocket events: `join`, `sendMessage`, `deleteMessage`, `clearChat`

## Features
- User registration and authentication with JWT
- Real-time messaging with Socket.IO
- Message persistence with MongoDB
- Message queuing with Kafka
- User activity tracking
- Message delete and clear chat functionality
- Responsive React frontend
- Microservice architecture with Docker orchestration
