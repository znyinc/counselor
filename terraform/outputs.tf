# Outputs definition file
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.lb_dns_name
}

output "frontend_url" {
  description = "URL of the frontend application"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${module.alb.lb_dns_name}"
}

output "backend_url" {
  description = "URL of the backend API"
  value       = var.domain_name != "" ? "https://api.${var.domain_name}" : "http://${module.alb.lb_dns_name}/api"
}

output "ecr_frontend_repository_url" {
  description = "URL of the ECR repository for frontend"
  value       = module.ecr.frontend_repository_url
}

output "ecr_backend_repository_url" {
  description = "URL of the ECR repository for backend"
  value       = module.ecr.backend_repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = module.secrets.secrets_manager_arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = module.ecs.log_group_name
}