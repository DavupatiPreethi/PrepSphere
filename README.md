# 🎯 PrepSphere — AI Mock Interview Platform

<div align="center">

![PrepSphere](https://img.shields.io/badge/PrepSphere-AI%20Interview%20Coach-6366f1?style=for-the-badge&logo=star&logoColor=white)

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20Site-success?style=for-the-badge)](https://jocular-zabaione-4ea53b.netlify.app)
[![Backend](https://img.shields.io/badge/⚡%20Backend-Vercel-black?style=for-the-badge)](https://y-omega-wheat.vercel.app)

**Practice real interview questions with AI, speak your answers out loud, track your confidence — all in one place.**

[Live Demo](https://jocular-zabaione-4ea53b.netlify.app) • [Report Bug](https://github.com/DavupatiPreethi/PrepSphere/issues) • [Request Feature](https://github.com/DavupatiPreethi/PrepSphere/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Interviewer** | Powered by Groq LLaMA 3.3-70B — asks adaptive questions like a real interviewer |
| 🎤 **Voice Mode** | Speak your answers using real-time speech-to-text (Web Speech API) |
| 😌 **Confidence Tracker** | Webcam-based stress & confidence detection during interview |
| 🏢 **Company Mode** | Tailored questions for Google, Amazon, Microsoft, Flipkart & more |
| 📊 **Performance Dashboard** | Score trends, topic-wise analytics, weekly activity tracking |
| 🔐 **Firebase Auth** | Secure login/signup with data synced across all devices |
| ⚡ **Instant Feedback** | Per-question scoring with strengths, improvements & overall feedback |

---

## 🛠️ Tech Stack

**Frontend**
- Vanilla JavaScript, HTML5, CSS3
- Firebase Authentication & Firestore
- Web Speech API (voice recognition)
- WebRTC (webcam confidence tracking)

**Backend**
- Node.js + Express.js
- Groq API — LLaMA 3.3-70B

**Deployment**
- Frontend → Netlify
- Backend → Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Free [Groq API Key](https://console.groq.com)
- Free [Firebase Project](https://console.firebase.google.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/DavupatiPreethi/PrepSphere.git
cd PrepSphere
```

**Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Fill in your API keys in .env
node server.js
# ✅ PrepSphere API running on port 3000
```

**Frontend:**
- Open `frontend/index.html` with Live Server in VSCode

---

## ⚙️ Environment Variables

Create `.env` in `backend/` folder:

```env
GROQ_API_KEY=your_groq_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

---

## 📁 Project Structure

```
PrepSphere/
├── frontend/
│   ├── index.html      # Main UI
│   ├── app.js          # Application logic
│   ├── db.js           # Firebase integration
│   ├── config.js       # Configuration
│   └── style.css       # Styles
├── backend/
│   ├── server.js       # Express API server
│   ├── package.json
│   ├── vercel.json     # Vercel config
│   └── .env.example    # Environment template
└── README.md
```

---

## 🎯 How It Works

1. **Sign up** with your email
2. **Configure** — interview type, company, difficulty, language
3. **Start** — AI asks one question at a time
4. **Answer** by typing or speaking (voice mode)
5. **Get scored** — detailed feedback with strengths & areas to improve
6. **Track progress** on your personal dashboard

---

## 📄 License

MIT License — feel free to use and modify.

---

<div align="center">

Made with ❤️ by [Preethi Davupati](https://github.com/DavupatiPreethi)

⭐ **Star this repo if you found it helpful!**

</div>
