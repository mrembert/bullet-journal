terraform {
  backend "gcs" {
    # Bucket and prefix will be provided via CLI arguments or environment variables
    # e.g., terraform init -backend-config="bucket=$TF_STATE_BUCKET_NAME" -backend-config="prefix=terraform/state"
  }
}
