@echo off
REM Water Quality System - Development Startup Script for Windows

echo 🌊 Starting Water Quality Prediction System...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed.
    pause
    exit /b 1
)

echo 📦 Building and starting all services...

REM Stop any existing containers
docker-compose down

REM Build and start in development mode
docker-compose -f docker-compose.dev.yml up --build

echo ✅ Services are starting up:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    ML API:   http://localhost:5001
echo    MongoDB:  localhost:27017
echo.
echo Press Ctrl+C to stop all services

pause