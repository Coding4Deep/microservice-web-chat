#!/bin/bash

echo "🚀 Starting Chat Microservices Application"
echo "=========================================="

# Stop existing containers
docker compose down

# Start infrastructure
echo "📦 Starting infrastructure..."
docker compose up -d postgres mongodb redis zookeeper kafka
sleep 15

# Start services
echo "🚀 Starting services..."
docker compose up -d user-service chat-service profile-service posts-service monitoring-service
sleep 10

docker compose up -d frontend
sleep 5

echo "✅ Application started!"
echo ""
echo "📱 Access Points:"
echo "• Frontend: http://localhost:3000"
echo "• User Service: http://localhost:8080"
echo "• Chat Service: http://localhost:3001"
echo "• Profile Service: http://localhost:8081"
echo "• Posts Service: http://localhost:8083"
echo "• Monitoring: http://localhost:8082"
