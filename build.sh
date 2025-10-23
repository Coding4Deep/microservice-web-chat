#!/bin/bash

echo "Building Chat Microservices Application..."

# Build Spring Boot service
echo "Building User Service..."
cd user-service
mvn clean package -DskipTests
cd ..

# Build and start all services
echo "Starting all services with Docker Compose..."
docker-compose up --build

echo "Application started!"
echo "Frontend: http://localhost:3000"
echo "User Service: http://localhost:8080"
echo "Chat Service: http://localhost:3001"
