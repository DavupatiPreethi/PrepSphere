// ══════════════════════════════════════════════════
//  PrepSphere v2 — db.js  (Firebase Edition)
//  Real Auth + Firestore database
// ══════════════════════════════════════════════════

let _auth = null;
let _db   = null;

// ── Init Firebase ─────────────────────────────────
function initFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(CONFIG.FIREBASE);
    }
    _auth = firebase.auth();
    _db   = firebase.firestore();
    console.log("✅ Firebase connected");
  } catch(e) {
    console.error("❌ Firebase init failed:", e.message);
  }
}

// ── Auth ──────────────────────────────────────────
const DB = {

  // Register new user
  async register(name, email, password) {
    try {
      const cred = await _auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      // Create user document in Firestore
      await _db.collection("users").doc(cred.user.uid).set({
        name,
        email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { ok: true, user: { id: cred.user.uid, name, email } };
    } catch(e) {
      return { ok: false, msg: firebaseErrorMsg(e.code) };
    }
  },

  // Login
  async login(email, password) {
    try {
      const cred = await _auth.signInWithEmailAndPassword(email, password);
      const name = cred.user.displayName || email.split("@")[0];
      return { ok: true, user: { id: cred.user.uid, name, email } };
    } catch(e) {
      return { ok: false, msg: firebaseErrorMsg(e.code) };
    }
  },

  // Logout
  async logout() {
    await _auth.signOut();
  },

  // Get current logged-in user (from Firebase)
  getCurrentUser() {
    const u = _auth.currentUser;
    if (!u) return null;
    return { id: u.uid, name: u.displayName || u.email, email: u.email };
  },

  // Listen for auth state changes
  onAuthChange(callback) {
    _auth.onAuthStateChanged(user => {
      if (user) {
        callback({ id: user.uid, name: user.displayName || user.email, email: user.email });
      } else {
        callback(null);
      }
    });
  },

  // ── Interview History ─────────────────────────────

  // Save interview to Firestore
  async saveInterview(userId, data) {
    try {
      await _db.collection("interviews").add({
        userId,
        ...data,
        date: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) {
      console.error("Save interview failed:", e);
    }
  },

  // Get interview history for a user
  async getHistory(userId) {
    try {
      const snap = await _db.collection("interviews")
        .where("userId", "==", userId)
        .get();
      const docs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toMillis() || Date.now()
      }));
      // Sort by date descending in JS (avoids Firestore index requirement)
      docs.sort((a, b) => b.date - a.date);
      return docs.slice(0, 50);
    } catch(e) {
      console.error("Get history failed:", e.message);
      return [];
    }
  },

  // Get topic-wise stats
  async getTopicStats(userId) {
    const hist = await this.getHistory(userId);
    const topics = {};
    hist.forEach(h => {
      const t = h.type || "coding";
      if (!topics[t]) topics[t] = { count: 0, totalScore: 0 };
      topics[t].count++;
      if (h.score !== undefined) topics[t].totalScore += h.score;
    });
    return topics;
  },

  // Get last 7 days activity
  async getWeekActivity(userId) {
    const hist = await this.getHistory(userId);
    const days = {};
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days[key] = 0;
    }
    hist.forEach(h => {
      const key = new Date(h.date).toISOString().slice(0, 10);
      if (days[key] !== undefined) days[key]++;
    });
    return days;
  }
};

// ── Firebase error messages ───────────────────────
function firebaseErrorMsg(code) {
  const msgs = {
    "auth/email-already-in-use":    "This email is already registered.",
    "auth/invalid-email":           "Please enter a valid email.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/user-not-found":          "No account found with this email.",
    "auth/wrong-password":          "Incorrect password.",
    "auth/invalid-credential":      "Incorrect email or password.",
    "auth/too-many-requests":       "Too many attempts. Try again later.",
    "auth/network-request-failed":  "Network error. Check your connection.",
  };
  return msgs[code] || "Something went wrong. Please try again.";
}
