# Google Drive Service Account Setup

## Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Note your project ID

## Step 2: Enable Google Drive API
1. Go to "APIs & Services" > "Library"
2. Search "Google Drive API"
3. Click "Enable"

## Step 3: Create Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Name: `inflio-video-uploader`
4. Click "Create and Continue"
5. Skip role assignment (click Continue)
6. Click "Done"

## Step 4: Generate Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON"
5. Download the JSON file (keep it safe!)

## Step 5: Create Google Drive Folder
1. Go to https://drive.google.com
2. Create a new folder named "Inflio Videos"
3. Right-click folder > "Share"
4. Add the service account email (from JSON file)
5. Give it "Editor" permission
6. Copy the folder ID from URL (everything after `/folders/`)

## Step 6: Add to .env.local
Open the downloaded JSON file and extract:

```bash
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL="your-service-account@project-id.iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="your-folder-id-from-url"
```

**Important**: The private key will have `\n` characters - keep them as literal `\n` in the .env file.

## Quick Test
After adding env vars and restarting server, the first video upload will test the integration.
