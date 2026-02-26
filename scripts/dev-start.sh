#!/bin/bash

# Development startup script for Nexus API
# This script starts the application in development mode with Neon Cloud Database

echo "🚀 Starting Nexus API in Development Mode"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please create a .env file with your environment variables."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

echo "📦 Building and starting development container..."
echo "   - Using Neon Cloud Database (remote)"
echo "   - Application will run with hot reload enabled"
echo ""

# Start development environment
docker compose -f docker-compose.dev.yml up --build

echo ""
echo "🎉 Development environment started!"
echo "   Application: http://localhost:3000"
echo ""
echo "To stop the environment, press Ctrl+C or run: docker compose -f docker-compose.dev.yml down"
