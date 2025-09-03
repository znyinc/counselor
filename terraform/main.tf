# AWS Infrastructure for AI Career Counseling Platform
# This creates a multi-environment setup (dev, test, prod) on AWS using ECS Fargate

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state management
  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket = "counselor-terraform-state"
  #   key    = "infrastructure/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values for computed configurations
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  # Environment-specific configurations
  env_config = {
    dev = {
      instance_count_frontend = 1
      instance_count_backend  = 1
      cpu_frontend           = 256
      memory_frontend        = 512
      cpu_backend           = 256
      memory_backend        = 512
    }
    test = {
      instance_count_frontend = 1
      instance_count_backend  = 1
      cpu_frontend           = 256
      memory_frontend        = 512
      cpu_backend           = 256
      memory_backend        = 512
    }
    prod = {
      instance_count_frontend = 2
      instance_count_backend  = 2
      cpu_frontend           = 512
      memory_frontend        = 1024
      cpu_backend           = 512
      memory_backend        = 1024
    }
  }
  
  current_config = local.env_config[var.environment]
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)
}

# ECR Module for container registry
module "ecr" {
  source = "./modules/ecr"

  name_prefix = local.name_prefix
}

# Secrets Manager Module
module "secrets" {
  source = "./modules/secrets"

  name_prefix     = local.name_prefix
  openai_api_key  = var.openai_api_key
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  name_prefix         = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  domain_name        = var.domain_name
}

# ECS Module for container orchestration
module "ecs" {
  source = "./modules/ecs"

  name_prefix                = local.name_prefix
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  alb_target_group_arn      = module.alb.target_group_arn
  alb_security_group_id     = module.alb.security_group_id
  
  # Container configurations
  frontend_image            = "${module.ecr.frontend_repository_url}:${var.frontend_image_tag}"
  backend_image            = "${module.ecr.backend_repository_url}:${var.backend_image_tag}"
  
  # Resource allocations
  frontend_cpu             = local.current_config.cpu_frontend
  frontend_memory          = local.current_config.memory_frontend
  backend_cpu              = local.current_config.cpu_backend
  backend_memory           = local.current_config.memory_backend
  
  # Scaling configurations
  frontend_desired_count   = local.current_config.instance_count_frontend
  backend_desired_count    = local.current_config.instance_count_backend
  
  # Secrets
  secrets_manager_arn      = module.secrets.secrets_manager_arn
  
  # Environment-specific variables
  environment = var.environment
  domain_name = var.domain_name
}