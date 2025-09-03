# Production environment configuration
environment = "prod"
aws_region  = "us-east-1"

# Full protection for production
enable_deletion_protection = true
enable_backup             = true
log_retention_days        = 30

# Set your production domain name here
# domain_name = "yourdomain.com"

# OpenAI API key - set this via environment variable or terraform.tfvars.local
# openai_api_key = "your-openai-api-key-here"