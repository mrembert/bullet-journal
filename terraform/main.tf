terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Artifact Registry Repository
resource "google_artifact_registry_repository" "default" {
  location      = var.region
  repository_id = var.repository_name
  description   = "Docker repository for Bullet Journal App"
  format        = "DOCKER"
}

# Cloud Run Service
resource "google_cloud_run_service" "default" {
  name     = var.service_name
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_name}/${var.service_name}:${var.image_tag}"

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }

        ports {
          container_port = 8080
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_artifact_registry_repository.default]
}

# IAM Policy to allow public access
data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "noauth" {
  location    = google_cloud_run_service.default.location
  project     = google_cloud_run_service.default.project
  service     = google_cloud_run_service.default.name

  policy_data = data.google_iam_policy.noauth.policy_data
}
