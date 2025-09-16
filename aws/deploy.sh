#!/bin/bash

# AWS Deployment Script for AI Career Counseling Tool
# This script deploys the application to AWS using Terraform and Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
ENVIRONMENT=${ENVIRONMENT:-"prod"}
PROJECT_NAME="counselor"

echo -e "${GREEN}🚀 Starting AWS deployment for ${PROJECT_NAME}-${ENVIRONMENT}${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    commands=("docker" "terraform" "aws" "jq")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            echo -e "${RED}❌ $cmd is not installed${NC}"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Build Docker images locally for testing
build_images() {
    echo -e "${YELLOW}🔨 Building Docker images...${NC}"
    
    # Build backend
    echo "Building backend image..."
    docker build -f Dockerfile.backend -t ${PROJECT_NAME}-backend:latest .
    
    # Build frontend
    echo "Building frontend image..."
    docker build -f Dockerfile.frontend -t ${PROJECT_NAME}-frontend:latest .
    
    echo -e "${GREEN}✅ Docker images built successfully${NC}"
}

# Test images locally
test_images() {
    echo -e "${YELLOW}🧪 Testing Docker images...${NC}"
    
    # Create test network
    docker network create ${PROJECT_NAME}-test || true
    
    # Test backend
    echo "Testing backend image..."
    docker run --rm --network ${PROJECT_NAME}-test \
        -e NODE_ENV=production \
        -e PORT=3001 \
        --health-cmd="curl -f http://localhost:3001/health || exit 1" \
        --health-interval=10s \
        --health-timeout=5s \
        --health-retries=3 \
        -d --name ${PROJECT_NAME}-backend-test \
        ${PROJECT_NAME}-backend:latest
    
    # Wait for backend to be healthy
    echo "Waiting for backend to be healthy..."
    timeout 60 bash -c 'until docker inspect --format="{{.State.Health.Status}}" '${PROJECT_NAME}'-backend-test | grep -q "healthy"; do sleep 2; done'
    
    # Test frontend
    echo "Testing frontend image..."
    docker run --rm --network ${PROJECT_NAME}-test \
        --health-cmd="wget --no-verbose --tries=1 --spider http://localhost/health || exit 1" \
        --health-interval=10s \
        --health-timeout=5s \
        --health-retries=3 \
        -d --name ${PROJECT_NAME}-frontend-test \
        ${PROJECT_NAME}-frontend:latest
    
    # Wait for frontend to be healthy
    echo "Waiting for frontend to be healthy..."
    timeout 60 bash -c 'until docker inspect --format="{{.State.Health.Status}}" '${PROJECT_NAME}'-frontend-test | grep -q "healthy"; do sleep 2; done'
    
    # Cleanup
    docker stop ${PROJECT_NAME}-backend-test ${PROJECT_NAME}-frontend-test || true
    docker network rm ${PROJECT_NAME}-test || true
    
    echo -e "${GREEN}✅ Docker images tested successfully${NC}"
}

# Initialize Terraform
init_terraform() {
    echo -e "${YELLOW}🏗️ Initializing Terraform...${NC}"
    
    cd aws/terraform
    
    # Initialize Terraform
    terraform init
    
    # Validate configuration
    terraform validate
    
    echo -e "${GREEN}✅ Terraform initialized${NC}"
    cd ../..
}

# Plan Terraform deployment
plan_terraform() {
    echo -e "${YELLOW}📋 Planning Terraform deployment...${NC}"
    
    cd aws/terraform
    
    # Create terraform.tfvars if it doesn't exist
    if [ ! -f terraform.tfvars ]; then
        cat > terraform.tfvars << EOF
aws_region = "${AWS_REGION}"
environment = "${ENVIRONMENT}"
project_name = "${PROJECT_NAME}"
domain_name = "your-domain.com"
certificate_arn = ""

# Database configuration
db_instance_class = "db.t3.micro"
db_allocated_storage = 20

# ECS configuration
backend_cpu = 256
backend_memory = 512
frontend_cpu = 256
frontend_memory = 512
desired_capacity = 2

# Security - Set these via environment variables or update this file
openai_api_key = "${OPENAI_API_KEY:-your_openai_api_key}"
jwt_secret = "${JWT_SECRET:-$(openssl rand -hex 32)}"
encryption_key = "${ENCRYPTION_KEY:-$(openssl rand -hex 64)}"
session_secret = "${SESSION_SECRET:-$(openssl rand -hex 32)}"
webhook_secret = "${WEBHOOK_SECRET:-$(openssl rand -hex 32)}"
EOF
        echo -e "${YELLOW}⚠️ Created terraform.tfvars file. Please update it with your values before continuing.${NC}"
        echo -e "${YELLOW}⚠️ Make sure to set the security variables as environment variables or update the file.${NC}"
        exit 1
    fi
    
    # Plan deployment
    terraform plan -out=tfplan
    
    echo -e "${GREEN}✅ Terraform plan created${NC}"
    cd ../..
}

