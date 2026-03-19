// ── PrepSphere DB (localStorage) ──────────────────
const DB = {
  getUsers() {
    try { return JSON.parse(localStorage.getItem("ps_users") || "{}"); } catch(e) { return {}; }
  },
  saveUsers(u) {
    localStorage.setItem("ps_users", JSON.stringify(u));
  },
  register(name, email, password) {
    const users = this.getUsers();
    if (users[email]) return { ok: false, msg: "This email is already registered." };
    const id = "u_" + Date.now();
    users[email] = { id, name, email, password: btoa(unescape(encodeURIComponent(password))), createdAt: Date.now() };
    this.saveUsers(users);
    return { ok: true, user: { id, name, email, createdAt: users[email].createdAt } };
  },
  login(email, password) {
    const users = this.getUsers();
    const u = users[email];
    if (!u) return { ok: false, msg: "No account found with this email." };
    if (u.password !== btoa(unescape(encodeURIComponent(password)))) return { ok: false, msg: "Incorrect password." };
    return { ok: true, user: { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt } };
  },
  setSession(user) {
    localStorage.setItem("ps_session", JSON.stringify(user));
  },
  getSession() {
    try { return JSON.parse(localStorage.getItem("ps_session") || "null"); } catch(e) { return null; }
  },
  clearSession() {
    localStorage.removeItem("ps_session");
  },
  saveInterview(userId, data) {
    const key = "ps_hist_" + userId;
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(key) || "[]"); } catch(e) {}
    hist.unshift({ id: "i_" + Date.now(), date: Date.now(), ...data });
    localStorage.setItem(key, JSON.stringify(hist));
  },
  getHistory(userId) {
    try { return JSON.parse(localStorage.getItem("ps_hist_" + userId) || "[]"); } catch(e) { return []; }
  },
};
