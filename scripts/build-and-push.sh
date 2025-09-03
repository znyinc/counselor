#!/bin/bash

# Build and Push Docker Images to ECR
# Usage: ./build-and-push.sh [environment] [component]
# Example: ./build-and-push.sh dev frontend
# Example: ./build-and-push.sh prod all

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
COMPONENT=${2:-all}
PROJECT_NAME="counselor"

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}

# ECR repository URLs
FRONTEND_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-${ENVIRONMENT}-frontend"
BACKEND_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-${ENVIRONMENT}-backend"

# Git commit hash for tagging
GIT_HASH=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d%H%M%S)
IMAGE_TAG="${ENVIRONMENT}-${GIT_HASH}-${TIMESTAMP}"

echo -e "${BLUE}🐳 Building and pushing Docker images for ${ENVIRONMENT} environment${NC}"
echo -e "${BLUE}Component: ${COMPONENT}${NC}"
echo -e "${BLUE}Image tag: ${IMAGE_TAG}${NC}"

# Check requirements
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}Error: AWS CLI is not installed${NC}"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}Error: AWS credentials not configured${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All requirements satisfied${NC}"
}

# Login to ECR
ecr_login() {
    echo -e "${YELLOW}Logging into ECR...${NC}"
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
    echo -e "${GREEN}✓ ECR login successful${NC}"
}

# Build frontend image
build_frontend() {
    echo -e "${YELLOW}Building frontend image...${NC}"
    
    # Set environment-specific build args
    case $ENVIRONMENT in
        dev)
            API_URL="http://localhost:3001"
            ENABLE_ANALYTICS="true"
            ENABLE_PWA="false"
            ;;
        test)
            API_URL="https://api.test.yourdomain.com"
            ENABLE_ANALYTICS="true"
            ENABLE_PWA="true"
            ;;
        prod)
            API_URL="https://api.yourdomain.com"
            ENABLE_ANALYTICS="true"
            ENABLE_PWA="true"
            ;;
    esac
    
    docker build \
        --build-arg REACT_APP_API_URL="${API_URL}" \
        --build-arg REACT_APP_ENVIRONMENT="${ENVIRONMENT}" \
        --build-arg REACT_APP_ENABLE_ANALYTICS="${ENABLE_ANALYTICS}" \
        --build-arg REACT_APP_ENABLE_OFFLINE_MODE="true" \
        --build-arg REACT_APP_ENABLE_PWA="${ENABLE_PWA}" \
        -t ${FRONTEND_REPO}:${IMAGE_TAG} \
        -t ${FRONTEND_REPO}:latest \
        ./frontend
    
    echo -e "${GREEN}✓ Frontend image built${NC}"
}

# Build backend image
build_backend() {
    echo -e "${YELLOW}Building backend image...${NC}"
    
    docker build \
        -t ${BACKEND_REPO}:${IMAGE_TAG} \
        -t ${BACKEND_REPO}:latest \
        ./backend
    
    echo -e "${GREEN}✓ Backend image built${NC}"
}

# Push frontend image
push_frontend() {
    echo -e "${YELLOW}Pushing frontend image...${NC}"
    
    docker push ${FRONTEND_REPO}:${IMAGE_TAG}
    docker push ${FRONTEND_REPO}:latest
    
    echo -e "${GREEN}✓ Frontend image pushed${NC}"
    echo -e "${BLUE}Frontend image: ${FRONTEND_REPO}:${IMAGE_TAG}${NC}"
}

# Push backend image
push_backend() {
    echo -e "${YELLOW}Pushing backend image...${NC}"
    
    docker push ${BACKEND_REPO}:${IMAGE_TAG}
    docker push ${BACKEND_REPO}:latest
    
    echo -e "${GREEN}✓ Backend image pushed${NC}"
    echo -e "${BLUE}Backend image: ${BACKEND_REPO}:${IMAGE_TAG}${NC}"
}

# Update image tags in environment file
update_image_tags() {
    echo -e "${YELLOW}Updating image tags in environment file...${NC}"
    
    # Create or update terraform.tfvars for the environment
    cat > terraform/environments/${ENVIRONMENT}.auto.tfvars << EOF
# Auto-generated image tags
frontend_image_tag = "${IMAGE_TAG}"
backend_image_tag = "${IMAGE_TAG}"
EOF
    
    echo -e "${GREEN}✓ Image tags updated in terraform/environments/${ENVIRONMENT}.auto.tfvars${NC}"
}

# Main execution
check_requirements
ecr_login

case $COMPONENT in
    frontend)
        build_frontend
        push_frontend
        ;;
    backend)
        build_backend
        push_backend
        ;;
    all)
        build_frontend
        build_backend
        push_frontend
        push_backend
        ;;
    *)
        echo -e "${RED}Error: Component must be frontend, backend, or all${NC}"
        exit 1
        ;;
esac

update_image_tags

echo -e "${GREEN}✓ Build and push completed successfully${NC}"
echo -e "${BLUE}Ready to deploy with: ./scripts/deploy.sh ${ENVIRONMENT} apply${NC}"