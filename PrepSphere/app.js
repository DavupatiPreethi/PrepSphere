// ══════════════════════════════════════════════════
//  PrepSphere — app.js
// ══════════════════════════════════════════════════

const S = {
  user: null,
  type: "coding",
  lang: "Python",
  difficulty: "Medium",
  questionCount: 5,
  currentQ: 0,
  questions: [],
  chatHistory: [],
  isWaiting: false,
  done: false,
  exitedEarly: false,
  timerInterval: null,
  timerSeconds: 0,
  fsWarned: false,
};

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

function showAuth(mode) { showPage("pg-auth"); toggleAuth(mode); }

function toggleAuth(mode) {
  document.getElementById("auth-login").style.display = mode === "login" ? "block" : "none";
  document.getElementById("auth-signup").style.display = mode === "signup" ? "block" : "none";
  clearAuthErrors();
}

function clearAuthErrors() {
  ["login-error", "signup-error"].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = "";
    el.classList.remove("show");
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add("show");
}

function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;
  if (!email || !pass) { showError("login-error", "Please fill in all fields."); return; }
  const res = DB.login(email, pass);
  if (!res.ok) { showError("login-error", res.msg); return; }
  S.user = res.user;
  DB.setSession(res.user);
  loadDashboard();
  showPage("pg-dashboard");
}

function doSignup() {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const pass = document.getElementById("signup-password").value;
  if (!name || !email || !pass) { showError("signup-error", "Please fill in all fields."); return; }
  if (pass.length < 6) { showError("signup-error", "Password must be at least 6 characters."); return; }
  if (!email.includes("@")) { showError("signup-error", "Please enter a valid email."); return; }
  const res = DB.register(name, email, pass);
  if (!res.ok) { showError("signup-error", res.msg); return; }
  S.user = res.user;
  DB.setSession(res.user);
  loadDashboard();
  showPage("pg-dashboard");
}

function doLogout() {
  S.user = null;
  DB.clearSession();
  showPage("pg-landing");
}

