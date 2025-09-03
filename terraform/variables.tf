# Variables definition file
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be one of: dev, test, prod."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "counselor"
}

variable "domain_name" {
  description = "Domain name for the application (leave empty for ALB DNS)"
  type        = string
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API key for AI functionality"
  type        = string
  sensitive   = true
}

variable "frontend_image_tag" {
  description = "Docker image tag for frontend"
  type        = string
  default     = "latest"
}

variable "backend_image_tag" {
  description = "Docker image tag for backend"
  type        = string
  default     = "latest"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for resources"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable backup for data resources"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}