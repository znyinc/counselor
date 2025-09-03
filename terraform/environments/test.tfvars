# Test environment configuration
environment = "test"
aws_region  = "us-east-1"

# Moderate protection for test environment
enable_deletion_protection = false
enable_backup             = true
log_retention_days        = 14

# Optional: Set your domain name here if you have one
# domain_name = "test.yourdomain.com"

# OpenAI API key - set this via environment variable or terraform.tfvars.local
# openai_api_key = "your-openai-api-key-here"