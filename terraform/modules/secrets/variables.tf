variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}