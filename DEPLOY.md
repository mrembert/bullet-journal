# Deploying to Google Cloud Run

Follow these steps to deploy your Bullet Journal app to the web.

## 1. Prerequisites
- **Google Cloud SDK** installed and initialized (`gcloud init`).
- A **Billing-enabled** Google Cloud Project.

## 2. Prepare Environment
Since this is a Vite app, environment variables (like your Firebase config) must be present **during the build**.
1. Ensure your `.env.local` file contains all your `VITE_FIREBASE_...` keys.
2. We have configured `.dockerignore` to included this file so the builder can see it.

## 3. Enable Google Cloud Services
Run this command once to enable the necessary APIs:
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 4. Build and Deploy
Run these commands in your terminal:

### Step A: Setup Artifact Registry
First, we need to create a repository to store our Docker images. Run this once:
```bash
$PROJECT_ID = "bullet-journal-487001" 
# IMPORTANT: Switch gcloud to use this project
gcloud config set project $PROJECT_ID

gcloud artifacts repositories create bullet-journal-repo `
    --repository-format=docker `
    --location=us-central1 `
    --description="Bullet Journal App Repository"
```

### Step B: Build and Push
Now we build the image and push it to the new repository.
```bash
# Submit the build to Cloud Build
gcloud builds submit --tag us-central1-docker.pkg.dev/$PROJECT_ID/bullet-journal-repo/bullet-journal
```

### Step C: Deploy to Cloud Run
Finally, deploy the image from the new repository.
```bash
gcloud run deploy bullet-journal `
  --image us-central1-docker.pkg.dev/$PROJECT_ID/bullet-journal-repo/bullet-journal `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated
```

## 5. Verify
The command will output a **Service URL** (e.g., `https://bullet-journal-xyz-uc.a.run.app`).
Click it to open your live app!

> **Note**: If you see "Access Denied" or blank screens on the live site, ensure you have added the live URL to your **Firebase Console -> Authentication -> Settings -> Authorized Domains**.

## 6. Security Note
This deployment method is **secure** for the following reasons:
1.  **Multi-Stage Build**: The `.env` file containing your keys is used **only** during the build step. It is **discarded** in the final Docker image. Your raw environment file is never shipped to the server.
2.  **Public Keys**: The Firebase keys (API Key, Auth Domain, etc.) are designed to be public. It is safe for them to be embedded in your client-side JavaScript.
3.  **Data Protection**: Even though your app is public (`allow-unauthenticated`), your **Data** is protected by the **Firestore Security Rules** we set up earlier. Only logged-in users can read/write their own data.
4.  **No Server Secrets**: This architecture uses client-side auth. We are not storing any sensitive Service Account Keys on the server.
