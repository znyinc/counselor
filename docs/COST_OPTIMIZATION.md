# AWS Cost Optimization Guide

This guide provides strategies to optimize costs while maintaining performance and reliability for the AI Career Counseling Tool deployed on AWS.

## 💰 Current Cost Breakdown

### Monthly Costs (us-east-1, Production)

| Service | Current Config | Monthly Cost | Optimization Potential |
|---------|----------------|--------------|----------------------|
| ECS Fargate | 2 tasks (0.25 vCPU, 0.5GB) | $15 | Medium |
| RDS PostgreSQL | db.t3.micro, 20GB | $20 | High |
| ElastiCache Redis | cache.t3.micro, 2 nodes | $25 | Medium |
| Application Load Balancer | Standard ALB | $23 | Low |
| NAT Gateway | 2 AZs | $64 | High |
| Data Transfer | 100GB/month | $9 | Medium |
| CloudWatch Logs | 5GB retention | $2.50 | Low |
| ECR Storage | 2GB images | $0.20 | Low |
| **Total** | | **$158.70** | **~40% savings possible** |

## 🎯 Optimization Strategies

### 1. Compute Optimization (ECS Fargate)

#### Current: $15/month
#### Optimized: $8-12/month (20-47% savings)

**Strategies:**
```hcl
# Use smaller instance sizes during low traffic
variable "backend_cpu" {
  default = 256  # Current
  # Optimize to: 128 for low traffic periods
}

variable "backend_memory" {
  default = 512  # Current
  # Optimize to: 256 for low traffic periods
}
```

**Auto Scaling Configuration:**
```hcl
resource "aws_appautoscaling_target" "backend" {
  min_capacity = 1  # Instead of 2
  max_capacity = 5  # Scale up only when needed
}

# Add time-based scaling
resource "aws_appautoscaling_scheduled_action" "scale_down_night" {
  name               = "scale-down-night"
  service_namespace  = "ecs"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = "ecs:service:DesiredCount"
  schedule           = "cron(0 22 * * ? *)"  # 10 PM UTC
  
  scalable_target_action {
    min_capacity = 1
    max_capacity = 2
  }
}
```

**Cost Impact:** $6-8/month savings

### 2. Database Optimization (RDS)

#### Current: $20/month
#### Optimized: $12-16/month (20-40% savings)

**Right-sizing:**
```hcl
# Start smaller and scale up if needed
variable "db_instance_class" {
  default = "db.t3.micro"     # Current
  # Consider: "db.t4g.micro"  # ARM-based, 20% cheaper
}

# Optimize storage
variable "db_allocated_storage" {
  default = 20  # Current
  # Start with 10GB, enable auto-scaling
}

resource "aws_db_instance" "main" {
  # Enable storage autoscaling
  max_allocated_storage = 100
}
```

**Backup Optimization:**
```hcl
# Reduce backup retention for development
variable "db_backup_retention_period" {
  default = 7   # Production
  # Development: 1-3 days
}

# Consider disabling automated backups for dev environments
backup_retention_period = var.environment == "prod" ? 7 : 1
```

**Cost Impact:** $4-8/month savings

### 3. Cache Optimization (ElastiCache)

#### Current: $25/month
#### Optimized: $15-20/month (20-40% savings)

**Single Node for Development:**
```hcl
resource "aws_elasticache_replication_group" "main" {
  # Use single node for development
  num_cache_clusters         = var.environment == "prod" ? 2 : 1
  automatic_failover_enabled = var.environment == "prod" ? true : false
  multi_az_enabled          = var.environment == "prod" ? true : false
}
```

**Smaller Instance Type:**
```hcl
# Start with smaller instances
node_type = "cache.t4g.micro"  # ARM-based, cheaper than t3.micro
```

**Cost Impact:** $5-10/month savings

### 4. Network Optimization (NAT Gateway)

#### Current: $64/month
#### Optimized: $0-32/month (50-100% savings)

**Option 1: NAT Instances (High Savings)**
```hcl
# Replace NAT Gateway with NAT Instance
resource "aws_instance" "nat" {
  count                  = var.environment == "prod" ? 2 : 1
  ami                    = data.aws_ami.nat.id
  instance_type          = "t3.nano"  # $3.50/month each
  subnet_id              = aws_subnet.public[count.index].id
  source_dest_check      = false
  
  tags = {
    Name = "${var.project_name}-nat-${count.index + 1}"
  }
}
```

**Option 2: VPC Endpoints (Partial Savings)**
```hcl
# Add VPC endpoints for AWS services
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  route_table_ids     = aws_route_table.private[*].id
}
```

**Cost Impact:** $32-64/month savings

### 5. Development Environment Optimization

**Separate Configurations:**
```hcl
# terraform/environments/dev/terraform.tfvars
environment = "dev"
desired_capacity = 1
min_capacity = 1
max_capacity = 2
db_instance_class = "db.t4g.micro"
db_backup_retention_period = 1
```

**Schedule-based Scaling:**
```bash
#!/bin/bash
# scripts/scale-down-dev.sh
# Scale down development environment during nights/weekends

aws ecs update-service \
  --cluster counselor-dev \
  --service counselor-dev-backend \
  --desired-count 0

aws ecs update-service \
  --cluster counselor-dev \
  --service counselor-dev-frontend \
  --desired-count 0
```

## 📊 Cost Monitoring and Alerts

### 1. Set Up Billing Alerts
```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "Monthly-Bill-Exceeds-200" \
  --alarm-description "Alert when monthly bill exceeds $200" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 200 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:billing-alerts
```

