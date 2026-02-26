# GitHub Actions CI/CD Configuration

This directory contains GitHub Actions workflows for automated building, testing, and deployment of the Nexus API.

## Workflows

### `docker-deploy.yml`

Automated Docker build, test, and deployment pipeline.

**Triggers:**

- Push to `main` branch → Deploy to production
- Push to `develop` branch → Deploy to staging
- Pull requests to `main` → Run tests only

**Jobs:**

1. **build-and-test**: Build Docker image, run linter, test health endpoint
2. **deploy-production**: Deploy to production on `main` branch
3. **deploy-staging**: Deploy to staging on `develop` branch

## Required Secrets

Configure these secrets in your GitHub repository settings (`Settings` → `Secrets and variables` → `Actions`):

### Production Secrets

| Secret Name         | Description                        | Example                                                        |
| ------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `NEON_DATABASE_URL` | Production Neon Cloud database URL | `postgres://user:pass@ep-xyz.neon.tech/dbname?sslmode=require` |
| `JWT_SECRET`        | Production JWT secret key          | `your-secure-random-string`                                    |

### Staging Secrets (Optional)

| Secret Name                 | Description                     |
| --------------------------- | ------------------------------- |
| `NEON_STAGING_DATABASE_URL` | Staging Neon Cloud database URL |
| `STAGING_JWT_SECRET`        | Staging JWT secret key          |

### Deployment Secrets (Optional - for SSH deployment)

| Secret Name       | Description                        |
| ----------------- | ---------------------------------- |
| `PRODUCTION_HOST` | Production server hostname/IP      |
| `PRODUCTION_USER` | SSH username                       |
| `SSH_PRIVATE_KEY` | SSH private key for authentication |

## Setup Instructions

### 1. Enable GitHub Container Registry

The workflow pushes images to GitHub Container Registry (ghcr.io). No additional setup needed - it uses the `GITHUB_TOKEN` automatically.

### 2. Add Database URLs

1. Go to your repository settings
2. Navigate to `Secrets and variables` → `Actions`
3. Click `New repository secret`
4. Add `NEON_DATABASE_URL` with your production Neon connection string
5. Add `NEON_STAGING_DATABASE_URL` with your staging Neon connection string (if using)

### 3. Add JWT Secrets

1. Generate a secure random string:
   ```bash
   openssl rand -base64 32
   ```
2. Add as `JWT_SECRET` in repository secrets

### 4. Configure Deployment (Optional)

If deploying to a server via SSH:

1. Uncomment the SSH deployment step in `docker-deploy.yml`
2. Add the required SSH secrets
3. Adjust the deployment script for your server setup

## Local Testing

Test the workflow locally before pushing:

```bash
# Install act (GitHub Actions local runner)
# https://github.com/nektos/act

# Test the build-and-test job
act -j build-and-test

# Test with secrets
act -j deploy-production --secret-file .secrets
```

## Monitoring

View workflow runs:

1. Go to your repository on GitHub
2. Click the `Actions` tab
3. Select a workflow run to view logs

## Troubleshooting

### Workflow fails on linting

Run linter locally and fix issues:

```bash
npm run lint:fix
```

### Workflow fails on build

Check Docker build locally:

```bash
docker build -t nexus-api:test .
```

### Migration fails

Verify your `NEON_DATABASE_URL` secret:

- Ensure it includes `?sslmode=require`
- Test connection manually
- Check database permissions

### Image push fails

Ensure GitHub Container Registry is enabled:

1. Go to repository `Settings` → `Actions` → `General`
2. Under "Workflow permissions", select "Read and write permissions"
3. Save changes

## Customization

### Change deployment target

Edit the `deploy-production` or `deploy-staging` jobs to match your deployment method:

- Docker Swarm
- Kubernetes
- AWS ECS
- Azure Container Apps
- Google Cloud Run

### Add more tests

Add test steps in the `build-and-test` job:

```yaml
- name: Run unit tests
  run: |
    docker run --rm nexus-api:test npm test

- name: Run integration tests
  run: |
    docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Rotate secrets regularly** (every 90 days recommended)
3. **Use separate databases** for production and staging
4. **Enable branch protection** for `main` branch
5. **Require PR reviews** before merging
6. **Enable Dependabot** for dependency updates

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build and Push Action](https://github.com/docker/build-push-action)
- [Neon Database Documentation](https://neon.tech/docs)
