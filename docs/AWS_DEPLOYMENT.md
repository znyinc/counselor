# AWS Deployment Guide

This guide provides comprehensive instructions for deploying the AI Career Counseling Platform to AWS with support for multiple environments (dev, test, prod).

## 🏗️ Architecture Overview

The application is deployed using:

- **AWS ECS Fargate**: Serverless container orchestration
- **Application Load Balancer (ALB)**: Traffic distribution and SSL termination
- **ECR**: Container registry for Docker images
- **VPC**: Isolated network environment with public/private subnets
- **Secrets Manager**: Secure storage for sensitive configuration
- **CloudWatch**: Logging and monitoring
- **Route53 & ACM**: DNS and SSL certificates (optional)

### Network Architecture

```
Internet Gateway
       |
   Public Subnets (ALB)
       |
   Private Subnets (ECS Tasks)
       |
   NAT Gateways (Outbound traffic)
```

### Service Architecture

```
User → CloudFront (optional) → ALB → ECS Frontend (React)
                                 ↓
                               ECS Backend (Node.js) → OpenAI API
                                 ↓
                             Secrets Manager
```

## 📋 Prerequisites

### Required Tools

1. **AWS CLI** v2.x
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Terraform** v1.6+
   ```bash
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

3. **Docker** v20+
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

### AWS Account Setup

1. **Create AWS Account** (if not already done)
2. **Configure AWS Credentials**:
   ```bash
   aws configure
   # Enter your Access Key ID, Secret Access Key, Region (us-east-1), and output format (json)
   ```

3. **Verify Access**:
   ```bash
   aws sts get-caller-identity
   ```

### Required AWS Permissions

Your AWS user/role needs the following permissions:
- ECS Full Access
- ECR Full Access
- VPC Full Access
- Application Load Balancer Full Access
- Secrets Manager Full Access
- CloudWatch Logs Full Access
- IAM Role Management
- Route53 and ACM (if using custom domain)

## 🚀 Quick Start Deployment

### 1. Environment Configuration

Set your OpenAI API key:
```bash
export TF_VAR_openai_api_key="your-openai-api-key-here"
```

### 2. Deploy Infrastructure (Development)

```bash
# Initialize and deploy to dev environment
./scripts/deploy.sh dev plan
./scripts/deploy.sh dev apply
```

### 3. Build and Push Images

```bash
# Build and push Docker images
./scripts/build-and-push.sh dev all
```

### 4. Update ECS Services

```bash
# Apply with new image tags
./scripts/deploy.sh dev apply
```

### 5. Access Your Application

After deployment, get the application URL:
```bash
cd terraform
terraform output frontend_url
```

## 🌍 Environment-Specific Deployments

### Development Environment

**Purpose**: Development and testing
**Cost**: ~$30-50/month
**Resources**: 1 frontend + 1 backend container

```bash
# Deploy to dev
export TF_VAR_openai_api_key="your-api-key"
./scripts/build-and-push.sh dev all
./scripts/deploy.sh dev apply
```

### Test Environment

**Purpose**: Integration testing and UAT
**Cost**: ~$40-60/month
**Resources**: 1 frontend + 1 backend container

```bash
# Deploy to test
export TF_VAR_openai_api_key="your-api-key"
./scripts/build-and-push.sh test all
./scripts/deploy.sh test apply
```

### Production Environment

**Purpose**: Live application
**Cost**: ~$100-200/month
**Resources**: 2 frontend + 2 backend containers + enhanced monitoring

```bash
# Deploy to production
export TF_VAR_openai_api_key="your-api-key"
./scripts/build-and-push.sh prod all
./scripts/deploy.sh prod apply
```

## 🎯 Custom Domain Setup

### 1. Configure Domain in Terraform

Edit `terraform/environments/{env}.tfvars`:
```hcl
domain_name = "yourdomain.com"  # for prod
# domain_name = "dev.yourdomain.com"  # for dev
```

### 2. DNS Configuration

Ensure your domain's nameservers point to Route53:
1. Create hosted zone in Route53 (done automatically by Terraform)
2. Update domain registrar to use Route53 nameservers
3. Wait for DNS propagation (up to 48 hours)

### 3. SSL Certificate

SSL certificates are automatically provisioned via ACM and validated through DNS.

## 📊 Monitoring and Logging

### CloudWatch Logs

View application logs:
```bash
# Get log group name
cd terraform
terraform output cloudwatch_log_group

