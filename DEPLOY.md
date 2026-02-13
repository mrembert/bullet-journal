# Deployment Setup Instructions

This guide explains how to configure Google Cloud Platform (GCP) and GitHub Secrets to enable the automated deployment pipeline for this project.

## Prerequisites

1.  A Google Cloud Project with billing enabled.
2.  Google Cloud SDK (`gcloud`) installed and authenticated locally.
3.  GitHub repository admin access.

## Step 1: Enable Required APIs

Run the following commands to enable the necessary Google Cloud APIs:

```bash
gcloud services enable artifactregistry.googleapis.com \
    run.googleapis.com \
    iamcredentials.googleapis.com \
    cloudresourcemanager.googleapis.com
```

## Step 2: Create Terraform State Bucket

Terraform needs a remote backend to store the state of your infrastructure. We'll use a Google Cloud Storage (GCS) bucket for this.

1.  Choose a unique name for your bucket (e.g., `bullet-journal-tf-state`).
2.  Create the bucket:

```bash
export BUCKET_NAME="bullet-journal-tf-state"
export LOCATION="us-east1" # Or your preferred region

gcloud storage buckets create gs://$BUCKET_NAME --location=$LOCATION
```

3.  Enable versioning on the bucket (recommended for state files):

```bash
gcloud storage buckets update gs://$BUCKET_NAME --versioning
```

## Step 3: Configure Workload Identity Federation

Workload Identity Federation allows GitHub Actions to authenticate to Google Cloud without storing long-lived service account keys.

1.  **Set environment variables:**

```bash
export PROJECT_ID="bullet-journal-487001"
export POOL_NAME="github-actions-pool"
export PROVIDER_NAME="github-actions-provider"
export SA_NAME="github-deploy-sa"
export REPO="mrembert/bullet-journal" # format: owner/repo
```

2.  **Create the Workload Identity Pool:**

```bash
gcloud iam workload-identity-pools create $POOL_NAME \
    --project=$PROJECT_ID \
    --location="global" \
    --display-name="GitHub Actions Pool"
```

3.  **Create the Workload Identity Provider:**

```bash
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
    --project=$PROJECT_ID \
    --location="global" \
    --workload-identity-pool=$POOL_NAME \
    --display-name="GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"
```

4.  **Create a Service Account for Deployment:**

```bash
gcloud iam service-accounts create $SA_NAME \
    --display-name="GitHub Actions Deployment SA"
```

5.  **Grant Permissions to the Service Account:**

The service account needs permissions to manage Artifact Registry, Cloud Run, and Storage (for Terraform state).

```bash
# Artifact Registry Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin"

# Cloud Run Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

# Service Account User (to deploy Cloud Run services as this SA)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Storage Admin (for Terraform state bucket access)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"
```

6.  **Allow GitHub Actions to Impersonate the Service Account:**

```bash
# Get the full pool ID
export WORKLOAD_IDENTITY_POOL_ID=$(gcloud iam workload-identity-pools describe $POOL_NAME \
    --project=$PROJECT_ID \
    --location="global" \
    --format="value(name)")

# Bind the repository to the service account
gcloud iam service-accounts add-iam-policy-binding "$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --project=$PROJECT_ID \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${REPO}"
```

## Step 4: Configure GitHub Secrets

Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

Add the following secrets:

| Secret Name | Value | Description |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | `your-project-id` | Your Google Cloud Project ID. |
| `GCP_REGION` | `us-central1` | Region for resources (e.g., us-central1). |
| `TF_STATE_BUCKET_NAME` | `your-unique-bucket-name` | Name of the GCS bucket created in Step 2. |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/123456789/locations/global/workloadIdentityPools/...` | Full resource name of the provider. |
| `GCP_SERVICE_ACCOUNT` | `github-deploy-sa@...` | Email of the service account created in Step 3. |

**To find the Provider resource name:**

```bash
gcloud iam workload-identity-pools providers describe $PROVIDER_NAME \
    --project=$PROJECT_ID \
    --location="global" \
    --workload-identity-pool=$POOL_NAME \
    --format="value(name)"
```

## Step 5: Push to Main

Once these secrets are set, any push to the `main` branch will trigger the workflow, provision infrastructure via Terraform, build the container, and deploy it to Cloud Run.
