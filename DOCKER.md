# Nexus API - Docker Setup Guide

This guide explains how to run the Nexus API using Docker with different database configurations for development and production environments.

## 🏗️ Architecture Overview

### Development Environment
- **Application**: Node.js Express API (Dockerized)
- **Database**: **Neon Local** (PostgreSQL proxy running in Docker)
- **Connection**: `postgres://postgres:postgres@neon-local:5432/main`
- **Features**: Local development, ephemeral branches, hot-reloading

### Production Environment
- **Application**: Node.js Express API (Dockerized)
- **Database**: **Neon Cloud** (Serverless PostgreSQL)
- **Connection**: Cloud connection string from Neon dashboard
- **Features**: Auto-scaling, serverless, high availability

---

## 📋 Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)
- Neon Cloud account for production ([Sign up](https://neon.tech))

---

## 🚀 Development Setup (with Neon Local)

### 1. Configure Environment Variables

Copy the development environment file:
```powershell
Copy-Item .env.development .env
```

Or on Unix/Mac:
```bash
cp .env.development .env
```

The `.env.development` file contains:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://postgres:postgres@neon-local:5432/main
JWT_SECRET=your-development-jwt-secret-change-this
```

### 2. Start the Development Environment

```powershell
docker-compose -f docker-compose.dev.yml up --build
```

This command will:
- Build the application Docker image
- Start Neon Local PostgreSQL proxy
- Start the API server
- Wait for database health check before starting the app

### 3. Verify the Setup

Check if services are running:
```powershell
docker-compose -f docker-compose.dev.yml ps
```

Test the API:
```powershell
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-26T19:18:06.000Z",
  "uptime": 123.456
}
```

### 4. Run Database Migrations

Execute migrations inside the running container:
```powershell
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

Or generate new migrations:
```powershell
docker-compose -f docker-compose.dev.yml exec app npm run db:generate
```

### 5. Access Drizzle Studio (Optional)

```powershell
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

Then open http://localhost:4983 in your browser.

### 6. View Logs

```powershell
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Application only
docker-compose -f docker-compose.dev.yml logs -f app

# Neon Local only
docker-compose -f docker-compose.dev.yml logs -f neon-local
```

### 7. Stop the Development Environment

```powershell
docker-compose -f docker-compose.dev.yml down
```

To remove volumes (delete database data):
```powershell
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🌐 Production Setup (with Neon Cloud)

### 1. Create a Neon Cloud Database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string from the dashboard
   - Example: `postgres://user:password@ep-xyz-123.us-east-2.aws.neon.tech/dbname?sslmode=require`

### 2. Configure Environment Variables

**Option A: Using .env.production file**

Edit `.env.production` and add your Neon Cloud credentials:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://your-user:your-password@ep-xyz-123.us-east-2.aws.neon.tech/your-dbname?sslmode=require
JWT_SECRET=your-production-jwt-secret-use-strong-random-string
```

**Option B: Using environment variables (Recommended for CI/CD)**

Export environment variables before running docker-compose:
```powershell
$env:DATABASE_URL="postgres://your-user:your-password@ep-xyz-123.us-east-2.aws.neon.tech/your-dbname?sslmode=require"
$env:JWT_SECRET="your-production-jwt-secret"
```

On Unix/Mac:
```bash
export DATABASE_URL="postgres://your-user:your-password@ep-xyz-123.us-east-2.aws.neon.tech/your-dbname?sslmode=require"
export JWT_SECRET="your-production-jwt-secret"
```

### 3. Run Database Migrations

Before starting the production service, run migrations:
```powershell
# Build the image first
docker build -t nexus-api:latest .

# Run migrations
docker run --rm --env-file .env.production nexus-api:latest npm run db:migrate
```

### 4. Start the Production Environment

```powershell
docker-compose -f docker-compose.prod.yml up -d
```

The `-d` flag runs containers in detached mode (background).

### 5. Verify Production Deployment

Check container status:
```powershell
docker-compose -f docker-compose.prod.yml ps
```

Test the health endpoint:
```powershell
curl http://localhost:3000/health
```

View logs:
```powershell
docker-compose -f docker-compose.prod.yml logs -f app
```

### 6. Stop the Production Environment

```powershell
docker-compose -f docker-compose.prod.yml down
```

---

## 🔄 Switching Between Environments

### Development → Production
```powershell
# Stop development
docker-compose -f docker-compose.dev.yml down

# Start production (ensure .env.production is configured)
docker-compose -f docker-compose.prod.yml up -d
```

### Production → Development
```powershell
# Stop production
docker-compose -f docker-compose.prod.yml down

# Start development
docker-compose -f docker-compose.dev.yml up
```

---

## 🛠️ Useful Commands

### Rebuild Images
```powershell
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Execute Commands Inside Container
```powershell
# Development
docker-compose -f docker-compose.dev.yml exec app sh

# Production
docker-compose -f docker-compose.prod.yml exec app sh
```

### Database Connection from Host

**Development (Neon Local):**
```powershell
psql postgres://postgres:postgres@localhost:5432/main
```

**Production:**
Use the connection string from your Neon Cloud dashboard.

### Clean Up Everything
```powershell
# Remove all containers, networks, and volumes
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.prod.yml down -v

# Remove images
docker rmi nexus-api-dev nexus-api-prod
```

---

## 📊 Environment Variables Reference

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Node environment |
| `PORT` | `3000` | `3000` | Application port |
| `DATABASE_URL` | Neon Local URL | Neon Cloud URL | PostgreSQL connection string |
| `JWT_SECRET` | Dev secret | Secure secret | JWT signing key |

---

## 🐛 Troubleshooting

### Issue: Cannot connect to database
**Development:**
- Ensure Neon Local container is healthy: `docker-compose -f docker-compose.dev.yml ps`
- Check logs: `docker-compose -f docker-compose.dev.yml logs neon-local`
- Verify network connectivity: `docker-compose -f docker-compose.dev.yml exec app ping neon-local`

**Production:**
- Verify `DATABASE_URL` is set correctly
- Ensure Neon Cloud database is accessible
- Check firewall rules and network connectivity

### Issue: Application not starting
- Check application logs: `docker-compose -f docker-compose.dev.yml logs app`
- Verify all environment variables are set
- Ensure port 3000 is not already in use
- Try rebuilding the image: `docker-compose -f docker-compose.dev.yml up --build`

### Issue: Permission denied errors
- On Windows, ensure Docker Desktop has proper permissions
- On Linux/Mac, ensure the logs directory is writable:
  ```bash
  mkdir -p logs
  chmod 777 logs
  ```

### Issue: Hot-reloading not working in development
- Ensure volume mounts are configured correctly in `docker-compose.dev.yml`
- On Windows, enable WSL 2 backend in Docker Desktop settings
- Restart Docker Desktop

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** with real credentials
2. **Use secrets management** in production (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Rotate JWT secrets** regularly
4. **Use SSL/TLS** for database connections in production (`sslmode=require`)
5. **Limit container resources** (already configured in `docker-compose.prod.yml`)
6. **Run containers as non-root user** (already configured in `Dockerfile`)
7. **Keep Docker images updated** regularly

---

## 📚 Additional Resources

- [Neon Local Documentation](https://neon.tech/docs/local/neon-local)
- [Neon Cloud Documentation](https://neon.tech/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

## 🤝 Contributing

When making changes:
1. Test in development environment first
2. Ensure migrations run successfully
3. Verify health checks pass
4. Update this documentation if needed

---

**Questions or issues?** Check the logs first, then refer to the troubleshooting section above.
