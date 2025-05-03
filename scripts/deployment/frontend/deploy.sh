#!/bin/bash
# Frontend deployment script
# This script builds and deploys the frontend to different environments

set -e

# Set current directory to the script directory
cd "$(dirname "$0")"
# Navigate to the frontend directory
cd ../../../frontend

# Get deployment environment from args
ENVIRONMENT=${1:-"production"}
echo "Deploying frontend to $ENVIRONMENT environment"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
  echo "Loading environment variables from .env.$ENVIRONMENT"
  export $(grep -v '^#' .env.$ENVIRONMENT | xargs)
elif [ -f ".env" ]; then
  echo "Loading environment variables from .env"
  export $(grep -v '^#' .env | xargs)
else
  echo "No environment file found. Using default values."
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the frontend
echo "Building frontend for $ENVIRONMENT..."
npm run build

# Deployment based on environment
case $ENVIRONMENT in
  production)
    echo "Deploying to production (AWS S3)..."
    
    # Validate required env vars
    if [ -z "$AWS_S3_BUCKET" ]; then
      echo "Error: AWS_S3_BUCKET environment variable is required"
      exit 1
    fi
    
    # Sync build files to S3 bucket
    echo "Syncing build files to S3 bucket: $AWS_S3_BUCKET"
    aws s3 sync build/ s3://$AWS_S3_BUCKET/ --delete
    
    # If CloudFront distribution is specified, create invalidation
    if [ ! -z "$AWS_CLOUDFRONT_DISTRIBUTION_ID" ]; then
      echo "Creating CloudFront invalidation for distribution: $AWS_CLOUDFRONT_DISTRIBUTION_ID"
      aws cloudfront create-invalidation --distribution-id $AWS_CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
    fi
    ;;
    
  staging)
    echo "Deploying to staging (Netlify)..."
    
    # Validate required env vars
    if [ -z "$NETLIFY_AUTH_TOKEN" ] || [ -z "$NETLIFY_SITE_ID" ]; then
      echo "Error: NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID environment variables are required"
      exit 1
    fi
    
    # Deploy to Netlify
    echo "Deploying to Netlify site: $NETLIFY_SITE_ID"
    npx netlify-cli deploy --prod --auth $NETLIFY_AUTH_TOKEN --site $NETLIFY_SITE_ID --dir build
    ;;
    
  development)
    echo "Deploying to development environment (local/dev server)..."
    # For development, we might just copy files to a local directory
    if [ ! -z "$DEV_DEPLOY_PATH" ]; then
      echo "Copying build files to: $DEV_DEPLOY_PATH"
      mkdir -p $DEV_DEPLOY_PATH
      cp -r build/* $DEV_DEPLOY_PATH/
    else
      echo "No DEV_DEPLOY_PATH specified. Skipping deployment."
    fi
    ;;
    
  *)
    echo "Unknown environment: $ENVIRONMENT"
    echo "Supported environments: production, staging, development"
    exit 1
    ;;
esac

echo "Frontend deployment to $ENVIRONMENT completed successfully!"
exit 0