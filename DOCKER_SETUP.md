# Docker Setup Guide

This guide will help you containerize and run the Sidequest application using Docker.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd sidequest
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Required: Google Cloud / Vertex AI
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Required: Google Maps (for frontend)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key

# Optional: OpenWeather API
NEXT_PUBLIC_OPENWEATHER_API_KEY=your-openweather-key

# Optional: Reddit API
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
ENABLE_REDDIT_ENRICHMENT=false
```

### 3. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Health Check: http://localhost:8000/health

### 4. Stop the Application

```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Building Individual Images

### Backend Only

```bash
docker build -f Dockerfile.backend -t sidequest-backend .
docker run -p 8000:8000 --env-file .env sidequest-backend
```

### Frontend Only

```bash
docker build -f Dockerfile.frontend \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  -t sidequest-frontend .
  
docker run -p 3000:3000 sidequest-frontend
```

## Production Deployment

### Using Docker Compose

For production, update the `docker-compose.yml` to use production environment variables:

```yaml
services:
  backend:
    environment:
      - AGENT_LOG_LEVEL=WARNING
      - AGENT_LOG_FILE_ENABLED=true
    restart: always

  frontend:
    build:
      args:
        - NEXT_PUBLIC_API_URL=https://your-api-domain.com
    restart: always
```

### Pushing to Docker Registry

```bash
# Tag images
docker tag sidequest-backend:latest your-registry/sidequest-backend:latest
docker tag sidequest-frontend:latest your-registry/sidequest-frontend:latest

# Push to registry
docker push your-registry/sidequest-backend:latest
docker push your-registry/sidequest-frontend:latest
```

### Deploy to Cloud Platforms

#### Google Cloud Run

```bash
# Build and push backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sidequest-backend -f Dockerfile.backend

# Deploy backend
gcloud run deploy sidequest-backend \
  --image gcr.io/YOUR_PROJECT_ID/sidequest-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=your-key

# Build and push frontend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sidequest-frontend -f Dockerfile.frontend \
  --substitutions _NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key,_NEXT_PUBLIC_API_URL=https://your-backend-url

# Deploy frontend
gcloud run deploy sidequest-frontend \
  --image gcr.io/YOUR_PROJECT_ID/sidequest-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### AWS ECS/Fargate

1. Push images to Amazon ECR
2. Create ECS task definitions using the Dockerfiles
3. Configure environment variables in task definition
4. Deploy to ECS cluster

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :3000
lsof -i :8000

# Kill the process or change ports in docker-compose.yml
```

### Container Fails to Start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

### Environment Variables Not Loading

Make sure your `.env` file is in the root directory and properly formatted. Docker Compose automatically loads it.

### Google Maps Not Loading

1. Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly
2. Check that the API key has Maps JavaScript API enabled
3. Verify API key restrictions allow your domain/localhost
4. Check browser console for specific error messages

### Backend Health Check Failing

```bash
# Test backend directly
curl http://localhost:8000/health

# Check backend logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep GOOGLE
```

## Development with Docker

### Hot Reload for Development

For development with hot reload, mount source code as volumes:

```yaml
services:
  backend:
    volumes:
      - ./backend:/app
      - /app/__pycache__
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev
```

### Running Tests in Docker

```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test
```

## Resource Management

### Viewing Resource Usage

```bash
docker stats
```

### Cleaning Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything
docker system prune -a --volumes
```

## Security Best Practices

1. Never commit `.env` file to Git
2. Use Docker secrets for sensitive data in production
3. Run containers as non-root user (already configured)
4. Keep base images updated
5. Scan images for vulnerabilities:

```bash
docker scan sidequest-backend
docker scan sidequest-frontend
```

## Next Steps

- Set up CI/CD pipeline for automated builds
- Configure monitoring and logging
- Set up backup strategy for persistent data
- Implement health checks and auto-restart policies
- Configure reverse proxy (nginx) for production