function loadDashboard() {
  if (!S.user) return;
  document.getElementById("dash-username").textContent = S.user.name;
  document.getElementById("dash-greeting").textContent = "Welcome back, " + S.user.name.split(" ")[0] + "!";
  const history = DB.getHistory(S.user.id);
  document.getElementById("stat-total").textContent = history.length;
  if (history.length > 0) {
    const scores = history.filter(h => h.score !== undefined && h.score !== null && !h.incomplete).map(h => h.score);
    if (scores.length > 0) {
      document.getElementById("stat-avg").textContent = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      document.getElementById("stat-best").textContent = Math.max(...scores);
    }
    const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
    document.getElementById("stat-streak").textContent = history.filter(h => h.date > week).length;
    const list = document.getElementById("history-list");
    list.innerHTML = "";
    history.slice(0, 10).forEach(h => {
      const d = new Date(h.date);
      const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const typeLabels = { coding: "Coding / DSA", system: "System Design", behavioral: "Behavioral" };
      const scoreDisplay = h.incomplete ? "Incomplete" : (h.score !== undefined ? h.score : "—");
      const scoreClass = h.incomplete ? "low" : h.score >= 75 ? "high" : h.score >= 50 ? "mid" : "low";
      const diffBadge = h.difficulty === "Easy" ? "badge-green" : h.difficulty === "Medium" ? "badge-amber" : "badge-red";
      const item = document.createElement("div");
      item.className = "hist-item";
      item.innerHTML = `
        <div class="hist-left">
          <div class="hist-meta">
            <span class="badge badge-gray">${escHtml(typeLabels[h.type] || h.type)}</span>
            <span class="badge ${diffBadge}">${escHtml(h.difficulty)}</span>
            <span class="badge badge-purple">${escHtml(h.lang)}</span>
            ${h.incomplete ? '<span class="badge badge-gray">Exited Early</span>' : ''}
          </div>
          <div class="hist-date">${dateStr} &nbsp;·&nbsp; ${h.questionCount} questions</div>
        </div>
        <div class="hist-right">
          <div class="hist-score ${scoreClass}">${scoreDisplay}${h.incomplete ? '' : '<span style="font-size:13px;font-weight:400;color:var(--text3)">/100</span>'}</div>
        </div>`;
      list.appendChild(item);
    });
  } else {
    document.getElementById("stat-avg").textContent = "—";
    document.getElementById("stat-best").textContent = "—";
    document.getElementById("stat-streak").textContent = "0";
    document.getElementById("history-list").innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg>
        <p>No interviews yet. Start your first one!</p>
        <button class="btn-solid" onclick="showPage('pg-setup')">Start Interview →</button>
      </div>`;
  }
}

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

function beginInterview() {
  if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE") {
    alert("Please open config.js and paste your Groq API key first.");
    return;
  }
  S.lang = document.getElementById("lang-select").value;
  S.currentQ = 0; S.questions = []; S.chatHistory = [];
  S.isWaiting = false; S.done = false; S.exitedEarly = false;
  S.fsWarned = false; S.timerSeconds = 0;
  const typeMap = { coding: "Coding / DSA", system: "System Design", behavioral: "Behavioral / HR" };
  document.getElementById("iv-type-badge").textContent = typeMap[S.type] || S.type;
  document.getElementById("iv-type-badge").className = "badge badge-blue";
  document.getElementById("iv-lang-badge").textContent = S.lang;
  document.getElementById("iv-lang-badge").className = "badge badge-purple";
  const diffEl = document.getElementById("iv-diff-badge");
  diffEl.textContent = S.difficulty;
  diffEl.className = "badge " + (S.difficulty === "Easy" ? "badge-green" : S.difficulty === "Medium" ? "badge-amber" : "badge-red");
  updateProgress();
  document.getElementById("iv-chat").innerHTML = "";
  showPage("pg-interview");
  enterFullscreen();
  startTimer();
  setWaiting(true);
  showTyping();
  callFirstQuestion();
}

function enterFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
}

function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
}

function reenterFullscreen() { closeModal("modal-fs"); S.fsWarned = false; enterFullscreen(); }

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
}

document.addEventListener("fullscreenchange", handleFsChange);
document.addEventListener("webkitfullscreenchange", handleFsChange);
document.addEventListener("mozfullscreenchange", handleFsChange);

function handleFsChange() {
  if (!document.getElementById("pg-interview").classList.contains("active")) return;
  if (!isFullscreen() && !S.done && !S.fsWarned) {
    S.fsWarned = true;
    document.getElementById("modal-fs").style.display = "flex";
  }
}

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

async function callClaude(system, messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + CONFIG.GROQ_API_KEY },
    body: JSON.stringify({ model: CONFIG.MODEL, max_tokens: 1024, messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error?.message || "API error " + res.status); }
  const data = await res.json();
  return data.choices[0].message.content;
}

function buildInterviewerSystem() {
  const typeLabel = { coding: "Coding / DSA", system: "System Design", behavioral: "Behavioral / HR" }[S.type] || S.type;
  return `You are a senior technical interviewer conducting a ${typeLabel} interview.
Language: ${S.lang}. Difficulty: ${S.difficulty}. Total questions: ${S.questionCount}.
- Ask ONE question at a time.
- After each answer, acknowledge briefly then ask the next question.
- After ALL ${S.questionCount} questions are answered, end with exactly: INTERVIEW_COMPLETE
- Be professional, encouraging, concise. Never evaluate during the interview.`;
}

function buildEvaluatorSystem() {
  const typeLabel = { coding: "Coding / DSA", system: "System Design", behavioral: "Behavioral / HR" }[S.type] || S.type;
  return `You are evaluating a ${typeLabel} interview. Language: ${S.lang}. Difficulty: ${S.difficulty}.
CRITICAL: Reply with ONLY a JSON object. No markdown, no backticks, no extra text. Start with { end with }.
Format: {"overallScore":80,"scoreLabel":"Good","scoreSummary":"One sentence.","correct":3,"partial":1,"missed":1,"strengths":["s1","s2"],"improvements":["i1","i2"],"overallFeedback":"2-3 sentences.","questions":[{"question":"q","status":"correct","feedback":"f"}]}
RULES: skipped/unanswered questions → status "skipped", encouraging feedback only. If ALL skipped → overallScore:0, scoreLabel:"Incomplete". Never say "failed","wrong","bad". Always motivating.`;
}

async function callFirstQuestion() {
  try {
    const reply = await callClaude(buildInterviewerSystem(), [{ role: "user", content: "Begin the interview. Ask the first question." }]);
    S.chatHistory = [{ role: "user", content: "Begin the interview. Ask the first question." }, { role: "assistant", content: reply }];
    S.currentQ = 1;
    S.questions.push({ question: reply, userAnswer: "" });
    updateProgress(); removeTyping(); appendBot(reply, S.currentQ); setWaiting(false);
  } catch (e) {
    removeTyping();
    appendBot("⚠ Could not connect to Groq API.\n\nError: " + e.message + "\n\nCheck your API key in config.js.");
    setWaiting(false);
  }
}

async function sendAnswer() {
  if (S.isWaiting || S.done) return;
  const ta = document.getElementById("iv-textarea");
  const ans = ta.value.trim();
  if (!ans) return;
  ta.value = ""; autoResize(ta);
  appendUser(ans);
  if (S.questions[S.currentQ - 1]) S.questions[S.currentQ - 1].userAnswer = ans;
  S.chatHistory.push({ role: "user", content: ans });
  setWaiting(true); showTyping();
  try {
    const reply = await callClaude(buildInterviewerSystem(), S.chatHistory);
    S.chatHistory.push({ role: "assistant", content: reply });
    removeTyping();
    if (reply.includes("INTERVIEW_COMPLETE")) {
      S.done = true;
      const clean = reply.replace("INTERVIEW_COMPLETE", "").trim();
      if (clean) appendBot(clean);
      appendBot("That wraps up the interview! Analyzing your performance now…");
      setWaiting(false); stopTimer(); setTimeout(analyzeResults, 800); return;
    }
    S.currentQ++;
    if (S.currentQ > S.questionCount) {
      S.done = true; appendBot(reply);
      appendBot("All questions complete! Analyzing now…");
      setWaiting(false); stopTimer(); setTimeout(analyzeResults, 800); return;
    }
    updateProgress();
    S.questions.push({ question: reply, userAnswer: "" });
    appendBot(reply, S.currentQ); setWaiting(false);
  } catch (e) {
    removeTyping();
    appendBot("⚠ Network error: " + e.message);
    setWaiting(false);
  }
}

function askEndInterview() { document.getElementById("modal-end").style.display = "flex"; }

function forceEndInterview() {
  closeModal("modal-end"); closeModal("modal-fs");
  S.done = true; S.exitedEarly = true;
  stopTimer(); exitFullscreen();
  document.getElementById("modal-analyzing").style.display = "flex";
  setTimeout(analyzeResults, 400);
}

async function analyzeResults() {
  document.getElementById("modal-analyzing").style.display = "flex";
  exitFullscreen();
  const answeredCount = S.questions.filter(q => q.userAnswer && q.userAnswer.trim() !== "").length;

  // Nobody answered anything — no API call needed
  if (answeredCount === 0) {
    if (S.user) DB.saveInterview(S.user.id, { type: S.type, lang: S.lang, difficulty: S.difficulty, questionCount: S.questionCount, score: 0, label: "Incomplete", incomplete: true });
    document.getElementById("modal-analyzing").style.display = "none";
    renderResults({
      overallScore: 0, scoreLabel: "Incomplete",
      scoreSummary: "The interview was exited before any questions were answered.",
      correct: 0, partial: 0, missed: 0,
      strengths: ["You took the first step by starting — that takes courage!"],
      improvements: ["Try to attempt at least one question next time.", "Review the topic and come back when ready."],
      overallFeedback: "No questions were attempted this session. That's okay — everyone starts somewhere! Review the topic, practice a few concepts, and try again. You've got this! 💪",
      questions: S.questions.map(q => ({ question: q.question, status: "skipped", feedback: "Not attempted — review this topic for next time!" })),
    });
    showPage("pg-results"); return;
  }

  const exitNote = S.exitedEarly ? "Candidate exited early. Unanswered = skipped, not failed. Be encouraging." : "";
  const qa = S.questions.map((q, i) => `Q${i + 1}: ${q.question}\nAnswer: ${q.userAnswer && q.userAnswer.trim() ? q.userAnswer : "(not attempted)"}`).join("\n\n");
  const prompt = `Interview transcript:\n\n${qa}\n\n${exitNote}\n\nEvaluate and return JSON. Unanswered = status "skipped".`;

  try {
    const raw = await callClaude(buildEvaluatorSystem(), [{ role: "user", content: prompt }]);
    let clean = raw.replace(/```json|```/gi, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) clean = jsonMatch[0];
    const result = JSON.parse(clean);
    // Cap score proportionally if exited early
    if (S.exitedEarly) {
      const maxScore = Math.round((answeredCount / S.questionCount) * 100);
      if (result.overallScore > maxScore) result.overallScore = maxScore;
    }
    if (S.user) DB.saveInterview(S.user.id, { type: S.type, lang: S.lang, difficulty: S.difficulty, questionCount: S.questionCount, score: result.overallScore, label: result.scoreLabel, incomplete: S.exitedEarly });
    document.getElementById("modal-analyzing").style.display = "none";
    renderResults(result); showPage("pg-results");
  } catch (e) {
    document.getElementById("modal-analyzing").style.display = "none";
    showPage("pg-results");
    document.getElementById("res-label").textContent = "Analysis failed";
    document.getElementById("res-summary").textContent = "Error: " + e.message;
  }
}

function renderResults(r) {
  const score = Math.min(100, Math.max(0, r.overallScore || 0));
  document.getElementById("res-score").textContent = score;
  document.getElementById("res-label").textContent = r.scoreLabel || "Complete";
  document.getElementById("res-summary").textContent = r.scoreSummary || "";
  const ring = document.getElementById("ring-progress");
  setTimeout(() => { ring.style.strokeDashoffset = 364.42 - (score / 100) * 364.42; }, 100);
  ring.style.stroke = score >= 75 ? "var(--green)" : score >= 50 ? "var(--amber)" : "var(--red)";
  document.getElementById("res-correct").textContent = r.correct ?? 0;
  document.getElementById("res-partial").textContent = r.partial ?? 0;
  document.getElementById("res-missed").textContent = r.missed ?? 0;
  const bd = document.getElementById("res-breakdown");
  bd.innerHTML = "";
  const labels = { correct: "Correct", partial: "Partial", missed: "Needs Work", skipped: "Not Attempted" };
  (r.questions || []).forEach((q, i) => {
    const el = document.createElement("div");
    el.className = "q-item";
    el.innerHTML = `
      <div class="q-item-head">
        <span class="q-num">Question ${i + 1}</span>
        <span class="q-status ${q.status === "skipped" ? "skipped" : q.status}">${labels[q.status] || q.status}</span>
      </div>
      <div class="q-question">${escHtml(q.question)}</div>
      <div class="q-feedback">${escHtml(q.feedback)}</div>`;
    bd.appendChild(el);
  });
  const sl = document.getElementById("res-strengths");
  sl.innerHTML = "";
  (r.strengths || []).forEach(s => { const t = document.createElement("span"); t.className = "tag"; t.textContent = s; sl.appendChild(t); });
  const il = document.getElementById("res-improve");
  il.innerHTML = "";
  (r.improvements || []).forEach(imp => { const el = document.createElement("div"); el.className = "improve-item"; el.innerHTML = `<div class="improve-dot"></div><div class="improve-text">${escHtml(imp)}</div>`; il.appendChild(el); });
  document.getElementById("res-feedback").textContent = r.overallFeedback || "";
}

function retryInterview() { showPage("pg-setup"); }

function appendBot(text, qNum) {
  const chat = document.getElementById("iv-chat");
  const wrap = document.createElement("div");
  wrap.className = "msg bot";
  const label = qNum ? `<div class="q-label">Question ${qNum} of ${S.questionCount}</div>` : "";
  wrap.innerHTML = `<div class="av ai">AI</div><div>${label}<div class="bubble">${escHtml(text)}</div></div>`;
  chat.appendChild(wrap); scrollChat();
}

function appendUser(text) {
  const chat = document.getElementById("iv-chat");
  const wrap = document.createElement("div");
  wrap.className = "msg user";
  wrap.innerHTML = `<div class="av you">You</div><div class="bubble">${escHtml(text)}</div>`;
  chat.appendChild(wrap); scrollChat();
}

function showTyping() {
  const chat = document.getElementById("iv-chat");
  const wrap = document.createElement("div");
  wrap.className = "msg bot"; wrap.id = "typing-ind";
  wrap.innerHTML = `<div class="av ai">AI</div><div class="typing-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  chat.appendChild(wrap); scrollChat();
}

function removeTyping() { const el = document.getElementById("typing-ind"); if (el) el.remove(); }
function setWaiting(val) { S.isWaiting = val; document.getElementById("iv-textarea").disabled = val; document.getElementById("iv-send-btn").disabled = val; }
function updateProgress() { const pct = S.questionCount > 0 ? Math.round((S.currentQ / S.questionCount) * 100) : 0; document.getElementById("iv-progress-fill").style.width = pct + "%"; document.getElementById("iv-progress-label").textContent = "Q " + S.currentQ + " / " + S.questionCount; }
function scrollChat() { const chat = document.getElementById("iv-chat"); chat.scrollTop = chat.scrollHeight; }
function autoResize(el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 140) + "px"; }
function escHtml(str) { return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g, "<br>"); }
function closeModal(id) { document.getElementById(id).style.display = "none"; }

document.addEventListener("DOMContentLoaded", () => {
  const session = DB.getSession();
  if (session) { S.user = session; loadDashboard(); showPage("pg-dashboard"); }
  else showPage("pg-landing");
  initChips("type-chips", "type");
  initChips("count-chips", "questionCount");
  initDiffBtns();
  const langSel = document.getElementById("lang-select");
  if (langSel) langSel.addEventListener("change", () => { S.lang = langSel.value; });
  const ta = document.getElementById("iv-textarea");
  if (ta) {
    ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } });
    ta.addEventListener("input", () => autoResize(ta));
  }
  document.getElementById("login-password").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
  document.getElementById("signup-password").addEventListener("keydown", e => { if (e.key === "Enter") doSignup(); });
  ["modal-end", "modal-fs"].forEach(id => {
    document.getElementById(id).addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(id); });
  });
});