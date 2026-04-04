// ══════════════════════════════════════════════════
//  PrepSphere — app.js (Clean Version)
//  Fixes: buttons, plain questions, incomplete score
// ══════════════════════════════════════════════════

const S = {
  user: null,
  type: "coding", lang: "Python", difficulty: "Medium",
  questionCount: 5, company: "General",
  currentQ: 0, questions: [], chatHistory: [],
  isWaiting: false, done: false,
  timerInterval: null, timerSeconds: 0,
  fsWarned: false, exitedEarly: false,
  voiceMode: false, confidenceMode: false, resumeText: null,
  isRecording: false, recognition: null,
};

// ── Routing ───────────────────────────────────────
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}
function showAuth(mode) { showPage("pg-auth"); toggleAuth(mode); }
function toggleAuth(mode) {
  document.getElementById("auth-login").style.display  = mode === "login"  ? "block" : "none";
  document.getElementById("auth-signup").style.display = mode === "signup" ? "block" : "none";
  clearAuthErrors();
}
function clearAuthErrors() {
  ["login-error","signup-error"].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = ""; 
  });
}
function showError(id, msg) {
  document.getElementById(id).textContent = msg;
}

// ── Auth ──────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-password").value;
  if (!email || !pass) { showError("login-error","Please fill in all fields."); return; }
  const btn = document.getElementById("login-btn");
  btn.textContent = "Logging in…"; btn.disabled = true;
  const res = await DB.login(email, pass);
  if (!res.ok) { showError("login-error", res.msg); btn.textContent = "Log In"; btn.disabled = false; return; }
  S.user = res.user;
  await loadDashboard();
  showPage("pg-dashboard");
}

async function doSignup() {
  const name  = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const pass  = document.getElementById("signup-password").value;
  if (!name||!email||!pass) { showError("signup-error","Please fill in all fields."); return; }
  if (pass.length < 6)      { showError("signup-error","Password must be at least 6 characters."); return; }
  if (!email.includes("@")) { showError("signup-error","Please enter a valid email."); return; }
  const btn = document.getElementById("signup-btn");
  btn.textContent = "Creating…"; btn.disabled = true;
  const res = await DB.register(name, email, pass);
  if (!res.ok) { showError("signup-error", res.msg); btn.textContent = "Create Account"; btn.disabled = false; return; }
  S.user = res.user;
  await loadDashboard();
  showPage("pg-dashboard");
}

async function doLogout() {
  await DB.logout();
  S.user = null;
  showPage("pg-landing");
}

// ── Dashboard ─────────────────────────────────────
async function loadDashboard() {
  if (!S.user) return;
  document.getElementById("dash-username").textContent = S.user.name;
  document.getElementById("dash-greeting").textContent = "Welcome back, " + S.user.name.split(" ")[0] + "!";

  const history = await DB.getHistory(S.user.id);
  document.getElementById("stat-total").textContent = history.length;

  const scored = history.filter(h => h.score !== undefined && h.score !== null);
  if (scored.length > 0) {
    document.getElementById("stat-avg").textContent  = Math.round(scored.reduce((a,b) => a + b.score, 0) / scored.length);
    document.getElementById("stat-best").textContent = Math.max(...scored.map(h => h.score));
  } else {
    document.getElementById("stat-avg").textContent  = "—";
    document.getElementById("stat-best").textContent = "—";
  }

  const week = Date.now() - 7 * 86400000;
  document.getElementById("stat-streak").textContent = history.filter(h => h.date > week).length;

  renderHistoryList(history);
}

