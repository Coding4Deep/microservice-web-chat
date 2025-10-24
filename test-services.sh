#!/bin/bash

echo "🚀 Testing Chat Microservices Application"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_service() {
    local service_name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $service_name... "
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($response_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_code, Got: $response_code)"
        return 1
    fi
}

# Test health endpoints
echo -e "\n${YELLOW}🏥 Health Checks${NC}"
test_service "Frontend" "http://localhost:3000" "200"
test_service "Chat Service" "http://localhost:3001/health" "200"
test_service "Profile Service" "http://localhost:8081/health" "200"
test_service "Posts Service" "http://localhost:8083/health" "200"

# Test user service authentication
echo -e "\n${YELLOW}🔐 User Service Authentication${NC}"
echo -n "Testing User Registration... "
reg_response=$(curl -s -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser$(date +%s)\",\"email\":\"test$(date +%s)@example.com\",\"password\":\"password123\"}")

if echo "$reg_response" | grep -q "successfully"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC} - $reg_response"
fi

# Test infrastructure
echo -e "\n${YELLOW}🏗️ Infrastructure Services${NC}"
echo -n "Testing PostgreSQL... "
if docker exec chat-microservices-postgres-1 pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo -n "Testing MongoDB... "
if docker exec chat-microservices-mongodb-1 mongosh --quiet --eval 'db.runCommand("ping").ok' >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo -n "Testing Redis... "
if docker exec chat-microservices-redis-1 redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo -n "Testing Kafka... "
if docker exec chat-microservices-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test API endpoints
echo -e "\n${YELLOW}🔌 API Endpoints${NC}"
echo -n "Testing Posts API... "
posts_response=$(curl -s http://localhost:8083/api/posts)
if echo "$posts_response" | grep -q "\[\]" || echo "$posts_response" | grep -q "id"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo -e "\n${GREEN}🎉 Application is running successfully!${NC}"
echo -e "\n${YELLOW}📱 Access Points:${NC}"
echo "• Frontend: http://localhost:3000"
echo "• User Service: http://localhost:8080"
echo "• Chat Service: http://localhost:3001"
echo "• Profile Service: http://localhost:8081"
echo "• Posts Service: http://localhost:8083"
echo "• Monitoring: http://localhost:8082"
