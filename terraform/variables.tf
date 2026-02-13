variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The Google Cloud region to deploy to"
  type        = string
  default     = "us-central1"
}

variable "image_tag" {
  description = "The tag of the Docker image to deploy"
  type        = string
}

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
  default     = "bullet-journal"
}

variable "repository_name" {
  description = "The name of the Artifact Registry repository"
  type        = string
  default     = "bullet-journal-repo"
}
