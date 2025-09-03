# Infrastructure Overview

This document provides a comprehensive overview of the AWS infrastructure for the AI Career Counseling Platform.

## 📋 Infrastructure Components

### Core Services

| Service | Purpose | Environment | Cost (Monthly) |
|---------|---------|-------------|----------------|
| ECS Fargate | Container orchestration | All | $30-150 |
| Application Load Balancer | Traffic distribution | All | $22 |
| ECR | Container registry | All | $1-5 |
| VPC | Network isolation | All | $0 |
| NAT Gateway | Outbound connectivity | All | $32 (per AZ) |
| Secrets Manager | Secure configuration | All | $1-3 |
| CloudWatch | Logging & monitoring | All | $5-20 |
| Route53 | DNS management | Prod | $0.50 |
| ACM | SSL certificates | Prod | $0 |

### Environment Configurations

#### Development
- **Purpose**: Development and testing
- **Resources**: 1 frontend + 1 backend container (256 CPU, 512 MB RAM each)
- **Cost**: ~$35-50/month
- **Features**: Basic logging, no SSL, single AZ

#### Test
- **Purpose**: Integration testing and UAT
- **Resources**: 1 frontend + 1 backend container (256 CPU, 512 MB RAM each)
- **Cost**: ~$40-60/month
- **Features**: Enhanced logging, optional SSL, single AZ

#### Production
- **Purpose**: Live application
- **Resources**: 2 frontend + 2 backend containers (512 CPU, 1024 MB RAM each)
- **Cost**: ~$100-200/month
- **Features**: Full monitoring, SSL, multi-AZ, auto-scaling

## 🏗️ Network Architecture

### VPC Design

```
10.0.0.0/16 (VPC)
├── 10.0.1.0/24 (Public Subnet AZ-1)
├── 10.0.2.0/24 (Public Subnet AZ-2)
├── 10.0.10.0/24 (Private Subnet AZ-1)
└── 10.0.11.0/24 (Private Subnet AZ-2)
```

### Traffic Flow

```
Internet
    ↓
Internet Gateway
    ↓
Application Load Balancer (Public Subnets)
    ↓
ECS Fargate Tasks (Private Subnets)
    ↓
NAT Gateway → Internet (for outbound API calls)
```

### Security Groups

#### ALB Security Group
- **Inbound**: 80/443 from 0.0.0.0/0
- **Outbound**: All traffic

#### ECS Security Group
- **Inbound**: 3000/3001 from ALB security group
- **Outbound**: All traffic

## 🐳 Container Strategy

### Frontend Container
- **Base Image**: nginx:alpine
- **Build**: Multi-stage (Node.js build → nginx serve)
- **Port**: 3000
- **Health Check**: GET /health
- **Resources**: 256-512 CPU, 512-1024 MB RAM

### Backend Container
- **Base Image**: node:18-alpine
- **Build**: Multi-stage (build TypeScript → run)
- **Port**: 3001
- **Health Check**: GET /health
- **Resources**: 256-512 CPU, 512-1024 MB RAM

### Image Tagging Strategy
- **Format**: `{environment}-{git-hash}-{timestamp}`
- **Examples**: 
  - `prod-a1b2c3d-20241215120000`
  - `dev-e4f5g6h-20241215140000`

## 🔄 CI/CD Pipeline

### Workflow Triggers
- **Pull Request**: Run tests and security scans
- **Push to develop**: Deploy to dev environment
- **Push to main**: Deploy to production environment

### Pipeline Stages

1. **Test Stage**
   - Install dependencies
   - Run linting
   - Execute unit tests
   - Generate coverage reports

2. **Security Stage**
   - Trivy vulnerability scanning
   - SARIF report upload
   - Security analysis

3. **Build Stage**
   - Build frontend and backend
   - Upload build artifacts
   - Prepare for deployment

4. **Deploy Stage**
   - Build Docker images
   - Push to ECR
   - Deploy infrastructure
   - Update ECS services

### Required Secrets (GitHub)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `OPENAI_API_KEY`

## 📊 Monitoring & Observability

### CloudWatch Metrics

#### ECS Metrics
- CPU Utilization
- Memory Utilization
- Running Task Count
- Service Events

#### ALB Metrics
- Request Count
- Response Time
- HTTP Error Rates
- Target Health

### Log Aggregation