# View logs (replace with actual log group name)
aws logs tail /ecs/counselor-dev --follow
```

### Application Metrics

Access CloudWatch metrics:
1. Go to AWS Console → CloudWatch
2. Navigate to Metrics → ECS
3. View CPU, Memory, and Request metrics

### Health Checks

Application health endpoints:
- Frontend: `http://your-domain/health`
- Backend: `http://your-domain/api/health`

## 🔧 Maintenance and Operations

### Updating Application

1. **Code Changes**:
   ```bash
   # After code changes
   git commit -am "Your changes"
   git push
   ```

2. **Rebuild and Deploy**:
   ```bash
   ./scripts/build-and-push.sh prod all
   ./scripts/deploy.sh prod apply
   ```

### Scaling Resources

Edit environment configuration in `terraform/environments/{env}.tfvars`:

```hcl
# In main.tf locals
prod = {
  instance_count_frontend = 3  # Scale to 3 frontend instances
  instance_count_backend  = 2  # Scale to 2 backend instances
  cpu_frontend           = 512 # Increase CPU
  memory_frontend        = 1024 # Increase memory
  cpu_backend           = 512
  memory_backend        = 1024
}
```

Apply changes:
```bash
./scripts/deploy.sh prod apply
```

### Backup and Recovery

**Infrastructure State**:
- Terraform state is stored locally (consider S3 backend for production)
- Backup state files regularly

**Application Data**:
- Currently using JSON files (no persistent database)
- Consider migrating to RDS for production data persistence

### Cost Optimization

1. **Development Environment**:
   - Use smaller instance sizes
   - Scale down when not in use
   - Enable scheduled shutdowns

2. **Production Environment**:
   - Use Reserved Instances for predictable workloads
   - Enable auto-scaling based on metrics
   - Regular cost reviews

## 🔒 Security Best Practices

### 1. Secrets Management

- All sensitive data in AWS Secrets Manager
- No secrets in code or configuration files
- Regular secret rotation

### 2. Network Security

- Private subnets for application containers
- Security groups with minimal required access
- NAT Gateways for outbound traffic only

### 3. Container Security

- Regular image scanning with Trivy
- Non-root container users
- Minimal base images

### 4. Access Control

- IAM roles with least privilege
- Separate environments with isolated resources
- CloudTrail logging for audit

## 🔥 Troubleshooting

### Common Issues

1. **ECS Tasks Not Starting**:
   ```bash
   # Check ECS service events
   aws ecs describe-services --cluster counselor-dev-cluster --services counselor-dev-frontend
   
   # Check CloudWatch logs
   aws logs tail /ecs/counselor-dev --follow
   ```

2. **Build Failures**:
   ```bash
   # Check if ECR repositories exist
   aws ecr describe-repositories --region us-east-1
   
   # Rebuild images
   ./scripts/build-and-push.sh dev all
   ```

3. **Terraform Errors**:
   ```bash
   # Refresh state
   cd terraform
   terraform refresh -var-file="environments/dev.tfvars"
   
   # Check plan
   terraform plan -var-file="environments/dev.tfvars"
   ```

4. **SSL Certificate Issues**:
   ```bash
   # Check certificate status
   aws acm list-certificates --region us-east-1
   
   # Verify DNS validation records
   aws route53 list-resource-record-sets --hosted-zone-id YOUR_ZONE_ID
   ```

### Log Analysis

```bash
# Backend API errors
aws logs filter-log-events \
  --log-group-name "/ecs/counselor-prod" \
  --filter-pattern "ERROR" \
  --start-time 1640995200000

# Frontend errors
aws logs filter-log-events \
  --log-group-name "/ecs/counselor-prod" \
  --filter-pattern "{ $.level = \"error\" }"
```

## 📞 Support

For deployment issues:
1. Check this documentation
2. Review CloudWatch logs
3. Verify AWS resource status in console
4. Check GitHub Actions workflow logs (if using CI/CD)

## 🚧 Advanced Topics

### CI/CD Pipeline

GitHub Actions workflow automatically:
- Runs tests on pull requests
- Deploys to dev on `develop` branch pushes
- Deploys to prod on `main` branch pushes

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `OPENAI_API_KEY`

### Multi-Region Deployment

For high availability, consider:
1. Deploy to multiple AWS regions
2. Use Route53 health checks for failover
3. Cross-region ECR replication

### Database Migration

Current: JSON files
Future: Consider migrating to:
- Amazon RDS (PostgreSQL/MySQL)
- Amazon DynamoDB
- Amazon Aurora Serverless

This would require updating:
1. Backend data access layer
2. Terraform infrastructure
3. Migration scripts

---

**Next Steps**: After successful deployment, consider implementing monitoring dashboards, automated backups, and performance optimization based on usage patterns.