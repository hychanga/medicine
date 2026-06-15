#!/usr/bin/env bash
#
# One-time setup for auto-deploying the backend to Cloud Run via a Cloud Build
# GitHub trigger. Run it yourself after `gcloud auth login`:
#
#     bash scripts/setup-gcp.sh
#
# It is idempotent — safe to re-run. Edit the variables below first.
set -euo pipefail

# ===================== EDIT THESE =====================
PROJECT_ID="your-gcp-project-id"
REGION="asia-east1"
REPO="medicine"            # Artifact Registry repository name
SERVICE="medicine-api"     # Cloud Run service name
GITHUB_OWNER="hychanga"
GITHUB_REPO="medicine"

# TiDB Cloud connection (from the TiDB Cloud "Connect" dialog).
# Create the `medicine` database in the cluster first: CREATE DATABASE medicine;
TIDB_URL='jdbc:mysql://gateway01.<region>.prod.aws.tidbcloud.com:4000/medicine?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3'
TIDB_USERNAME='<prefix>.root'
TIDB_PASSWORD='<your-password>'
# ======================================================

gcloud config set project "$PROJECT_ID"

echo "▶ Enabling APIs…"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

echo "▶ Artifact Registry repo (idempotent)…"
gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker --location="$REGION" \
    --description="Medicine container images"

echo "▶ Secrets (create or add new version)…"
put_secret () {
  local name="$1" value="$2"
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- >/dev/null
  else
    printf '%s' "$value" | gcloud secrets create "$name" --replication-policy=automatic --data-file=- >/dev/null
  fi
  echo "   • $name"
}
put_secret tidb-url      "$TIDB_URL"
put_secret tidb-username "$TIDB_USERNAME"
put_secret tidb-password "$TIDB_PASSWORD"

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"  # Cloud Run runtime identity
DEPLOYER_SA="medicine-deployer@${PROJECT_ID}.iam.gserviceaccount.com" # Cloud Build runs as this

echo "▶ Deployer service account (idempotent)…"
gcloud iam service-accounts describe "$DEPLOYER_SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create medicine-deployer \
    --display-name="Medicine CI deployer"

echo "▶ Roles for the deployer SA…"
for role in roles/run.admin roles/artifactregistry.writer roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOYER_SA}" --role="$role" --condition=None >/dev/null
done
# Deployer must be able to "act as" the Cloud Run runtime SA when deploying.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${DEPLOYER_SA}" --role=roles/iam.serviceAccountUser >/dev/null

echo "▶ Let the Cloud Run runtime SA read the secrets…"
for s in tidb-url tidb-username tidb-password; do
  gcloud secrets add-iam-policy-binding "$s" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role=roles/secretmanager.secretAccessor >/dev/null
done

echo
echo "▶ Cloud Build GitHub trigger…"
echo "   If this fails with 'repository not connected', install the Cloud Build"
echo "   GitHub App on ${GITHUB_OWNER}/${GITHUB_REPO} once here, then re-run:"
echo "   https://console.cloud.google.com/cloud-build/triggers/connect?project=${PROJECT_ID}"
echo
gcloud builds triggers create github \
  --name="${SERVICE}-deploy" \
  --repo-owner="$GITHUB_OWNER" \
  --repo-name="$GITHUB_REPO" \
  --branch-pattern='^main$' \
  --build-config="backend/cloudbuild.yaml" \
  --included-files="backend/**" \
  --service-account="projects/${PROJECT_ID}/serviceAccounts/${DEPLOYER_SA}" \
  --substitutions="_SERVICE=${SERVICE},_REGION=${REGION},_REPO=${REPO}" \
  || echo "   (trigger may already exist — that's fine)"

echo
echo "✅ Setup complete."
echo "   Kick off the first deploy now:"
echo "     gcloud builds triggers run ${SERVICE}-deploy --branch=main"
echo "   After it finishes, get the service URL for Vercel's API_BASE_URL:"
echo "     gcloud run services describe ${SERVICE} --region=${REGION} --format='value(status.url)'"