#### Log Groups
- `/ecs/{project}-{environment}`
  - Frontend logs: Stream prefix `frontend`
  - Backend logs: Stream prefix `backend`

#### Log Retention
- **Dev**: 7 days
- **Test**: 14 days
- **Prod**: 30 days

### Alerting (Recommended)

Create CloudWatch alarms for:
- High CPU usage (>80%)
- High memory usage (>80%)
- HTTP 5xx errors (>5%)
- Task failures

## 🔒 Security Architecture

### Defense in Depth

1. **Network Security**
   - Private subnets for workloads
   - Security groups (stateful firewall)
   - NACLs (stateless firewall)

2. **Application Security**
   - Non-root container users
   - Read-only root filesystems
   - Secrets via AWS Secrets Manager

3. **Access Control**
   - IAM roles with least privilege
   - Service-linked roles for AWS services
   - No hardcoded credentials

4. **Data Protection**
   - Encryption in transit (HTTPS/TLS)
   - Encrypted CloudWatch logs
   - Secure API key storage

### Compliance Features

- **Audit Logging**: CloudTrail for all API calls
- **Data Residency**: Single region deployment
- **Access Controls**: IAM and security groups
- **Encryption**: At rest and in transit

## 💰 Cost Analysis

### Monthly Cost Breakdown (Production)

| Service | Usage | Cost |
|---------|-------|------|
| ECS Fargate | 4 tasks × 0.5 vCPU × 1GB × 720h | $52 |
| ALB | 1 load balancer + data processing | $25 |
| NAT Gateway | 2 gateways × $32 | $64 |
| ECR | 10GB storage | $1 |
| CloudWatch | Logs + metrics | $10 |
| Secrets Manager | 1 secret | $0.40 |
| Route53 | 1 hosted zone | $0.50 |
| **Total** | | **~$153** |

### Cost Optimization Strategies

1. **Right-sizing**
   - Monitor CPU/memory usage
   - Adjust container resources
   - Use Fargate Spot (development)

2. **Scheduled Scaling**
   - Scale down dev/test during off-hours
   - Use Application Auto Scaling

3. **Resource Sharing**
   - Shared ALB across environments
   - Cross-environment ECR repositories

## 🚀 Scaling Strategies

### Horizontal Scaling

#### Auto Scaling Policies
```hcl
# CPU-based scaling
resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = "ecs"
  
  target_tracking_scaling_policy_configuration {
    target_value = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

### Vertical Scaling

#### Resource Allocation
- **Development**: 0.25 vCPU, 512 MB
- **Test**: 0.5 vCPU, 1024 MB
- **Production**: 1 vCPU, 2048 MB

## 🔄 Disaster Recovery

### Backup Strategy

1. **Infrastructure as Code**
   - All infrastructure in Terraform
   - Version controlled
   - Reproducible deployments

2. **Container Images**
   - ECR cross-region replication
   - Image lifecycle policies
   - Multiple tagged versions

3. **Configuration**
   - Secrets Manager replication
   - Environment-specific configs
   - GitOps for configuration management

### Recovery Procedures

#### Infrastructure Recovery
```bash
# Restore complete environment
./scripts/deploy.sh prod apply

# Restore specific components
terraform apply -target=module.ecs
```

#### Application Recovery
```bash
# Rollback to previous version
aws ecs update-service \
  --cluster counselor-prod-cluster \
  --service counselor-prod-frontend \
  --task-definition counselor-prod-frontend:123
```

### RTO/RPO Targets

- **RTO (Recovery Time Objective)**: 30 minutes
- **RPO (Recovery Point Objective)**: 1 hour
- **MTTR (Mean Time To Recovery)**: 15 minutes

## 📋 Operational Runbooks

### Deployment Checklist

- [ ] Code reviewed and approved
- [ ] Tests passing
- [ ] Security scan passed
- [ ] Environment variables updated
- [ ] Deployment window scheduled
- [ ] Rollback plan prepared

### Incident Response

1. **Detection**: CloudWatch alarms, health checks
2. **Assessment**: Check metrics and logs
3. **Mitigation**: Scale up, rollback, or restart
4. **Recovery**: Restore service to normal
5. **Post-mortem**: Document and improve

### Maintenance Windows

- **Development**: Anytime
- **Test**: Business hours
- **Production**: Scheduled maintenance windows

---

This infrastructure provides a solid foundation for running the AI Career Counseling Platform on AWS with security, scalability, and cost-effectiveness in mind.