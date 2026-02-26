# Nexus API - Quick Start Guide

Get up and running with Docker in 5 minutes! 🚀

## Prerequisites

- Docker Desktop installed and running
- Git (to clone the repository)

---

## Development (Local with Neon Local)

### 1. Copy environment file

```powershell
Copy-Item .env.development .env
```

### 2. Start the app

```powershell
docker-compose -f docker-compose.dev.yml up --build
```

### 3. Test it

```powershell
curl http://localhost:3000/health
```

**That's it!** Your API is running at http://localhost:3000 with Neon Local PostgreSQL.

### Run migrations

```powershell
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Stop the app

```powershell
docker-compose -f docker-compose.dev.yml down
```

---

## Production (with Neon Cloud)

### 1. Create Neon Cloud Database

- Sign up at https://neon.tech
- Create a new project
- Copy your connection string

### 2. Set environment variables

```powershell
$env:DATABASE_URL="postgres://user:password@ep-xyz-123.us-east-2.aws.neon.tech/dbname?sslmode=require"
$env:JWT_SECRET="your-super-secret-jwt-key"
```

### 3. Run migrations

```powershell
docker build -t nexus-api:latest .
docker run --rm -e DATABASE_URL=$env:DATABASE_URL nexus-api:latest npm run db:migrate
```

### 4. Start the app

```powershell
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Verify it's running

```powershell
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:3000/health
```

---

## Helper Scripts

We've provided convenient scripts to make it even easier:

### Development

```powershell
# Windows PowerShell
.\scripts\dev-start.ps1

# Linux/Mac
chmod +x scripts/dev-start.sh
./scripts/dev-start.sh
```

### Production

```powershell
# Windows PowerShell
.\scripts\prod-deploy.ps1

# Linux/Mac
chmod +x scripts/prod-deploy.sh
./scripts/prod-deploy.sh
```

---

## Useful Commands

### View logs

```powershell
# Development
docker-compose -f docker-compose.dev.yml logs -f

# Production
docker-compose -f docker-compose.prod.yml logs -f
```

### Access database (Development)

```powershell
docker-compose -f docker-compose.dev.yml exec neon-local psql -U postgres -d main
```

### Run commands in container

```powershell
# Development
docker-compose -f docker-compose.dev.yml exec app sh

# Production
docker-compose -f docker-compose.prod.yml exec app sh
```

---

## Environment Variables

| Variable       | Required | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string             |
| `JWT_SECRET`   | Yes      | Secret key for JWT tokens                |
| `NODE_ENV`     | No       | `development` or `production` (auto-set) |
| `PORT`         | No       | Port to run on (default: 3000)           |

---

## Troubleshooting

### Container won't start?

```powershell
# Check logs
docker-compose -f docker-compose.dev.yml logs

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### Can't connect to database?

```powershell
# Check if database is healthy
docker-compose -f docker-compose.dev.yml ps

# Test connection
docker-compose -f docker-compose.dev.yml exec app ping neon-local
```

### Port 3000 already in use?

```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Stop the process or change PORT in .env
```

---

## Next Steps

- Read the full [Docker Documentation](DOCKER.md) for detailed setup
- Check out the [API Documentation](README.md)
- Review [Security Best Practices](DOCKER.md#-security-best-practices)

---

**Need help?** Check the logs first, they usually tell you what went wrong! 🔍