# Apply Terraform deployment
apply_terraform() {
    echo -e "${YELLOW}🚀 Applying Terraform deployment...${NC}"
    
    cd aws/terraform
    
    # Apply the plan
    terraform apply tfplan
    
    # Output important values
    echo -e "${GREEN}📋 Deployment outputs:${NC}"
    terraform output
    
    cd ../..
}

# Push images to ECR
push_images_to_ecr() {
    echo -e "${YELLOW}📤 Pushing images to ECR...${NC}"
    
    cd aws/terraform
    
    # Get ECR repository URLs
    BACKEND_REPO_URL=$(terraform output -raw ecr_backend_repository_url)
    FRONTEND_REPO_URL=$(terraform output -raw ecr_frontend_repository_url)
    
    cd ../..
    
    # Login to ECR
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${BACKEND_REPO_URL%/*}
    
    # Tag and push backend image
    docker tag ${PROJECT_NAME}-backend:latest ${BACKEND_REPO_URL}:latest
    docker push ${BACKEND_REPO_URL}:latest
    
    # Tag and push frontend image
    docker tag ${PROJECT_NAME}-frontend:latest ${FRONTEND_REPO_URL}:latest
    docker push ${FRONTEND_REPO_URL}:latest
    
    echo -e "${GREEN}✅ Images pushed to ECR${NC}"
}

# Update ECS services
update_ecs_services() {
    echo -e "${YELLOW}🔄 Updating ECS services...${NC}"
    
    cd aws/terraform
    
    # Get cluster and service names
    CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    BACKEND_SERVICE=$(terraform output -raw backend_service_name)
    FRONTEND_SERVICE=$(terraform output -raw frontend_service_name)
    
    cd ../..
    
    # Force new deployment for both services
    aws ecs update-service --cluster ${CLUSTER_NAME} --service ${BACKEND_SERVICE} --force-new-deployment
    aws ecs update-service --cluster ${CLUSTER_NAME} --service ${FRONTEND_SERVICE} --force-new-deployment
    
    # Wait for services to stabilize
    echo "Waiting for backend service to stabilize..."
    aws ecs wait services-stable --cluster ${CLUSTER_NAME} --services ${BACKEND_SERVICE}
    
    echo "Waiting for frontend service to stabilize..."
    aws ecs wait services-stable --cluster ${CLUSTER_NAME} --services ${FRONTEND_SERVICE}
    
    echo -e "${GREEN}✅ ECS services updated${NC}"
}

# Health check
health_check() {
    echo -e "${YELLOW}🏥 Performing health check...${NC}"
    
    cd aws/terraform
    
    # Get load balancer DNS
    ALB_DNS=$(terraform output -raw load_balancer_dns)
    
    cd ../..
    
    # Wait a bit for the deployment to settle
    sleep 30
    
    # Health check
    echo "Checking application health at http://${ALB_DNS}/health"
    if curl -f "http://${ALB_DNS}/health"; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
        echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
        echo -e "${GREEN}🌐 Application URL: http://${ALB_DNS}${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        exit 1
    fi
}

# Main deployment function
deploy() {
    check_prerequisites
    build_images
    test_images
    init_terraform
    plan_terraform
    
    echo -e "${YELLOW}⚠️ About to apply Terraform changes. Continue? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        apply_terraform
        push_images_to_ecr
        update_ecs_services
        health_check
    else
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up resources...${NC}"
    
    cd aws/terraform
    terraform destroy -auto-approve
    cd ../..
    
    echo -e "${GREEN}✅ Resources cleaned up${NC}"
}

# Help function
show_help() {
    echo "AWS Deployment Script for AI Career Counseling Tool"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy the application to AWS (default)"
    echo "  cleanup   Destroy all AWS resources"
    echo "  help      Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_REGION        AWS region (default: us-east-1)"
    echo "  ENVIRONMENT       Environment name (default: prod)"
    echo "  OPENAI_API_KEY    OpenAI API key (required)"
    echo "  JWT_SECRET        JWT secret key (auto-generated if not set)"
    echo "  ENCRYPTION_KEY    Encryption key (auto-generated if not set)"
    echo "  SESSION_SECRET    Session secret key (auto-generated if not set)"
    echo "  WEBHOOK_SECRET    Webhook secret key (auto-generated if not set)"
}

# Main script
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    cleanup)
        cleanup
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac