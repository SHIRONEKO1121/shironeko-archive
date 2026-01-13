# Firebase Online Publishing Setup

This document explains how to set up and use the Firebase online publishing feature.

## What's Implemented

The app now supports **dual storage**:
- **Local Storage** (localStorage): Draft articles visible only to you
- **Firebase** (Firestore): Published articles visible to everyone online

## Prerequisites

1. **Firebase Project** already created at [console.firebase.google.com](https://console.firebase.google.com)
2. **Firestore Database** enabled
3. **Authentication** enabled (Email/Password or Anonymous)

## Firebase Setup

### 1. Configure Firestore Security Rules

In Firebase Console → Firestore Database → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read published articles
    match /articles/{article} {
      allow read: if resource.data.isPublished == true;
      allow write: if request.auth != null;
    }
  }
}
```

### 2. Enable Authentication

Go to Firebase Console → Authentication → Sign-in method:
- Enable **Anonymous** authentication (easiest for single-author blogs)
- OR enable **Email/Password** for more control

### 3. Environment Variables

Your `.env` file has already been created with your Firebase config keys:
```
VITE_FIREBASE_API_KEY=AIzaSyCITv22oZdiJPMSCTSTTgoz0pw9tV8t8aM
VITE_FIREBASE_AUTH_DOMAIN=shironeko-archive.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shironeko-archive
...
```

**⚠️ IMPORTANT**: The `.env` file is in `.gitignore` to protect your keys.

## How to Use

### Publishing an Article

1. **Write & Save** your article locally (as usual)
2. Click **"Publish Online"** button in the Editor
3. The article is now:
   - Saved locally (localStorage)
   - Published to Firebase (Firestore)
   - Visible to all visitors

### Updating a Published Article

1. Edit the article locally
2. Click **"Update Online"** button
3. Changes sync to Firebase instantly

### Unpublishing an Article

1. Open a published article
2. Click **"Unpublish"** button
3. Article removed from Firebase (still in localStorage)

### Article Status Indicators

- **● Online** (green): Article is published and live
- No indicator: Draft only (local storage)

## How It Works

### Data Flow

```
┌─────────────────┐
│  Your Browser   │
│  (localStorage) │
│   Draft Articles│
└────────┬────────┘
         │
         ├─── Publish Online ───►
         │
┌────────▼────────┐
│    Firebase     │
│   (Firestore)   │
│ Published Only  │
└────────┬────────┘
         │
         └─── Everyone Sees ───►
```

### Authentication

- First publish automatically signs you in anonymously
- Firebase Auth tracks who published what
- Only authenticated users can publish/edit/delete

### Visitor Experience

1. Visitors open your site
2. They see all **published** articles (from Firebase)
3. They **cannot see** your drafts (localStorage)
4. Articles are read-only for visitors

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy Options

1. **Vercel** (Recommended):
   - Connect GitHub repo
   - Add `.env` variables in Vercel dashboard
   - Auto-deploys on push

2. **Netlify**:
   - Drag & drop `dist` folder
   - Add environment variables in settings

3. **Firebase Hosting**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

### Environment Variables in Production

Remember to add your `.env` variables to your deployment platform:
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Firebase Hosting**: Uses `.env` automatically

## Data Structure

### Article Schema (Firestore)

```typescript
{
  id: "article-123",
  title: "My Travel Story",
  content: "Markdown content...",
  categoryId: "travel",
  isPublished: true,
  publishedAt: "2026-01-14T...",
  authorId: "firebase-uid",
  date: "January 14, 2026",
  readTime: "5 min read",
  preview: "First 100 chars...",
  imageUrl: "cover-image-url",
  location: "Paris, France",
  musicUrl: "background-music-url"
}
```

## Troubleshooting

### "Must be authenticated to publish"
- Check Firebase Authentication is enabled
- Try refreshing the page

### "Failed to publish"
- Check Firestore Security Rules are set correctly
- Verify your Firebase project ID in `.env`

### Articles not appearing for visitors
- Ensure article `isPublished` is `true`
- Check Firestore Rules allow read access

### Dev server not loading env variables
- Restart dev server: `npm run dev`
- Check `.env` file exists in root directory

## Architecture Files

- `firebase.ts` - Firebase initialization
- `services/articleService.ts` - Firestore CRUD operations
- `components/Editor.tsx` - Publish/Unpublish UI
- `App.tsx` - Merges local + Firebase data
- `.env` - Firebase configuration (DO NOT COMMIT)

## Limitations

- Firebase free tier: 50k reads, 20k writes per day
- Image storage in base64 (not optimal for large images)
- Anonymous auth means anyone with password can publish

## Next Steps

- Add user authentication (Email/Password)
- Store images in Firebase Storage instead of base64
- Add social sharing buttons
- Implement article comments
- Add analytics tracking
