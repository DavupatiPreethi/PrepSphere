# PrepSphere — AI Mock Interview Platform

## Folder Structure
```
PrepSphere-Full/
  frontend/    ← HTML/CSS/JS files (open in browser)
  backend/     ← Node.js server (handles API keys)
```

---

## Setup Instructions

### Step 1: Backend Setup
1. Open `backend/` folder in VSCode terminal
2. Run: `npm install`
3. Copy `.env.example` → rename to `.env`
4. Fill in your keys in `.env`:
   - Groq API key → https://console.groq.com (free)
   - Firebase config → Firebase Console → Project Settings

### Step 2: Run Backend Locally
```
cd backend
node server.js
```
Visit http://localhost:3000 — should show "PrepSphere API running ✅"

### Step 3: Frontend
- Open `frontend/index.html` with Live Server in VSCode
- config.js already points to http://localhost:3000

### Step 4: Deploy Backend to Vercel
1. Go to vercel.com → New Project → Import backend folder
2. Add Environment Variables (same as .env keys)
3. Deploy → Get URL like: https://prepsphere-backend.vercel.app

### Step 5: Update Frontend for Production
In `frontend/config.js`, change:
```js
BACKEND_URL: "https://your-backend-url.vercel.app",
```

### Step 6: Deploy Frontend to Netlify
1. Go to netlify.com → Add new site → Deploy manually
2. Drag & drop the `frontend/` folder
3. Done! Live URL vasthundi

---

## Keys Needed
- Groq API Key (free) → https://console.groq.com
- Firebase Config → https://console.firebase.google.com
