# AWS Deployment Quick Start

This is the quick start guide for deploying the AI Career Counseling Platform to AWS.

## 🚀 Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with your credentials
3. **Terraform** (v1.6+) installed
4. **Docker** installed for building images
5. **OpenAI API Key** for AI functionality

## ⚡ Quick Deployment (Development)

### 1. Set Environment Variables

```bash
export TF_VAR_openai_api_key="your-openai-api-key-here"
export AWS_DEFAULT_REGION="us-east-1"
```

### 2. Deploy Infrastructure

```bash
# Make scripts executable
chmod +x scripts/deploy.sh scripts/build-and-push.sh

# Deploy to development environment
./scripts/deploy.sh dev plan
./scripts/deploy.sh dev apply
```

### 3. Build and Deploy Application

```bash
# Build and push Docker images
./scripts/build-and-push.sh dev all

# Update services with new images
./scripts/deploy.sh dev apply
```

### 4. Get Application URL

```bash
cd terraform
terraform output frontend_url
```

## 🌍 Environment Deployment

### Development Environment
```bash
export TF_VAR_openai_api_key="your-key"
./scripts/build-and-push.sh dev all
./scripts/deploy.sh dev apply
```

### Production Environment
```bash
export TF_VAR_openai_api_key="your-key"
./scripts/build-and-push.sh prod all
./scripts/deploy.sh prod apply
```

## 📋 What Gets Created

- **VPC** with public/private subnets
- **Application Load Balancer** for traffic distribution
- **ECS Fargate** cluster for container orchestration
- **ECR repositories** for Docker images
- **Secrets Manager** for secure configuration
- **CloudWatch** for logging and monitoring

## 💰 Estimated Costs

- **Development**: ~$35-50/month
- **Production**: ~$100-200/month

## 🔧 Customization

Edit environment files in `terraform/environments/`:
- `dev.tfvars` - Development configuration
- `test.tfvars` - Test configuration  
- `prod.tfvars` - Production configuration

## 📚 Full Documentation

- [AWS Deployment Guide](docs/AWS_DEPLOYMENT.md) - Complete deployment instructions
- [Infrastructure Overview](docs/INFRASTRUCTURE.md) - Architecture and components
- [Docker Guide](docs/DOCKER.md) - Container configuration

## 🆘 Need Help?

1. Check the [AWS Deployment Guide](docs/AWS_DEPLOYMENT.md)
2. Review CloudWatch logs for errors
3. Verify AWS credentials and permissions

## 🧹 Cleanup

To remove all AWS resources:
```bash
./scripts/deploy.sh dev destroy
```

⚠️ **Warning**: This will permanently delete all resources and data.