function renderHistoryList(history) {
  const list = document.getElementById("history-list");
  if (history.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg>
        <p>No interviews yet. Start your first one!</p>
        <button class="btn-solid" onclick="showPage('pg-setup')">Start Interview →</button>
      </div>`;
    return;
  }

  const typeLabels = { coding:"Coding / DSA", system:"System Design", behavioral:"Behavioral" };
  list.innerHTML = "";
  history.slice(0, 10).forEach(h => {
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
    const diffBadge = h.difficulty === "Easy" ? "badge-green" : h.difficulty === "Medium" ? "badge-amber" : "badge-red";

    // Score display
    let scoreHtml;
    if (h.score !== undefined && h.score !== null) {
      const cls = h.score >= 75 ? "high" : h.score >= 50 ? "mid" : "low";
      scoreHtml = `<div class="hist-score ${cls}">${h.score}<span style="font-size:12px;font-weight:400;color:var(--text3)">/100</span></div>`;
    } else {
      scoreHtml = `<div class="hist-score incomplete">Incomplete</div>`;
    }

    const item = document.createElement("div");
    item.className = "hist-item";
    item.innerHTML = `
      <div class="hist-left">
        <div class="hist-meta">
          <span class="badge badge-gray">${escHtml(typeLabels[h.type]||h.type)}</span>
          <span class="badge ${diffBadge}">${escHtml(h.difficulty)}</span>
          <span class="badge badge-purple">${escHtml(h.lang)}</span>
          ${h.company && h.company !== "General" ? `<span class="badge badge-blue">${escHtml(h.company)}</span>` : ""}
          ${h.exitedEarly ? `<span class="badge badge-red">Exited Early</span>` : ""}
        </div>
        <div class="hist-date">${dateStr} · ${h.questionCount} questions</div>
      </div>
      <div>${scoreHtml}</div>`;
    list.appendChild(item);
  });
}

// ── Resume ────────────────────────────────────────
async function handleResumeUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const resumeTextEl = document.getElementById("resume-text");
  resumeTextEl.textContent = "Processing…";
  try {
    // Only use txt files - PDF gives garbage characters
    const text = await file.text();
    // Filter only clean readable characters
    S.resumeText = text.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim().substring(0, 2000);
    if (S.resumeText.length < 50) {
      resumeTextEl.textContent = "❌ Could not read file. Please save resume as .txt and upload again.";
      S.resumeText = null;
      return;
    }
    resumeTextEl.textContent = "✅ " + file.name + " — Ready!";
    document.getElementById("resume-area").style.borderColor = "var(--green)";
    document.getElementById("clear-resume-btn").style.display = "inline-block";
  } catch(e) {
    resumeTextEl.textContent = "❌ Error. Please upload a .txt file.";
    S.resumeText = null;
  }
}

function clearResume() {
  S.resumeText = null;
  document.getElementById("resume-text").textContent = "Click to upload your resume (PDF or TXT)";
  document.getElementById("resume-area").style.borderColor = "";
  document.getElementById("resume-input").value = "";
  document.getElementById("clear-resume-btn").style.display = "none";
}

// ── Chips init ────────────────────────────────────
function initChips(groupId, stateKey) {
  const g = document.getElementById(groupId);
  if (!g) return;
  g.querySelectorAll(".chip").forEach(c => {
    c.addEventListener("click", () => {
      g.querySelectorAll(".chip").forEach(x => x.classList.remove("selected"));
      c.classList.add("selected");
      S[stateKey] = c.dataset.val;
    });
  });
}
function initDiffBtns() {
  document.querySelectorAll(".diff-btn").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".diff-btn").forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
      S.difficulty = b.dataset.val;
    });
  });
}

// ── Begin interview ───────────────────────────────
async function beginInterview() {
  S.lang = document.getElementById("lang-select").value;
  S.currentQ = 0; S.questions = []; S.chatHistory = [];
  S.isWaiting = false; S.done = false; S.fsWarned = false;
  S.exitedEarly = false; S.timerSeconds = 0;

  // Set header badges
  const typeMap = { coding:"Coding/DSA", system:"System Design", behavioral:"Behavioral/HR" };
  document.getElementById("iv-type-badge").textContent = typeMap[S.type] || S.type;
  document.getElementById("iv-lang-badge").textContent = S.lang;

  const compBadge = document.getElementById("iv-company-badge");
  if (S.company && S.company !== "General") {
    compBadge.textContent = S.company; compBadge.style.display = "inline-flex";
  } else compBadge.style.display = "none";

  const diffEl = document.getElementById("iv-diff-badge");
  diffEl.textContent = S.difficulty;
  diffEl.className = "iv-badge " + (S.difficulty==="Easy"?"green":S.difficulty==="Medium"?"amber":"red");

  updateProgress();
  document.getElementById("iv-chat").innerHTML = "";

  // Voice
  if (S.voiceMode) {
    document.getElementById("iv-voice-btn").style.display = "flex";
    setupSpeechRecognition();
  } else {
    document.getElementById("iv-voice-btn").style.display = "none";
  }

  // Confidence tracker
  const confPill = document.getElementById("confidence-pill");
  if (S.confidenceMode && confPill) {
    confPill.style.display = "flex";
    setupWebcam();
  } else if (confPill) {
    confPill.style.display = "none";
  }

  showPage("pg-interview");
  enterFullscreen();
  startTimer();
  setWaiting(true);
  showTyping();

  if (S.resumeText) callFirstQuestionWithResume();
  else callFirstQuestion();
}

// ── Voice ─────────────────────────────────────────
function setupSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { S.voiceMode = false; document.getElementById("iv-voice-btn").style.display="none"; return; }
  S.recognition = new SR();
  S.recognition.continuous = true; S.recognition.interimResults = true;
  let final = "";
  S.recognition.onresult = e => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      else interim += e.results[i][0].transcript;
    }
    const ta = document.getElementById("iv-textarea");
    ta.value = final + interim; autoResize(ta);
  };
  S.recognition.onerror = () => stopVoice();
  S.recognition.onend = () => { if (S.isRecording) try { S.recognition.start(); } catch(e){} };
}
// ── Webcam Confidence ────────────────────────────
let _webcamStream = null;
let _confInterval = null;
async function setupWebcam() {
  try {
    _webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const v = document.getElementById("webcam-video");
    if (v) v.srcObject = _webcamStream;
    _confInterval = setInterval(updateConfidence, 3000);
  } catch(e) {
    S.confidenceMode = false;
    const p = document.getElementById("confidence-pill");
    if (p) p.style.display = "none";
  }
}
function stopWebcam() {
  if (_webcamStream) { _webcamStream.getTracks().forEach(t => t.stop()); _webcamStream = null; }
  if (_confInterval) { clearInterval(_confInterval); _confInterval = null; }
}
function updateConfidence() {
  const ta = document.getElementById("iv-textarea");
  let c = 0.5;
  if (ta && ta.value.length > 80) c += 0.2;
  else if (ta && ta.value.length > 30) c += 0.1;
  if (S.currentQ <= 1) c -= 0.1;
  c += (Math.random() - 0.5) * 0.15;
  c = Math.max(0.1, Math.min(1.0, c));
  const emoji = c > 0.65 ? "😊" : c > 0.4 ? "😐" : "😰";
  const label = c > 0.65 ? "Confident" : c > 0.4 ? "Neutral" : "Stressed";
  const el = document.getElementById("confidence-emoji");
  const lb = document.getElementById("confidence-label");
  if (el) el.textContent = emoji;
  if (lb) lb.textContent = label;
}

function toggleVoice() { S.isRecording ? stopVoice() : startVoice(); }
function startVoice() {
  if (!S.recognition) return;
  S.isRecording = true;
  document.getElementById("iv-voice-btn").classList.add("recording");
  document.getElementById("voice-status").style.display = "flex";
  document.getElementById("iv-textarea").value = "";
  try { S.recognition.start(); } catch(e){}
}
function stopVoice() {
  S.isRecording = false;
  if (S.recognition) try { S.recognition.stop(); } catch(e){}
  document.getElementById("iv-voice-btn").classList.remove("recording");
  document.getElementById("voice-status").style.display = "none";
}

// ── Backend API call ─────────────────────────────
// Calls our backend server instead of Groq directly (keeps API key secret)
async function callGroq(system, messages) {
  const isEval = system.includes("overallScore");
  const res = await fetch(CONFIG.BACKEND_URL + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens: isEval ? 2000 : 600 })
  });
  if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.error || "API error " + res.status); }
  return (await res.json()).reply;
}

function buildSystem() {
  const typeLabel = { coding:"Coding/DSA", system:"System Design", behavioral:"Behavioral/HR" }[S.type] || S.type;
  const co = S.company !== "General" ? ` Style: ${S.company} interview.` : "";
  const re = S.resumeText ? ` Candidate background: ${S.resumeText.substring(0, 800)}.` : "";
  return `You are a technical interviewer conducting a ${typeLabel} interview. Language: ${S.lang}. Difficulty: ${S.difficulty}. Total questions: ${S.questionCount}.${co}${re}

YOU MUST FOLLOW THESE RULES OR THE INTERVIEW WILL BREAK:
1. Ask ONLY ONE question per message. Stop after one question. Wait for the candidate to answer.
2. Do NOT ask multiple questions in one message. Do NOT list questions. Do NOT number questions.
3. Plain conversational English only. No code, no markdown, no backticks.
4. After the candidate answers, say ONE short sentence acknowledging, then ask the NEXT single question.
5. Only after ALL ${S.questionCount} questions have been answered one by one, write exactly: INTERVIEW_COMPLETE
6. Never skip ahead. Never combine questions. One question, wait, next question.`;
}

function buildEvaluator() {
  const typeLabel = { coding:"Coding/DSA", system:"System Design", behavioral:"Behavioral/HR" }[S.type] || S.type;
  return `You are evaluating a ${typeLabel} interview. Language: ${S.lang}. Difficulty: ${S.difficulty}.

RULES:
- Reply with ONLY a valid JSON object. No markdown, no backticks, no explanation.
- Start with { and end with }
- Skipped/unanswered questions = status "skipped", contribute 0 to score
- If all questions skipped, overallScore = 0, scoreLabel = "Incomplete"
- scoreLabel options: "Incomplete" (0), "Needs Practice" (1-40), "Getting Started" (41-60), "Good" (61-80), "Excellent" (81-100)
- Be encouraging. Never say "failed" or "wrong".

JSON format:
{"overallScore":75,"scoreLabel":"Good","scoreSummary":"Brief summary.","correct":3,"partial":1,"missed":1,"strengths":["s1","s2"],"improvements":["i1","i2"],"overallFeedback":"2-3 sentences.","questions":[{"question":"Q text","status":"correct","feedback":"Feedback."}]}`;
}

async function callFirstQuestion() {
  try {
    const reply = await callGroq(buildSystem(), [{ role:"user", content:"Please begin the interview. Ask me the FIRST question only. Just one question." }]);
    S.chatHistory = [
      { role:"user", content:"Please begin. Ask me the first question." },
      { role:"assistant", content: reply }
    ];
    S.currentQ = 1;
    S.questions.push({ question: reply, userAnswer: "" });
    updateProgress(); removeTyping(); appendBot(reply, S.currentQ); setWaiting(false);
  } catch(e) {
    removeTyping();
    appendBot("Could not connect. Error: " + e.message + "\n\nCheck your Groq API key in config.js.");
    setWaiting(false);
  }
}

async function callFirstQuestionWithResume() {
  try {
    const prompt = `Begin the interview. Ask me the first question only. Candidate background (use to tailor ONE question): ${S.resumeText.substring(0,400)}`;
    const reply = await callGroq(buildSystem(), [{ role:"user", content: prompt }]);
    S.chatHistory = [{ role:"user", content: prompt }, { role:"assistant", content: reply }];
    S.currentQ = 1;
    S.questions.push({ question: reply, userAnswer: "" });
    updateProgress(); removeTyping();
    appendBot(reply, S.currentQ); setWaiting(false);
  } catch(e) {
    removeTyping(); appendBot("Error: " + e.message); setWaiting(false);
  }
}

async function sendAnswer() {
  if (S.isWaiting || S.done) return;
  const ta = document.getElementById("iv-textarea");
  const ans = ta.value.trim();
  if (!ans) return;
  if (S.isRecording) stopVoice();
  ta.value = ""; autoResize(ta);
  appendUser(ans);
  if (S.questions[S.currentQ - 1]) S.questions[S.currentQ - 1].userAnswer = ans;
  S.chatHistory.push({ role:"user", content: ans });
  setWaiting(true); showTyping();
  try {
    const reply = await callGroq(buildSystem(), S.chatHistory);
    S.chatHistory.push({ role:"assistant", content: reply });
    removeTyping();
    if (reply.includes("INTERVIEW_COMPLETE")) {
      S.done = true;
      const clean = reply.replace("INTERVIEW_COMPLETE","").trim();
      if (clean) appendBot(clean);
      appendBot("Great work! Analyzing your performance now…");
      setWaiting(false); stopTimer();
      setTimeout(analyzeResults, 800); return;
    }
    S.currentQ++;
    if (S.currentQ > S.questionCount) {
      S.done = true; appendBot(reply);
      appendBot("All done! Analyzing now…");
      setWaiting(false); stopTimer();
      setTimeout(analyzeResults, 800); return;
    }
    updateProgress();
    S.questions.push({ question: reply, userAnswer: "" });
    appendBot(reply, S.currentQ); setWaiting(false);
  } catch(e) {
    removeTyping(); appendBot("Network error: " + e.message); setWaiting(false);
  }
}

// ── End + Analyze ─────────────────────────────────
function askEndInterview() { document.getElementById("modal-end").style.display = "flex"; }
function forceEndInterview() {
  closeModal("modal-end"); closeModal("modal-fs");
  S.done = true; S.exitedEarly = true;
  stopTimer(); stopWebcam(); exitFullscreen();
  if (S.isRecording) stopVoice();
  document.getElementById("modal-analyzing").style.display = "flex";
  setTimeout(analyzeResults, 400);
}

async function analyzeResults() {
  document.getElementById("modal-analyzing").style.display = "flex";
  exitFullscreen();

  const qa = S.questions
    .map((q, i) => {
      const qShort = q.question.substring(0, 200);
      const aShort = (q.userAnswer || "(not attempted)").substring(0, 300);
      return `Q${i+1}: ${qShort}\nAnswer: ${aShort}`;
    })
    .join("\n\n");

  const exitNote = S.exitedEarly
    ? "The candidate exited early. Questions without answers are skipped, not failed."
    : "";

  const prompt = `${qa}\n\n${exitNote}\n\nEvaluate and return JSON.`;

  try {
    const raw = await callGroq(buildEvaluator(), [{ role:"user", content: prompt }]);
    const match = raw.match(/\{[\s\S]*\}/);
    const result = JSON.parse(match ? match[0] : raw);

    if (S.user) {
      await DB.saveInterview(S.user.id, {
        type: S.type, lang: S.lang, difficulty: S.difficulty,
        questionCount: S.questionCount,
        score: result.overallScore || null,
        label: result.scoreLabel,
        company: S.company,
        exitedEarly: S.exitedEarly,
      });
    }
    document.getElementById("modal-analyzing").style.display = "none";
    renderResults(result);
    showPage("pg-results");
  } catch(e) {
    document.getElementById("modal-analyzing").style.display = "none";
    showPage("pg-results");
    document.getElementById("res-label").textContent = "Analysis failed";
    document.getElementById("res-summary").textContent = "Error: " + e.message;
  }
}

// ── Render Results ────────────────────────────────
function renderResults(r) {
  const score = Math.min(100, Math.max(0, r.overallScore || 0));
  document.getElementById("res-score").textContent = score;
  document.getElementById("res-label").textContent = r.scoreLabel || "Complete";
  document.getElementById("res-summary").textContent = r.scoreSummary || "";

  const ring = document.getElementById("ring-progress");
  setTimeout(() => { ring.style.strokeDashoffset = 364.42 - (score / 100) * 364.42; }, 100);
  ring.style.stroke = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";

  document.getElementById("res-correct").textContent = r.correct ?? 0;
  document.getElementById("res-partial").textContent = r.partial ?? 0;
  document.getElementById("res-missed").textContent  = r.missed ?? 0;

  const bd = document.getElementById("res-breakdown");
  bd.innerHTML = "";
  (r.questions || []).forEach((q, i) => {
    const labels = { correct:"Correct", partial:"Partial", missed:"Needs Work", skipped:"Skipped" };
    const el = document.createElement("div"); el.className = "q-item";
    el.innerHTML = `
      <div class="q-item-head">
        <span class="q-num">Question ${i+1}</span>
        <span class="q-status ${q.status === 'skipped' ? 'skipped' : q.status}">${labels[q.status] || q.status}</span>
      </div>
      <div class="q-question">${escHtml(q.question)}</div>
      <div class="q-feedback">${escHtml(q.feedback)}</div>`;
    bd.appendChild(el);
  });

  const sl = document.getElementById("res-strengths"); sl.innerHTML = "";
  (r.strengths || []).forEach(s => { const t = document.createElement("span"); t.className = "tag"; t.textContent = s; sl.appendChild(t); });

  const il = document.getElementById("res-improve"); il.innerHTML = "";
  (r.improvements || []).forEach(imp => {
    const el = document.createElement("div"); el.className = "improve-item";
    el.innerHTML = `<div class="improve-dot"></div><div class="improve-text">${escHtml(imp)}</div>`;
    il.appendChild(el);
  });

  document.getElementById("res-feedback").textContent = r.overallFeedback || "";
}

function retryInterview() { showPage("pg-setup"); }

// ── Fullscreen ────────────────────────────────────
function enterFullscreen() {
  const el = document.documentElement;
  try {
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
    if (req) req.call(el).catch(() => {});
  } catch(e) {}
}
function exitFullscreen() {
  try {
    const ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
    if (ex) ex.call(document).catch(() => {});
  } catch(e) {}
}
function reenterFullscreen() { closeModal("modal-fs"); S.fsWarned = false; enterFullscreen(); }
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
}
["fullscreenchange","webkitfullscreenchange","mozfullscreenchange"].forEach(ev => {
  document.addEventListener(ev, () => {
    if (!document.getElementById("pg-interview").classList.contains("active")) return;
    if (!isFullscreen() && !S.done && !S.fsWarned) {
      S.fsWarned = true;
      document.getElementById("modal-fs").style.display = "flex";
    }
  });
});

// ── Timer ─────────────────────────────────────────
function startTimer() {
  if (S.timerInterval) clearInterval(S.timerInterval);
  S.timerSeconds = 0;
  S.timerInterval = setInterval(() => {
    S.timerSeconds++;
    const m = String(Math.floor(S.timerSeconds / 60)).padStart(2, "0");
    const s = String(S.timerSeconds % 60).padStart(2, "0");
    document.getElementById("iv-timer").textContent = m + ":" + s;
  }, 1000);
}
function stopTimer() { if (S.timerInterval) clearInterval(S.timerInterval); S.timerInterval = null; }

// ── UI Helpers ────────────────────────────────────
function appendBot(text, qNum) {
  const chat = document.getElementById("iv-chat");
  const wrap = document.createElement("div"); wrap.className = "msg bot";
  const label = qNum ? `<div class="q-label">QUESTION ${qNum} OF ${S.questionCount}</div>` : "";
  // Strip any markdown
  const clean = text
    .replace(/```[a-zA-Z0-9]*/g, "")
    .replace(/```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
  wrap.innerHTML = `<div class="av ai">AI</div><div>${label}<div class="bubble">${escHtml(clean)}</div></div>`;
  chat.appendChild(wrap); scrollChat();
}
function appendUser(text) {
  const chat = document.getElementById("iv-chat");
  const wrap = document.createElement("div"); wrap.className = "msg user";
  wrap.innerHTML = `<div class="av you">You</div><div class="bubble">${escHtml(text)}</div>`;
  chat.appendChild(wrap); scrollChat();
}
function showTyping() {
  const chat = document.getElementById("iv-chat");
  const wrap = document.createElement("div"); wrap.className = "msg bot"; wrap.id = "typing-ind";
  wrap.innerHTML = `<div class="av ai">AI</div><div class="typing-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  chat.appendChild(wrap); scrollChat();
}
function removeTyping() { const el = document.getElementById("typing-ind"); if (el) el.remove(); }
function setWaiting(val) {
  S.isWaiting = val;
  document.getElementById("iv-textarea").disabled = val;
  document.getElementById("iv-send-btn").disabled = val;
  const vb = document.getElementById("iv-voice-btn"); if (vb) vb.disabled = val;
}
function updateProgress() {
  const pct = S.questionCount > 0 ? Math.round((S.currentQ / S.questionCount) * 100) : 0;
  document.getElementById("iv-progress-fill").style.width = pct + "%";
  document.getElementById("iv-progress-label").textContent = "Q " + S.currentQ + " / " + S.questionCount;
}
function scrollChat() { const c = document.getElementById("iv-chat"); c.scrollTop = c.scrollHeight; }
function autoResize(el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 140) + "px"; }
function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/\n/g, "<br>");
}
function closeModal(id) { document.getElementById(id).style.display = "none"; }

// ── Init ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Show landing immediately
  showPage("pg-landing");

  // Init Firebase using config.js values
  initFirebase();

  // Check if already logged in
  DB.onAuthChange(async (user) => {
    if (user) {
      S.user = user;
      await loadDashboard();
      showPage("pg-dashboard");
    }
  });

  initChips("type-chips", "type");
  initChips("count-chips", "questionCount");
  initChips("company-chips", "company");
  initDiffBtns();

  const langSel = document.getElementById("lang-select");
  if (langSel) langSel.addEventListener("change", () => { S.lang = langSel.value; });

  const ta = document.getElementById("iv-textarea");
  if (ta) {
    ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } });
    ta.addEventListener("input", () => autoResize(ta));
  }

  document.getElementById("login-password").addEventListener("keydown",  e => { if (e.key === "Enter") doLogin(); });
  document.getElementById("signup-password").addEventListener("keydown", e => { if (e.key === "Enter") doSignup(); });

  ["modal-end","modal-fs"].forEach(id => {
    document.getElementById(id).addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(id); });
  });
});