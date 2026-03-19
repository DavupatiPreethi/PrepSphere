# PrepSphere — AI Interview Coach

A full-stack AI interview practice platform with user accounts, dashboard, fullscreen interview mode, and detailed performance analysis.

---

## Setup (2 minutes)

### Step 1 — Add your API key
Open `config.js` and replace `YOUR_API_KEY_HERE` with your Anthropic API key:
```js
ANTHROPIC_API_KEY: "sk-ant-api03-your-key-here",
```
Get a key at: https://console.anthropic.com

### Step 2 — Add billing credits
Your Anthropic account needs credits to use the API.
Go to: https://console.anthropic.com/billing → Add $5 minimum.

### Step 3 — Run in VS Code
1. Open the `interview-pro` folder in VS Code
2. Install the **Live Server** extension (by Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**
4. App opens at http://127.0.0.1:5500

---

## Features

- Landing page with hero section
- User signup / login (stored in browser localStorage)
- Personal dashboard with stats (total, avg score, best score, this week)
- Interview history saved per user
- Interview setup: type, language, difficulty, question count
- Fullscreen interview mode (prevents cheating)
- Fullscreen exit warning with Quit / Return options
- Timer during interview
- Typing indicator while AI is thinking
- End interview early option
- Detailed results: score ring, correct/partial/missed, per-question feedback
- Strengths & improvement areas
- Overall AI feedback paragraph

---

## Files

```
interview-pro/
├── index.html   — All screens
├── style.css    — All styles
├── app.js       — All logic
├── db.js        — localStorage database
├── config.js    — API key (edit this!)
└── README.md
```
