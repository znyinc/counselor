variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}