### 2. Resource Tagging for Cost Allocation
```hcl
# Standard tags for all resources
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = "ai-career-counseling-team"
    CostCenter  = "engineering"
    Application = "career-counseling"
  }
}

# Apply to all resources
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"
  tags = local.common_tags
}
```

### 3. AWS Cost Explorer Setup
```bash
# Enable Cost Explorer API (one-time setup)
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-02-01 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 🛠️ Implementation Plan

### Phase 1: Immediate Wins (Week 1)
1. **Right-size ECS tasks** - 20% savings on compute
2. **Reduce RDS backup retention** in dev - $2-3/month
3. **Single ElastiCache node** in dev - $12/month
4. **Enable detailed monitoring** for optimization insights

### Phase 2: Network Optimization (Week 2-3)
1. **Implement NAT instances** for dev environment - $32/month
2. **Add VPC endpoints** for AWS services - $10-15/month
3. **Optimize data transfer** patterns

### Phase 3: Advanced Optimization (Month 2)
1. **Implement Reserved Instances** for consistent workloads - 30-60% savings
2. **Use Spot Instances** for non-critical tasks - 50-90% savings
3. **Implement S3 for static assets** - reduce ECS load

### Phase 4: Automation (Month 3)
1. **Automated scaling schedules** based on usage patterns
2. **Cost anomaly detection** with automatic alerts
3. **Regular right-sizing recommendations**

## 📈 Optimized Architecture Costs

### Target Monthly Costs

| Service | Optimized Config | Monthly Cost | Savings |
|---------|------------------|--------------|---------|
| ECS Fargate | Smart scaling, ARM instances | $8 | $7 |
| RDS PostgreSQL | db.t4g.micro, optimized storage | $12 | $8 |
| ElastiCache Redis | Single node dev, t4g.micro | $15 | $10 |
| Application Load Balancer | Same | $23 | $0 |
| NAT Gateway/Instance | NAT instances | $7 | $57 |
| Data Transfer | Optimized patterns | $6 | $3 |
| CloudWatch Logs | Same | $2.50 | $0 |
| ECR Storage | Same | $0.20 | $0 |
| **Total Optimized** | | **$73.70** | **$85** |

**Total Savings: 54% reduction in monthly costs**

## 🚨 Cost Alerts and Monitoring

### CloudWatch Cost Anomaly Detection
```hcl
resource "aws_ce_anomaly_detector" "service_monitor" {
  name         = "service-spend-anomaly-detector"
  monitor_type = "DIMENSIONAL"

  specification = jsonencode({
    Dimension = "SERVICE"
    MatchOptions = ["EQUALS"]
    Values = ["Amazon Elastic Compute Cloud - Compute", "Amazon Relational Database Service"]
  })
}

resource "aws_ce_anomaly_subscription" "cost_alerts" {
  name      = "cost-anomaly-alerts"
  frequency = "DAILY"
  
  monitor_arn_list = [
    aws_ce_anomaly_detector.service_monitor.arn,
  ]
  
  subscriber {
    type    = "EMAIL"
    address = "team@example.com"
  }
  
  threshold_expression {
    and {
      dimension {
        key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
        values        = ["100"]
        match_options = ["GREATER_THAN_OR_EQUAL"]
      }
    }
  }
}
```

### Weekly Cost Reports
```bash
#!/bin/bash
# scripts/weekly-cost-report.sh

# Get weekly cost breakdown
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost,UsageQuantity \
  --group-by Type=DIMENSION,Key=SERVICE \
  --output table
```

## 🎯 Cost Optimization Best Practices

### 1. Regular Reviews
- **Weekly**: Review CloudWatch metrics for right-sizing opportunities
- **Monthly**: Analyze cost reports and trends
- **Quarterly**: Review Reserved Instance coverage and utilization

### 2. Automation
- **Auto Scaling**: Configure based on actual usage patterns
- **Scheduled Actions**: Scale down during low-traffic periods
- **Lifecycle Policies**: Automatic cleanup of old logs, snapshots

### 3. Environment Management
- **Separate Accounts**: Use different AWS accounts for dev/staging/prod
- **Shared Services**: Use shared ALB for multiple environments
- **On-Demand Development**: Start/stop dev environments as needed

### 4. Performance vs Cost Balance
- **Monitor Application Metrics**: Ensure optimization doesn't impact performance
- **Load Testing**: Validate performance after cost optimizations
- **Gradual Changes**: Implement optimizations incrementally

## 📋 Optimization Checklist

### ✅ Immediate Actions
- [ ] Enable detailed billing reports
- [ ] Set up cost alerts and budgets
- [ ] Tag all resources for cost allocation
- [ ] Right-size ECS tasks based on usage

### ✅ Short-term (1-4 weeks)
- [ ] Implement environment-specific configurations
- [ ] Replace NAT Gateways with NAT instances for dev
- [ ] Optimize database backup retention
- [ ] Add VPC endpoints for AWS services

### ✅ Medium-term (1-3 months)
- [ ] Implement Reserved Instances for consistent workloads
- [ ] Set up automated scaling schedules
- [ ] Move static assets to S3 + CloudFront
- [ ] Implement cost anomaly detection

### ✅ Long-term (3+ months)
- [ ] Consider multi-region deployment optimization
- [ ] Implement advanced caching strategies
- [ ] Evaluate Savings Plans vs Reserved Instances
- [ ] Regular architecture reviews for cost optimization

---

**Remember**: Cost optimization is an ongoing process. Start with high-impact, low-risk changes and gradually implement more advanced optimizations while monitoring application performance.