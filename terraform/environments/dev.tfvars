# Development environment configuration
environment = "dev"
aws_region  = "us-east-1"

# Keep costs low for dev environment
enable_deletion_protection = false
enable_backup             = false
log_retention_days        = 7

# Optional: Set your domain name here if you have one
# domain_name = "dev.yourdomain.com"

# OpenAI API key - set this via environment variable or terraform.tfvars.local
# openai_api_key = "your-openai-api-key-here"