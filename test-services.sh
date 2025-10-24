#!/bin/bash

echo "🧪 Testing Chat Microservices Application"
echo "========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_service() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$code" = "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($code)"
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected, Got: $code)"
    fi
}

echo -e "\n${YELLOW}🏥 Health Checks${NC}"
test_service "Frontend" "http://localhost:3000" "200"
test_service "Chat Service" "http://localhost:3001/health" "200"
test_service "Profile Service" "http://localhost:8081/health" "200"
test_service "Posts Service" "http://localhost:8083/health" "200"

echo -e "\n${YELLOW}🔐 User Service${NC}"
echo -n "Testing User Registration... "
response=$(curl -s -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser$(date +%s)\",\"email\":\"test$(date +%s)@example.com\",\"password\":\"password123\"}")

if echo "$response" | grep -q "successfully"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo -e "\n${GREEN}🎉 Testing Complete!${NC}"
