# Reddit Clone — Front Page of the Internet

> A lightweight, reactive Reddit-inspired web app built with React + Firebase. Browse communities, create subreddits, post links/images/text, vote, and follow communities in real-time.

---

## 🌐 Overview

This application is a fully-functional Reddit-inspired web platform built with **React**, designed to allow users to browse, create, and interact with community-driven content. It focuses on simplicity, performance, and a clean UI while providing the core features found in modern content-sharing platforms. All realtime data (subreddits, posts, subscriptions) is powered by **Firebase Firestore** and authentication is handled via **Firebase Auth** (Google provider in the starter).

## ✨ Key Features

- Home feed of posts (real-time)
- Create text, link, or image posts
- Create and customize subreddits (theme color, description)
- Join / leave subreddits
- Personalized feed of posts from joined subreddits
- Upvote / downvote posts (authors cannot vote on their own posts)
- Optimistic UI updates for faster UX (new posts / subreddits appear instantly)
- Search posts (client-side search across title, body, author, subreddit)
- Profile page showing user's posts and joined communities

## 🧭 User Stories

1. A user can view posts on the home page.
2. A user can create their own posts (text / link / image).
3. A user can follow (join) subreddits and see a personalized feed.
4. A user can upvote or downvote a post (except their own).
5. A user can create their own subreddit to host content about an interest.
6. A user can browse and list joined subreddits.
7. A user can customize a subreddit theme color.

---

## 🛠 Tech Stack

- React (Create React App)
- React Router
- Firebase Auth (Google, email, etc.)
- Cloud Firestore (realtime listeners)
- React Context for global data
- react-icons for UI icons

---

## 🚀 Quick Start

### Prerequisites

- Node.js (16+ recommended)
- npm or yarn
- A Firebase project with Firestore and Auth enabled

### 1. Clone

```bash
git clone https://github.com/Derrick-Nyongesa/reddit-clone.git
cd <your-repo>
```

### 2. Install

```bash
npm install
# or
# yarn
```

### 3. Firebase configuration

Create a `.env` (or use your environment system) in project root and add your Firebase config values:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxxxxxx
REACT_APP_FIREBASE_APP_ID=1:xxxxx:web:xxxx
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXX
```

> The app expects the firebase config to be consumed by `src/firebase.js` using `process.env.REACT_APP_*` variables.

### 4. Run locally

```bash
npm start
# open http://localhost:3000
```

### Available scripts

- `npm start` — run in development mode
- `npm test` — run test watcher
- `npm run build` — build production bundle
- `npm run eject` — eject CRA configuration (one-way)

---

## 🔐 Recommended Firestore Rules (development)

> **Warning:** The snippet below is intended for development. Tighten rules before production.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // allow authenticated users to read collections
    match /subreddits/{subId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      // restrict updates to members only (example)
      allow update: if request.auth != null && request.resource.data.members is list;
    }

    match /posts/{postId} {
      allow read: if request.auth != null;
      // create only when authorId matches requester
      allow create: if request.auth != null && request.resource.data.authorId == request.auth.uid;
      // update/delete only by author
      allow update, delete: if request.auth != null && resource.data.authorId == request.auth.uid;
    }

    match /reddit-users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // fallback (restrict) — remove or adapt as needed
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🧩 Project Structure (important files)

```
src/
├─ components/
│  ├─ Header.jsx
│  ├─ Sidebar.jsx
│  ├─ PostCard.jsx
│  └─ SubredditList.jsx
├─ pages/
│  ├─ Home.jsx
│  ├─ Subreddit.jsx
│  ├─ CreatePost.jsx
│  ├─ NewSubreddit.jsx
│  ├─ Profile.jsx
│  └─ Search.jsx
├─ context/
│  ├─ AuthContext.js   # firebase auth listener
│  └─ DataContext.js   # all Firestore listeners and CRUD helpers
├─ firebase.js
├─ helpers.js
└─ App.js
```

---

## ✅ Implementation Notes / Tips

- The app uses **realtime Firestore listeners** (`onSnapshot`) to keep subreddits, posts, and user subscriptions in sync.
- The `DataContext` includes guards to wait for auth initialization before attaching listeners to avoid permission errors on sign-up/login.
- Posts and subreddits are optimistically added to local state immediately on create to give snappy UX. Real server data reconciles shortly after.
- Subscriptions are stored on user documents as `r/<subname>` to keep route compatibility (e.g. `r/memes`). Post documents store `subreddit` as the normalized doc id (e.g. `memes`).

---

## 🧪 Testing & Debugging

- Use the Browser DevTools Console to observe debug logs emitted from `DataContext` (e.g. `"[DataContext] posts snapshot:"`).
- If you see `Missing or insufficient permissions`, verify Firestore rules and that the Firebase config points to the correct project.

---

## 🤝 Contributing

Contributions welcome! Please open issues or PRs for bug fixes and enhancements. Keep changes small and include a short description & testing steps.

---

## 📄 License

MIT — feel free to reuse and adapt this project.

---

## Contact

Questions or feature requests? Open an issue or reach out via your repository platform.

_Enjoy building!_ 🚀
