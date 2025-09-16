# AWS Cloud Deployment Guide

This guide provides comprehensive instructions for deploying the AI Career Counseling Tool to AWS Cloud using modern cloud-native services.

## 🏗️ Architecture Overview

The application is deployed using the following AWS services:

### Core Services
- **Amazon ECS (Fargate)**: Container orchestration for backend and frontend
- **Amazon RDS (PostgreSQL)**: Managed database service
- **Amazon ElastiCache (Redis)**: Caching and session management
- **Application Load Balancer**: Traffic distribution and SSL termination
- **Amazon ECR**: Container image registry

### Supporting Services
- **Amazon VPC**: Network isolation and security
- **AWS Secrets Manager**: Secure storage of API keys and secrets
- **Amazon CloudWatch**: Monitoring, logging, and alerting
- **AWS Auto Scaling**: Automatic scaling based on demand
- **Amazon Route 53**: DNS management (optional)
- **AWS Certificate Manager**: SSL certificate management

### Security Features
- **VPC with private subnets**: Database and application isolation
- **Security Groups**: Network-level access control
- **IAM Roles**: Fine-grained permissions
- **Encryption**: Data at rest and in transit
- **Secrets Manager**: Secure credential management

## 📋 Prerequisites

### Required Tools
- [AWS CLI v2](https://aws.amazon.com/cli/)
- [Terraform](https://www.terraform.io/downloads) (>= 1.0)
- [Docker](https://www.docker.com/get-started)
- [jq](https://stedolan.github.io/jq/) (for JSON processing)

### AWS Account Setup
1. **AWS Account**: Active AWS account with billing enabled
2. **IAM User**: User with programmatic access and required permissions
3. **Domain (Optional)**: For custom domain and SSL certificate

### Required AWS Permissions
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "ecs:*",
                "ecr:*",
                "rds:*",
                "elasticache:*",
                "elasticloadbalancing:*",
                "iam:*",
                "secretsmanager:*",
                "cloudwatch:*",
                "logs:*",
                "application-autoscaling:*",
                "route53:*",
                "acm:*"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🚀 Quick Start Deployment

### 1. Configure AWS Credentials
```bash
aws configure
# Enter your Access Key ID, Secret Access Key, and preferred region
```

### 2. Set Environment Variables
```bash
export AWS_REGION="us-east-1"
export ENVIRONMENT="prod"
export OPENAI_API_KEY="your-openai-api-key"
export DOMAIN_NAME="your-domain.com"  # Optional
```

### 3. Deploy Using Script
```bash
# Make script executable
chmod +x aws/deploy.sh

# Run deployment
./aws/deploy.sh deploy
```

### 4. Manual Terraform Deployment (Alternative)
```bash
cd aws/terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars file
cat > terraform.tfvars << EOF
aws_region = "us-east-1"
environment = "prod"
project_name = "counselor"
domain_name = "your-domain.com"
openai_api_key = "your-openai-api-key"
jwt_secret = "$(openssl rand -hex 32)"
encryption_key = "$(openssl rand -hex 64)"
session_secret = "$(openssl rand -hex 32)"
webhook_secret = "$(openssl rand -hex 32)"
EOF

# Plan deployment
terraform plan -out=tfplan

# Apply deployment
terraform apply tfplan
```

## 📊 Cost Estimation

### Monthly Cost Breakdown (us-east-1)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| ECS Fargate | 2 tasks (0.25 vCPU, 0.5 GB) | ~$15 |
| RDS PostgreSQL | db.t3.micro, 20GB | ~$20 |
| ElastiCache Redis | cache.t3.micro, 2 nodes | ~$25 |
| Application Load Balancer | Standard ALB | ~$23 |
| NAT Gateway | 2 AZs | ~$64 |
| Data Transfer | 100GB/month | ~$9 |
| CloudWatch Logs | 5GB retention | ~$2.50 |
| ECR Storage | 2GB images | ~$0.20 |
| **Total Estimated** | | **~$158/month** |

### Cost Optimization Tips

1. **Use Spot Instances** for non-critical workloads
2. **Enable Auto Scaling** to scale down during low usage
3. **Use CloudWatch** to monitor and optimize resources
4. **Consider Reserved Instances** for consistent workloads
5. **Use S3 for static assets** instead of serving from containers

## 🔧 Configuration

### Environment Variables

The application uses AWS Secrets Manager for sensitive configuration. Update these values after deployment:

```bash
# Update application secrets
aws secretsmanager update-secret \
  --secret-id counselor-prod-app-secrets \
  --secret-string '{
    "OPENAI_API_KEY": "your-openai-api-key",
    "JWT_SECRET": "your-jwt-secret",
    "ENCRYPTION_KEY": "your-encryption-key",
    "SESSION_SECRET": "your-session-secret",
    "WEBHOOK_SECRET": "your-webhook-secret"
  }'
```

### Database Configuration

The PostgreSQL database is automatically initialized with the required schema. To customize:

1. **Connection String**: Available in Secrets Manager
2. **Backup Settings**: Configured for 7-day retention
3. **Performance Insights**: Enabled for monitoring
4. **Encryption**: Enabled for data at rest

### Custom Domain Setup

1. **Purchase Domain**: Use Route 53 or external provider
2. **Request SSL Certificate**:
   ```bash
   aws acm request-certificate \
     --domain-name your-domain.com \
     --validation-method DNS \
     --region us-east-1
   ```
3. **Update Terraform Configuration**:
   ```hcl
   certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/abcd-1234"
   domain_name = "your-domain.com"
   ```
4. **Create Route 53 Record**:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123456789 \
     --change-batch file://dns-change.json
   ```

## 📈 Monitoring and Alerting

### CloudWatch Dashboard
Access the dashboard at: AWS Console > CloudWatch > Dashboards > counselor-prod-dashboard

### Key Metrics Monitored
- **Application Response Time**
- **Database Performance**
- **Error Rates**
- **Resource Utilization**
- **Auto Scaling Events**

### Alerts Configuration
Alerts are sent to SNS topic: `counselor-prod-alerts`

To subscribe to alerts:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:counselor-prod-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Log Analysis
- **Application Logs**: CloudWatch Logs > /aws/ecs/counselor-prod
- **Load Balancer Logs**: Stored in S3 bucket
- **Database Logs**: CloudWatch Logs > /aws/rds/instance/counselor-prod-db

## 🔒 Security

### Network Security
- **VPC Isolation**: Application runs in private subnets
- **Security Groups**: Strict ingress/egress rules
- **NACLs**: Additional network-level protection

### Data Security
- **Encryption**: All data encrypted at rest and in transit
- **Secrets Management**: AWS Secrets Manager for sensitive data
- **IAM Roles**: Principle of least privilege

### Application Security
- **HTTPS Only**: SSL/TLS termination at load balancer
- **Security Headers**: Configured in nginx
- **Rate Limiting**: API and login protection
- **Input Validation**: Comprehensive server-side validation

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
The deployment includes a GitHub Actions workflow for automated deployment:

1. **Triggers**: Push to main branch
2. **Testing**: Runs unit tests and linting
3. **Building**: Creates Docker images
4. **Deployment**: Updates ECS services

### Manual Deployment
```bash
# Build and push images
./aws/deploy.sh build-images

# Update ECS services
aws ecs update-service \
  --cluster counselor-prod \
  --service counselor-prod-backend \
  --force-new-deployment
```

## 📦 Backup and Recovery

### Database Backups
- **Automated Backups**: 7-day retention period
- **Point-in-Time Recovery**: Available within backup window
- **Manual Snapshots**: Can be created for major deployments

### Disaster Recovery
1. **Multi-AZ Deployment**: Database and cache replicated across AZs
2. **Load Balancer**: Automatically routes traffic to healthy instances
3. **Auto Scaling**: Replaces unhealthy containers automatically

## 🐛 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check ECS service events
aws ecs describe-services --cluster counselor-prod --services counselor-prod-backend

# Check CloudWatch logs
aws logs tail /aws/ecs/counselor-prod --follow
```

#### 2. Database Connection Issues
```bash
# Test database connectivity
aws rds describe-db-instances --db-instance-identifier counselor-prod-db

# Check security groups
aws ec2 describe-security-groups --filters "Name=group-name,Values=counselor-prod-rds-*"
```

#### 3. Load Balancer Health Checks Failing
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Check application logs
aws logs filter-log-events --log-group-name /aws/ecs/counselor-prod --filter-pattern "ERROR"
```

### Performance Issues

#### 1. High Response Times
- Check CloudWatch metrics for CPU/Memory usage
- Review database performance insights
- Consider scaling up resources

#### 2. Database Performance
- Enable Performance Insights
- Review slow query logs
- Consider read replicas for read-heavy workloads

## 🔧 Maintenance

### Regular Tasks

#### Weekly
- Review CloudWatch alarms and metrics
- Check security group rules
- Review cost and usage reports

#### Monthly
- Update container images with security patches
- Review and rotate secrets
- Analyze performance trends

#### Quarterly
- Review and update backup retention policies
- Conduct disaster recovery testing
- Review and optimize costs

### Updates and Upgrades

#### Application Updates
```bash
# Build new image
docker build -f Dockerfile.backend -t counselor-backend:v1.1.0 .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Update ECS service
aws ecs update-service --cluster counselor-prod --service counselor-prod-backend --force-new-deployment
```

#### Infrastructure Updates
```bash
cd aws/terraform
terraform plan
terraform apply
```

## 🆘 Support and Resources

### AWS Documentation
- [ECS User Guide](https://docs.aws.amazon.com/ecs/)
- [RDS User Guide](https://docs.aws.amazon.com/rds/)
- [VPC User Guide](https://docs.aws.amazon.com/vpc/)

### Monitoring Tools
- [AWS CloudWatch](https://aws.amazon.com/cloudwatch/)
- [AWS X-Ray](https://aws.amazon.com/xray/) (for distributed tracing)
- [AWS Config](https://aws.amazon.com/config/) (for compliance monitoring)

### Cost Management
- [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/)
- [AWS Budgets](https://aws.amazon.com/aws-cost-management/aws-budgets/)
- [AWS Trusted Advisor](https://aws.amazon.com/support/trusted-advisor/)

## 📞 Emergency Contacts

### Incident Response
1. **Monitor**: Check CloudWatch dashboard
2. **Identify**: Review logs and metrics
3. **Escalate**: Contact AWS Support if needed
4. **Communicate**: Update stakeholders
5. **Resolve**: Apply fixes and monitor

### AWS Support
- **Basic Support**: Included with AWS account
- **Developer Support**: $29/month
- **Business Support**: $100/month (recommended)

---

**⚠️ Important Notes:**
- Always test deployments in a staging environment first
- Keep AWS credentials secure and rotate regularly
- Monitor costs to avoid unexpected charges
- Follow AWS Well-Architected Framework principles
- Maintain regular backups and test disaster recovery procedures