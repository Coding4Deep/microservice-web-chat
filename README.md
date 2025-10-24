# Chat Microservices Application

A production-ready microservices-based chat application with real-time messaging, user management, posts sharing, and comprehensive monitoring.

## Architecture

- **User Service** (Spring Boot) - Authentication & User Management
- **Chat Service** (Node.js) - Real-time messaging with Socket.IO
- **Posts Service** (Go) - Image sharing with captions
- **Profile Service** (Python FastAPI) - User profiles & image management
- **Monitoring Service** (Spring Boot) - System monitoring & health checks
- **Frontend** (React) - Web interface

## Quick Start

```bash
# Start all services (recommended)
./start.sh

# Or manually start services
docker compose up -d

# Test all services
./test-services.sh

# Access application
http://localhost:3000
```

## Services

| Service | Port | Technology | Purpose | Status |
|---------|------|------------|---------|--------|
| Frontend | 3000 | React | Web Interface | ✅ Working |
| User Service | 8080 | Spring Boot | Authentication | ✅ Working |
| Chat Service | 3001 | Node.js | Real-time Chat | ✅ Working |
| Posts Service | 8083 | Go | Image Sharing | ✅ Working |
| Profile Service | 8081 | Python FastAPI | User Profiles | ✅ Working |
| Monitoring | 8082 | Spring Boot | System Health | ✅ Working |

## Features

- ✅ User Registration & Authentication (JWT)
- ✅ Real-time Chat (Public & Private)
- ✅ Image Posts with Captions
- ✅ User Profiles with Image Upload
- ✅ System Monitoring Dashboard
- ✅ **Online Users Tracking** (Real-time via Socket.IO)
- ✅ Comprehensive Test Coverage
- ✅ Production Security

## Online Users Feature

The application tracks users who are actively connected via Socket.IO:

- **Real-time tracking**: Users are tracked when they visit Dashboard or Chat pages
- **Live updates**: Online status updates automatically across all connected clients
- **API access**: Check online users via `GET /api/users/active`
- **Health monitoring**: View online count in `GET /health` endpoint

**Note**: Users must visit the Dashboard or Chat pages to be counted as "online" - simply being logged in is not sufficient.

## Testing

```bash
# Run comprehensive tests
./test-services.sh

# Run individual service tests
cd user-service && mvn test jacoco:report
cd ../chat-service && npm test
cd ../posts-service && go test ./...
```

## API Examples

### User Registration
```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","email":"user@example.com","password":"password123"}'
```

### User Login
```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"password123"}'
```

### Get Posts
```bash
curl http://localhost:8083/api/posts
```

## Security

- JWT-based authentication
- Protected endpoints
- CORS configuration
- Input validation
- Secure password hashing

## Monitoring

Access monitoring dashboard at http://localhost:3000/monitoring to view:
- Service health status
- Resource usage
- Database connections
- System metrics

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, 8080-8083, 5432, 27017, 6379, 9092 are available
2. **Docker issues**: Run `docker compose down` then `./start.sh`
3. **Database issues**: Clear data with `docker volume prune` (⚠️ removes all data)

### Health Checks

All services provide health endpoints:
- Chat Service: `http://localhost:3001/health`
- Profile Service: `http://localhost:8081/health`
- Posts Service: `http://localhost:8083/health`

### Logs

View service logs:
```bash
docker logs chat-microservices-[service-name]-1
```

## Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Java 17+ (for Spring Boot services)
- Go 1.21+ (for Posts service)
- Python 3.11+ (for Profile service)

### Local Development
```bash
# Start infrastructure only
docker compose up -d postgres mongodb redis zookeeper kafka

# Run services locally for development
# (Configure environment variables accordingly)
```

## Production Deployment

For production deployment:
1. Update environment variables in `docker-compose.yml`
2. Use proper secrets management
3. Configure SSL/TLS certificates
4. Set up proper monitoring and logging
5. Configure backup strategies for databases
