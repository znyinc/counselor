#!/bin/bash

# AWS Deployment Script for AI Career Counseling Platform
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh dev plan
# Example: ./deploy.sh prod apply

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}
PROJECT_NAME="counselor"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prod)$ ]]; then
    echo -e "${RED}Error: Environment must be dev, test, or prod${NC}"
    exit 1
fi

# Validate action
if [[ ! "$ACTION" =~ ^(plan|apply|destroy|init|validate)$ ]]; then
    echo -e "${RED}Error: Action must be plan, apply, destroy, init, or validate${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Deploying ${PROJECT_NAME} to ${ENVIRONMENT} environment${NC}"
echo -e "${BLUE}Action: ${ACTION}${NC}"

# Check required tools
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}Error: Terraform is not installed${NC}"
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

# Initialize Terraform
init_terraform() {
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    cd terraform
    terraform init
    cd ..
}

# Validate Terraform configuration
validate_terraform() {
    echo -e "${YELLOW}Validating Terraform configuration...${NC}"
    cd terraform
    terraform validate
    cd ..
}

# Plan Terraform deployment
plan_terraform() {
    echo -e "${YELLOW}Planning Terraform deployment...${NC}"
    cd terraform
    
    # Check if OpenAI API key is set
    if [ -z "$TF_VAR_openai_api_key" ]; then
        echo -e "${YELLOW}Warning: TF_VAR_openai_api_key environment variable not set${NC}"
        echo -e "${YELLOW}Make sure to set it before applying: export TF_VAR_openai_api_key='your-key'${NC}"
    fi
    
    terraform plan \
        -var-file="environments/${ENVIRONMENT}.tfvars" \
        -out="${ENVIRONMENT}.tfplan"
    cd ..
}

# Apply Terraform deployment
apply_terraform() {
    echo -e "${YELLOW}Applying Terraform deployment...${NC}"
    cd terraform
    
    if [ ! -f "${ENVIRONMENT}.tfplan" ]; then
        echo -e "${RED}Error: No plan found. Run 'plan' first.${NC}"
        exit 1
    fi
    
    terraform apply "${ENVIRONMENT}.tfplan"
    
    # Save outputs
    terraform output -json > "../outputs/${ENVIRONMENT}-outputs.json"
    
    echo -e "${GREEN}✓ Deployment completed successfully${NC}"
    echo -e "${BLUE}Outputs saved to outputs/${ENVIRONMENT}-outputs.json${NC}"
    cd ..
}

# Destroy Terraform resources
destroy_terraform() {
    echo -e "${RED}⚠️  This will destroy all resources in ${ENVIRONMENT} environment${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        cd terraform
        terraform destroy \
            -var-file="environments/${ENVIRONMENT}.tfvars" \
            -auto-approve
        cd ..
        echo -e "${GREEN}✓ Resources destroyed${NC}"
    else
        echo -e "${YELLOW}Aborted${NC}"
    fi
}

# Create outputs directory
mkdir -p outputs

# Main execution
check_requirements

case $ACTION in
    init)
        init_terraform
        ;;
    validate)
        validate_terraform
        ;;
    plan)
        init_terraform
        validate_terraform
        plan_terraform
        ;;
    apply)
        apply_terraform
        ;;
    destroy)
        destroy_terraform
        ;;
esac

echo -e "${GREEN}✓ Script completed${NC}"