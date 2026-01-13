# Firebase Storage CORS Setup

## Problem
Firebase Storage blocks requests from your domain due to CORS policy.

## Solution

### Step 1: Install Google Cloud SDK (if not already installed)
Download and install from: https://cloud.google.com/sdk/docs/install

### Step 2: Authenticate
```bash
gcloud auth login
```

### Step 3: Set your project
```bash
gcloud config set project shironeko-archive
```

### Step 4: Apply CORS configuration
```bash
gsutil cors set cors.json gs://shironeko-archive.firebasestorage.app
```

## Alternative: Use Firebase Console

If you don't want to use command line:

1. Go to: https://console.firebase.google.com/project/shironeko-archive/storage
2. Click on "Rules" tab
3. Make sure your Storage Rules allow authenticated writes:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /audio/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Quick Fix (Temporary)
If the above doesn't work immediately, you can temporarily use anonymous auth and public read/write for testing (NOT recommended for production):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```
