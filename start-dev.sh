#!/bin/bash

# Water Quality System - Development Startup Script

echo \"🌊 Starting Water Quality Prediction System...\"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo \"❌ Docker is not running. Please start Docker first.\"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo \"❌ Docker Compose is not installed.\"
    exit 1
fi

echo \"📦 Building and starting all services...\"

# Stop any existing containers
docker-compose down

# Build and start in development mode
docker-compose -f docker-compose.dev.yml up --build

echo \"✅ Services are starting up:\"
echo \"   Frontend: http://localhost:3000\"
echo \"   Backend:  http://localhost:5000\"
echo \"   ML API:   http://localhost:5001\"
echo \"   MongoDB:  localhost:27017\"
echo \"\"
echo \"Press Ctrl+C to stop all services\"

# Keep script running
wait