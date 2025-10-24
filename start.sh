#!/bin/bash

echo "🚀 Starting Chat Microservices Application"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📦 Stopping any existing containers...${NC}"
docker compose down

echo -e "${YELLOW}🏗️ Starting infrastructure services...${NC}"
docker compose up -d postgres mongodb redis zookeeper kafka

echo -e "${YELLOW}⏳ Waiting for infrastructure to be ready...${NC}"
sleep 15

echo -e "${YELLOW}🧹 Cleaning up old data...${NC}"
docker exec chat-microservices-mongodb-1 mongosh --quiet --eval "use chatdb; db.messages.drop();" 2>/dev/null || true

echo -e "${YELLOW}🚀 Starting application services...${NC}"
docker compose up -d user-service
sleep 5
docker compose up -d chat-service profile-service posts-service monitoring-service
sleep 5
docker compose up -d frontend

echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

echo -e "${GREEN}✅ Application started successfully!${NC}"
echo ""
echo -e "${YELLOW}📱 Access your application at:${NC}"
echo "• Frontend: http://localhost:3000"
echo "• User Service: http://localhost:8080"
echo "• Chat Service: http://localhost:3001"
echo "• Profile Service: http://localhost:8081"
echo "• Posts Service: http://localhost:8083"
echo "• Monitoring: http://localhost:8082"
echo ""
echo -e "${YELLOW}🧪 Run tests with:${NC} ./test-services.sh"
echo -e "${YELLOW}🛑 Stop with:${NC} docker compose down"
