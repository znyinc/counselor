# Docker Configuration Guide

This guide explains the Docker setup for the AI Career Counseling Platform, including local development and production deployment.

## 📦 Container Architecture

### Multi-Stage Build Strategy

Both frontend and backend use multi-stage Docker builds for:
- **Build Stage**: Compile and build the application
- **Production Stage**: Minimal runtime image with security hardening

### Security Features

- Non-root user execution
- Read-only root filesystem
- Minimal base images (Alpine Linux)
- Vulnerability scanning
- Health checks
- Signal handling with dumb-init

## 🎯 Frontend Container

### Dockerfile Overview

```dockerfile
# Stage 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . ./
RUN npm run build

# Stage 2: Production
FROM nginx:alpine as production
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
```

### Build Arguments

Configure environment-specific builds:

```bash
docker build \
  --build-arg REACT_APP_API_URL="https://api.yourdomain.com" \
  --build-arg REACT_APP_ENVIRONMENT="production" \
  --build-arg REACT_APP_ENABLE_ANALYTICS="true" \
  --build-arg REACT_APP_ENABLE_PWA="true" \
  -t counselor-frontend:latest \
  ./frontend
```

### Nginx Configuration

Custom nginx configuration (`frontend/nginx.conf`):

#### Security Headers
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

#### Performance Features
- Gzip compression for static assets
- Cache headers for static files (1 year)
- No-cache headers for HTML (to ensure fresh app shells)

#### Client-Side Routing
- All routes fallback to index.html for SPA behavior

### Health Check

Frontend health check endpoint:
```nginx
location /health {
  access_log off;
  return 200 "healthy\n";
  add_header Content-Type text/plain;
}
```

## 🚀 Backend Container

### Dockerfile Overview

```dockerfile
# Stage 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY data/ ./data/
RUN npm run build

# Stage 2: Production
FROM node:18-alpine as production
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data
EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### Environment Variables

Production environment configuration:

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
OPENAI_API_KEY=<from-secrets-manager>
JWT_SECRET=<from-secrets-manager>
```

### Health Check

Backend health check:
```bash
node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
```

## 🐳 Local Development with Docker Compose

### Basic Usage

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up frontend

# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f frontend
```

### Development Configuration

`docker-compose.yml` provides:
- **Hot reload**: Volume mounts for source code
- **Port mapping**: Frontend (3000), Backend (3001)
- **Health checks**: Service dependency management
- **Networking**: Internal communication between services

### Environment Files

Create `.env` files for local development:

#### Backend (.env)
```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development
REACT_APP_ENABLE_ANALYTICS=false
```

## 🏗️ Production Docker Compose

### Production Configuration

`docker-compose.prod.yml` includes:
- **Restart policies**: unless-stopped
- **Resource limits**: CPU and memory constraints
- **Logging**: Structured logging with rotation
- **Security**: Read-only root filesystem

### Production Deployment

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale frontend=3
```

## 🔒 Security Best Practices

### Container Security

1. **Non-root User**
   ```dockerfile
   RUN addgroup -g 1001 -S nodejs && \
       adduser -S nodejs -u 1001
   USER nodejs
   ```

2. **Minimal Images**
   - Use Alpine Linux for smaller attack surface
   - Multi-stage builds to exclude build tools

3. **Read-only Filesystem**
   ```yaml
   services:
     frontend:
       read_only: true
       tmpfs:
         - /tmp:noexec,nosuid,size=100m
   ```

4. **Capability Dropping**
   ```yaml
   services:
     backend:
       cap_drop:
         - ALL
       cap_add:
         - NET_BIND_SERVICE
   ```

### Image Scanning

Scan images for vulnerabilities:

```bash
# Install Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Scan frontend image
trivy image counselor-frontend:latest

# Scan backend image
trivy image counselor-backend:latest

# Generate SARIF report
trivy image --format sarif --output results.sarif counselor-frontend:latest
```

## 📊 Monitoring and Observability

### Health Checks

#### Frontend Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

#### Backend Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
```

### Logging Configuration

#### Development Logging
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

#### Production Logging
```yaml
logging:
  driver: "awslogs"
  options:
    awslogs-region: "us-east-1"
    awslogs-group: "/ecs/counselor-prod"
    awslogs-stream-prefix: "frontend"
```

### Metrics Collection

Container metrics available through:
- Docker stats API
- cAdvisor integration
- Prometheus exporters

## 🔧 Troubleshooting

### Common Issues

1. **Container Won't Start**
   ```bash
   # Check logs
   docker logs container-name
   
   # Check health
   docker inspect container-name | grep Health
   
   # Debug interactively
   docker run -it --entrypoint /bin/sh image-name
   ```

2. **Build Failures**
   ```bash
   # Clear Docker cache
   docker system prune -f
   
   # Rebuild without cache
   docker build --no-cache -t image-name .
   
   # Check available space
   docker system df
   ```

3. **Network Issues**
   ```bash
   # List networks
   docker network ls
   
   # Inspect network
   docker network inspect bridge
   
   # Test connectivity
   docker exec container-name ping other-container
   ```

4. **Permission Issues**
   ```bash
   # Check user in container
   docker exec container-name id
   
   # Check file permissions
   docker exec container-name ls -la /app
   ```

### Performance Optimization

1. **Build Time Optimization**
   - Layer caching with .dockerignore
   - Multi-stage builds
   - Parallel dependency installation

2. **Runtime Optimization**
   - Resource limits and requests
   - Init process management (dumb-init)
   - Graceful shutdown handling

3. **Image Size Optimization**
   ```dockerfile
   # Remove package managers
   RUN npm ci --only=production && npm cache clean --force
   
   # Use .dockerignore
   echo "node_modules" > .dockerignore
   echo ".git" >> .dockerignore
   ```

## 🚀 Advanced Configuration

### Custom Nginx Configuration

For advanced frontend setups:

```nginx
# Custom backend proxy
location /api/ {
  proxy_pass http://backend:3001/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

# WebSocket support
location /ws {
  proxy_pass http://backend:3001;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

### Environment-specific Builds

Use BuildKit for advanced builds:

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with secrets
docker build \
  --secret id=api_key,src=./secrets/api_key.txt \
  --target production \
  -t counselor-backend:latest \
  ./backend
```

### Container Orchestration

For Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: counselor-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: counselor-frontend
  template:
    metadata:
      labels:
        app: counselor-frontend
    spec:
      containers:
      - name: frontend
        image: counselor-frontend:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

This Docker configuration provides a robust foundation for both development and production deployments, with security, performance, and observability built in.