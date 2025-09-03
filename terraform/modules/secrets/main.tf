# Secrets Manager Module - Secure configuration management
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.name_prefix}-secrets"
  description             = "Secrets for ${var.name_prefix} application"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.name_prefix}-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    OPENAI_API_KEY = var.openai_api_key
    JWT_SECRET     = random_password.jwt_secret.result
    ENCRYPTION_KEY = random_password.encryption_key.result
    SESSION_SECRET = random_password.session_secret.result
    WEBHOOK_SECRET = random_password.webhook_secret.result
  })
}

# Generate random passwords for secrets
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "encryption_key" {
  length  = 32
  special = false
}

resource "random_password" "session_secret" {
  length  = 64
  special = true
}

resource "random_password" "webhook_secret" {
  length  = 32
  special = false
}