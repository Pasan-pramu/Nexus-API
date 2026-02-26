#!/usr/bin/env pwsh
# Start development environment with Neon Local

Write-Host "🚀 Starting Nexus API Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env.development exists
if (-not (Test-Path ".env.development")) {
    Write-Host "❌ .env.development file not found!" -ForegroundColor Red
    exit 1
}

# Copy .env.development to .env if .env doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Copying .env.development to .env..." -ForegroundColor Yellow
    Copy-Item ".env.development" ".env"
}

# Start docker-compose
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml up --build

Write-Host ""
Write-Host "✅ Development environment stopped." -ForegroundColor Green
