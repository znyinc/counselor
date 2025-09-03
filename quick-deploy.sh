#!/bin/bash

# One-click AWS deployment script
# Usage: ./quick-deploy.sh [environment]
# Example: ./quick-deploy.sh dev

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENVIRONMENT=${1:-dev}

echo -e "${BLUE}🚀 One-Click AWS Deployment for ${ENVIRONMENT} environment${NC}"

# Check if OpenAI API key is set
if [ -z "$TF_VAR_openai_api_key" ]; then
    echo -e "${RED}❌ Please set your OpenAI API key:${NC}"
    echo -e "${YELLOW}export TF_VAR_openai_api_key='your-openai-api-key-here'${NC}"
    exit 1
fi

# Make scripts executable
chmod +x scripts/deploy.sh scripts/build-and-push.sh

echo -e "${YELLOW}📋 Step 1/3: Deploying infrastructure...${NC}"
./scripts/deploy.sh ${ENVIRONMENT} apply

echo -e "${YELLOW}🐳 Step 2/3: Building and pushing Docker images...${NC}"
./scripts/build-and-push.sh ${ENVIRONMENT} all

echo -e "${YELLOW}🔄 Step 3/3: Updating services with new images...${NC}"
./scripts/deploy.sh ${ENVIRONMENT} apply

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

# Get the application URL
cd terraform
FRONTEND_URL=$(terraform output -raw frontend_url 2>/dev/null || echo "Check terraform outputs")
cd ..

echo -e "${BLUE}🌐 Your application is available at:${NC}"
echo -e "${GREEN}${FRONTEND_URL}${NC}"

echo -e "${YELLOW}📊 To view logs:${NC}"
echo -e "aws logs tail /ecs/counselor-${ENVIRONMENT} --follow"

echo -e "${YELLOW}🔧 To manage the deployment:${NC}"
echo -e "./scripts/deploy.sh ${ENVIRONMENT} plan    # Plan changes"
echo -e "./scripts/deploy.sh ${ENVIRONMENT} apply   # Apply changes"
echo -e "./scripts/deploy.sh ${ENVIRONMENT} destroy # Destroy resources"