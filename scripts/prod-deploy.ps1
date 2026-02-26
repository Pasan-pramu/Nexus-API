#!/usr/bin/env pwsh
# Deploy production environment with Neon Cloud

param(
    [switch]$SkipMigrations = $false
)

Write-Host "🚀 Deploying Nexus API Production Environment..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if environment variables are set
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  DATABASE_URL environment variable not set." -ForegroundColor Yellow
    Write-Host "Please set it before running this script:" -ForegroundColor Yellow
    Write-Host '$env:DATABASE_URL="postgres://user:password@ep-xyz-123.us-east-2.aws.neon.tech/dbname?sslmode=require"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or ensure .env.production is configured." -ForegroundColor Yellow
}

if (-not $env:JWT_SECRET) {
    Write-Host "⚠️  JWT_SECRET environment variable not set." -ForegroundColor Yellow
    Write-Host "Please set it before running this script:" -ForegroundColor Yellow
    Write-Host '$env:JWT_SECRET="your-secure-jwt-secret"' -ForegroundColor Cyan
    Write-Host ""
}

# Build the production image
Write-Host "🏗️  Building production Docker image..." -ForegroundColor Cyan
docker build -t nexus-api:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image." -ForegroundColor Red
    exit 1
}

# Run migrations if not skipped
if (-not $SkipMigrations) {
    Write-Host ""
    Write-Host "📊 Running database migrations..." -ForegroundColor Cyan
    docker run --rm --env-file .env.production nexus-api:latest npm run db:migrate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Database migrations failed." -ForegroundColor Red
        exit 1
    }
}

# Start production containers
Write-Host ""
Write-Host "🐳 Starting production containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start production containers." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Production deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
Write-Host "🔍 Check status: docker-compose -f docker-compose.prod.yml ps" -ForegroundColor Cyan
Write-Host "🛑 Stop: docker-compose -f docker-compose.prod.yml down" -ForegroundColor Cyan
