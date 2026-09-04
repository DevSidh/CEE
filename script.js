const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const api = window.CEE_API_URL || "http://localhost:3000/api";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char]));
}

async function apiFetch(path, options = {}) {
  return fetch(`${api}${path}`, {
    ...options,
    credentials: "include",
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
  });
}

// Fast visual loading bar: requestAnimationFrame keeps the animation smooth without forcing a 5ms timer.
(function pageLoadProgress() {
  const bar = document.createElement("div");
  bar.id = "pageProgress";
  bar.style.cssText = "position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,#6cb5ff,#1769e0);z-index:10000;transition:width .06s linear,opacity .12s ease;box-shadow:0 0 8px #1769e0aa";
  document.documentElement.appendChild(bar);
  const started = performance.now();
  let done = false;
  const paint = (now) => {
    if (done) return;
    const elapsed = now - started;
    const progress = Math.min(92, 15 + 77 * (1 - Math.exp(-elapsed / 280)));
    bar.style.width = `${progress}%`;
    requestAnimationFrame(paint);
  };
  requestAnimationFrame(paint);
  window.addEventListener("load", () => {
    done = true;
    bar.style.width = "100%";
    setTimeout(() => { bar.style.opacity = "0"; setTimeout(() => bar.remove(), 180); }, 60);
  }, { once: true });
})();

function buildAuthModal() {
  let modal = $("#authModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "authModal";
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-card auth-card">
      <button id="closeModal" class="close" aria-label="Close">×</button>
      <div class="auth-tabs"><button type="button" class="auth-tab active" data-auth-mode="login">Log in</button><button type="button" class="auth-tab" data-auth-mode="register">Create account</button></div>
      <div class="auth-heading"><span class="eyebrow">CEE Saturday</span><h2 id="authTitle">Welcome back.</h2><p id="authSubtitle">Log in to save your tests, progress and profile.</p></div>
      <form id="authForm" class="auth-form">
        <div id="nameField" hidden><label for="authName">Full name</label><input id="authName" autocomplete="name" placeholder="Your name"></div>
        <div id="usernameField" hidden><label for="authUsername">Username</label><input id="authUsername" autocomplete="username" placeholder="siddhant_cee" pattern="[a-zA-Z0-9_]{3,24}"></div>
        <div id="courseField" hidden><label for="authCourse">Course</label><select id="authCourse"><option>MBBS</option><option>BDS</option><option>BSc Nursing</option><option>Other CEE programme</option></select></div>
        <label for="authEmail">Email address</label><input id="authEmail" type="email" autocomplete="email" placeholder="you@example.com" required>
        <label for="authPassword">Password</label><input id="authPassword" type="password" autocomplete="current-password" placeholder="At least 8 characters" minlength="8" required>
        <div id="authError" class="form-error" role="alert" hidden></div>
        <button id="authSubmit" class="btn" type="submit" style="width:100%">Log in</button>
      </form>
      <p class="auth-note">Your password is securely hashed on the server. Never share your password or database credentials.</p>
    </div>`;

  const updateMode = (mode) => {
    const register = mode === "register";
    $$(".auth-tab", modal).forEach((b) => b.classList.toggle("active", b.dataset.authMode === mode));
    $("#authTitle", modal).textContent = register ? "Create your study account." : "Welcome back.";
    $("#authSubtitle", modal).textContent = register ? "Track your CEE practice and edit your profile anytime." : "Log in to save your tests, progress and profile.";
    $("#nameField", modal).hidden = !register;
    $("#usernameField", modal).hidden = !register;
    $("#courseField", modal).hidden = !register;
    $("#authPassword", modal).autocomplete = register ? "new-password" : "current-password";
    $("#authSubmit", modal).textContent = register ? "Create account" : "Log in";
    $("#authForm", modal).dataset.mode = mode;
    $("#authError", modal).hidden = true;
  };

  $$("[data-auth-mode]", modal).forEach((button) => button.addEventListener("click", () => updateMode(button.dataset.authMode)));
  $("#closeModal", modal).addEventListener("click", closeAuthModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeAuthModal(); });
  $("#authForm", modal).addEventListener("submit", submitAuth);
  updateMode("login");
  return modal;
}

function openAuthModal(mode = "login") {
  const modal = buildAuthModal();
  modal.classList.add("show");
  $("[data-auth-mode='" + mode + "']", modal)?.click();
  setTimeout(() => $("#authEmail", modal)?.focus(), 40);
  document.body.classList.add("modal-open");
}
function closeAuthModal() {
  $("#authModal")?.classList.remove("show");
  document.body.classList.remove("modal-open");
}

async function submitAuth(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const mode = form.dataset.mode;
  const error = $("#authError");
  const button = $("#authSubmit");
  error.hidden = true;
  button.disabled = true;
  button.textContent = mode === "register" ? "Creating…" : "Logging in…";
  const body = {
    email: $("#authEmail").value.trim(),
    password: $("#authPassword").value,
  };
  if (mode === "register") Object.assign(body, {
    name: $("#authName").value.trim(),
    username: $("#authUsername").value.trim(),
    course: $("#authCourse").value,
  });
  try {
    const response = await apiFetch(`/auth/${mode === "register" ? "register" : "login"}`, { method: "POST", body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Authentication failed");
    closeAuthModal();
    renderAuthState(result.user);
    await loadHomeProgress();
    if (location.pathname.endsWith("profile.html")) { window.location.reload(); return; }
    if (mode === "register") window.location.href = "profile.html";
  } catch (err) {
    error.textContent = err.message || "Authentication failed";
    error.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = mode === "register" ? "Create account" : "Log in";
  }
}

function renderAuthState(user) {
  $$("[data-auth]").forEach((button) => {
    button.removeAttribute("data-auth");
    button.dataset.authAction = "profile";
    button.classList.toggle("btn-outline", button.classList.contains("btn-outline"));
    button.textContent = button.dataset.authAction === "profile" ? (user ? `Hi, ${user.name.split(" ")[0]}` : "Profile") : button.textContent;
    button.addEventListener("click", () => window.location.href = "profile.html", { once: true });
  });
  const navActions = $(".nav-actions");
  if (navActions) {
    navActions.innerHTML = `<a class="btn btn-outline" href="profile.html"><i class="bi bi-person-circle"></i> ${escapeHtml((user?.name || "Profile").split(" ")[0])}</a><button class="btn" data-logout type="button">Log out</button>`;
    $("[data-logout]", navActions).addEventListener("click", logout);
  }
}

async function logout() {
  try { await apiFetch("/auth/logout", { method: "POST" }); } catch (_) {}
  renderGuestState();
  $("#studentProgress")?.setAttribute("hidden", "");
  if (location.pathname.endsWith("profile.html")) location.href = "index.html";
}
function renderGuestState() {
  const navActions = $(".nav-actions");
  if (navActions) navActions.innerHTML = `<button class="btn btn-outline" type="button" data-login-open>Log in</button><button class="btn" type="button" data-register-open>Create account</button>`;
  $$("[data-login-open]").forEach((b) => b.addEventListener("click", () => openAuthModal("login")));
  $$("[data-register-open]").forEach((b) => b.addEventListener("click", () => openAuthModal("register")));
}

async function loadAuth() {
  try {
    const response = await apiFetch("/auth/me");
    if (!response.ok) return renderGuestState();
    const result = await response.json();
    renderAuthState(result.user);
    return result.user;
  } catch (_) {
    renderGuestState();
    return null;
  }
}

function syncAnnouncementOffset() {
  const announcement = $(".site-announcement");
  if (!announcement || announcement.classList.contains("is-hidden")) {
    document.documentElement.style.setProperty("--announcement-height", "0px");
    return;
  }
  document.documentElement.style.setProperty("--announcement-height", `${announcement.offsetHeight}px`);
}

function setupAnnouncement() {
  const announcement = $(".site-announcement");
  if (!announcement) return;
  if (localStorage.getItem("ceeSaturdayAnnouncementHidden") === "1") {
    announcement.classList.add("is-hidden");
    return;
  }
  if (!$(".announcement-close", announcement)) {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "announcement-close";
    close.setAttribute("aria-label", "Dismiss announcement");
    close.innerHTML = '<i class="bi bi-x-lg"></i>';
    close.addEventListener("click", () => {
      announcement.classList.add("is-hidden");
      localStorage.setItem("ceeSaturdayAnnouncementHidden", "1");
      syncAnnouncementOffset();
    });
    announcement.appendChild(close);
  }
  syncAnnouncementOffset();
  window.addEventListener("resize", syncAnnouncementOffset);
}

function setupNavigation() {
  const navbar = $(".navbar");
  const mobileToggle = $(".mobile-toggle");
  mobileToggle?.addEventListener("click", () => {
    const open = navbar?.classList.toggle("open");
    mobileToggle?.setAttribute("aria-expanded", String(Boolean(open)));
    mobileToggle?.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  $$(".subject-toggle").forEach((button) => button.addEventListener("click", () => {
    const menu = button.parentElement?.querySelector(".mega");
    if (!menu) return;
    if (matchMedia("(max-width: 800px)").matches) {
      const open = menu.classList.toggle("mobile-open");
      button.setAttribute("aria-expanded", String(open));
    }
  }));
  document.addEventListener("click", (event) => {
    if (!navbar?.contains(event.target)) return;
    if (matchMedia("(max-width: 800px)").matches && event.target.closest("a")) {
      navbar.classList.remove("open");
      mobileToggle?.setAttribute("aria-expanded", "false");
    }
  });
}

function setupContentInteractions() {
  $$(".faq-q").forEach((q) => q.addEventListener("click", () => q.parentElement?.classList.toggle("open")));
  $$("[data-coming-soon]").forEach((link) => link.addEventListener("click", (e) => { e.preventDefault(); link.blur(); }));
  $$(".filter").forEach((b) => b.addEventListener("click", () => {
    const group = b.closest(".filterbar");
    if (!group) return;
    group.querySelectorAll(".filter").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    const target = b.dataset.filter, scope = group.dataset.target;
    document.querySelectorAll(`${scope} [data-subject]`).forEach((card) => { card.style.display = target === "all" || card.dataset.subject === target ? "" : "none"; });
  }));
  const initialSubject = new URLSearchParams(location.search).get("subject");
  if (initialSubject) $$(".filter").find((b) => b.dataset.filter === initialSubject)?.click();
}

let taglineIndex = 0, charIndex = 0, deleting = false;
function typewrite() {
  const target = $("#typewriter");
  if (!target || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const taglines = ["Start small. Show up Saturday.", "Practice the patterns that repeat.", "Build your CEE score, one set at a time."];
  if (!deleting) {
    target.textContent = taglines[taglineIndex].slice(0, ++charIndex);
    if (charIndex === taglines[taglineIndex].length) { deleting = true; setTimeout(typewrite, 900); return; }
  } else {
    target.textContent = taglines[taglineIndex].slice(0, --charIndex);
    if (charIndex === 0) { deleting = false; taglineIndex = (taglineIndex + 1) % taglines.length; }
  }
  setTimeout(typewrite, deleting ? 22 : 42);
}

function countdown() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);
  while (next.getDay() !== 6 || next <= now) next.setDate(next.getDate() + 1);
  const d = next - now;
  [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60].forEach((value, i) => {
    const el = $$("#days,#hours,#mins,#secs")[i]; if (el && el.firstChild) el.firstChild.textContent = String(value).padStart(2, "0");
  });
}

async function loadSiteData() {
  if (!$("[data-dynamic-site]")) return;
  try {
    const response = await apiFetch("/site");
    if (!response.ok) throw new Error("Site data unavailable");
    const data = await response.json();
    const test = data.currentTest;
    if (test) {
      $$("[data-current-test-title]").forEach((el) => el.textContent = `Set ${test.id}: ${test.title}`);
      $$("[data-current-test-meta]").forEach((el) => el.textContent = `${test.question_count} MCQs · ${test.duration_minutes} minutes · Week ${test.week_number}`);
      $$("[data-week-label]").forEach((el) => el.textContent = `Week ${test.week_number} · Saturday practice`);
      $$("[data-launch-test]").forEach((btn) => btn.dataset.testId = test.id);
    }
    $$("[data-stat-tests]").forEach((el) => el.textContent = `${Number(data.totalTests || 0).toLocaleString()}`);
    $$("[data-stat-questions]").forEach((el) => el.textContent = `${Number(data.totalQuestions || 0).toLocaleString()}`);
    $$("[data-stat-students]").forEach((el) => el.textContent = `${Number(data.registeredStudents || 0).toLocaleString()}+`);
    $$("[data-stat-online]").forEach((el) => el.textContent = String(data.onlineStudents || 0));
    renderNotices(data.notices || []);
  } catch (_) {
    renderNotices([]);
  }
}

function renderNotices(notices) {
  const list = $("#mecNoticeList");
  if (!list) return;
  if (!notices.length) {
    list.innerHTML = `<div class="notice-empty">MEC notices will appear here automatically when published.</div>`;
    return;
  }
  list.innerHTML = notices.map((notice) => `<a class="notice-item" href="${escapeHtml(notice.url)}" target="_blank" rel="noopener noreferrer"><span class="notice-icon"><i class="bi bi-megaphone"></i></span><span><strong>${escapeHtml(notice.title)}</strong><small>${escapeHtml(notice.published_at || "MEC · Official notice")}</small></span><i class="bi bi-arrow-up-right"></i></a>`).join("");
}

async function loadTestArchive() {
  const archive = $("#testArchive");
  if (!archive) return;
  try {
    const response = await apiFetch("/tests");
    if (!response.ok) throw new Error("Unable to load tests");
    const tests = await response.json();
    archive.innerHTML = tests.length ? tests.map((test, index) => `<article class="archive-card"><span class="tag">${index === 0 ? "LATEST · " : ""}SET ${test.id}</span><h3>${escapeHtml(test.title)}</h3><div class="meta"><span><i class="bi bi-clock"></i> ${test.duration_minutes} min</span><span><i class="bi bi-patch-question"></i> ${test.question_count} MCQs</span></div><p>Week ${test.week_number} · Published ${escapeHtml(test.published_at)}</p><a class="btn btn-outline" href="quiz.html?testId=${encodeURIComponent(test.id)}">Open practice set</a></article>`).join("") : '<div class="notice-empty">No practice sets are published yet.</div>';
    setupTestLaunch();
  } catch (_) { archive.innerHTML = '<div class="notice-empty">Test archive is temporarily unavailable.</div>'; }
}

async function loadRepeatedQuestions() {
  const bank = $("#questionBank");
  if (!bank) return;
  try {
    const response = await apiFetch("/repeated-questions");
    if (!response.ok) throw new Error("Unable to load repeated questions");
    const questions = await response.json();
    bank.innerHTML = questions.length ? questions.map((q) => `<article class="repeat-q" data-subject="${escapeHtml(q.subject)}"><div><span class="tag">${escapeHtml(q.subject).toUpperCase()}</span><h3>${escapeHtml(q.prompt)}</h3><p class="meta">${escapeHtml(q.unit)} · Repeated pattern</p></div><div class="appear">Appeared in<br><strong>${Number(q.years_appeared || q.occurrences || 0)} past years</strong></div></article>`).join("") : '<div class="notice-empty">No repeated questions are available yet.</div>';
  } catch (_) { bank.innerHTML = '<div class="notice-empty">Repeated questions are temporarily unavailable.</div>'; }
}

async function loadHomeProgress() {
  const box = $("#studentProgress");
  if (!box) return;
  try {
    const response = await apiFetch("/progress");
    if (!response.ok) { box.hidden = true; return; }
    const data = await response.json();
    box.hidden = false;
    $("#progressOverall", box).textContent = `${data.overall.progress}%`;
    $("#progressBar", box).style.width = `${data.overall.progress}%`;
    $("#progressMeta", box).textContent = `${data.overall.answered_questions} unique questions attempted · ${data.overall.tests_attempted} tests completed · ${data.overall.average_score}% average score`;
    const subjectBox = $("#subjectProgress", box);
    subjectBox.innerHTML = (data.subjects || []).map((s) => `<div class="progress-subject"><div><strong>${escapeHtml(s.subject[0].toUpperCase() + s.subject.slice(1))}</strong><span>${s.answered}/${s.total_questions} attempted · ${s.accuracy}% accuracy</span></div><div class="progress-track"><span style="width:${s.coverage}%"></span></div></div>`).join("");
  } catch (_) { box.hidden = true; }
}

async function loadProfilePage() {
  if (!$("#profilePage")) return;
  const user = await loadAuth();
  if (!user) { $("#profileGuest").hidden = false; $("#profileContent").hidden = true; return; }
  $("#profileGuest").hidden = true; $("#profileContent").hidden = false;
  const fields = { profileName: user.name, profileUsername: user.username, profileEmail: user.email, profileCourse: user.course || "", profileBio: user.bio || "" };
  Object.entries(fields).forEach(([id, value]) => { const el = $("#" + id); if (el) el.value = value; });
  await refreshProfileProgress();
  $("#profileForm")?.addEventListener("submit", updateProfile);
}

async function refreshProfileProgress() {
  try {
    const response = await apiFetch("/progress");
    if (!response.ok) return;
    const data = await response.json();
    $("#profileProgressValue").textContent = `${data.overall.progress}%`;
    $("#profileProgressBar").style.width = `${data.overall.progress}%`;
    $("#profileStats").innerHTML = `<div><strong>${data.overall.tests_attempted}</strong><span>Tests</span></div><div><strong>${data.overall.answered_questions}</strong><span>Questions</span></div><div><strong>${data.overall.average_score}%</strong><span>Average</span></div>`;
    $("#profileSubjects").innerHTML = data.subjects.map((s) => `<div class="profile-subject"><div><strong>${escapeHtml(s.subject)}</strong><span>${s.coverage}% coverage · ${s.accuracy}% accuracy</span></div><div class="progress-track"><span style="width:${s.coverage}%"></span></div></div>`).join("");
  } catch (_) {}
}

async function updateProfile(event) {
  event.preventDefault();
  const notice = $("#profileSaveNotice");
  const button = $("#profileSaveButton");
  button.disabled = true; button.textContent = "Saving…"; notice.hidden = true;
  try {
    const response = await apiFetch("/auth/me", { method: "PATCH", body: JSON.stringify({
      name: $("#profileName").value.trim(), username: $("#profileUsername").value.trim(), course: $("#profileCourse").value.trim(), bio: $("#profileBio").value.trim(),
    }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Could not save profile");
    notice.textContent = "Profile updated."; notice.className = "form-success"; notice.hidden = false;
    renderAuthState(result.user);
  } catch (err) {
    notice.textContent = err.message; notice.className = "form-error"; notice.hidden = false;
  } finally { button.disabled = false; button.textContent = "Save changes"; }
}

function setupTestLaunch() {
  $$("[data-launch-test]").forEach((button) => {
    if (button.dataset.launchBound === "1") return;
    button.dataset.launchBound = "1";
    button.addEventListener("click", (event) => {
    event.preventDefault();
    const loader = $("#loader"); if (!loader) return;
    const testId = button.dataset.testId || "42";
    loader.classList.add("show");
    const tx = $("#loaderText"), sub = $("#loaderSub");
    if (tx) tx.classList.remove("loader-ready");
    if (tx) tx.textContent = "Preparing your Saturday set";
    if (sub) sub.textContent = "Loading the latest questions…";
    setTimeout(() => { if (tx) tx.textContent = "Shuffling your question order"; }, 180);
    setTimeout(() => { if (tx) { tx.textContent = "Ready for Saturday."; tx.classList.add("loader-ready"); } }, 430);
    setTimeout(() => { location.href = `quiz.html?testId=${encodeURIComponent(testId)}`; }, 650);
    });
  });
}

function setupCountdown() { if ($("#days")) { countdown(); setInterval(countdown, 1000); } }

(async function init() {
  buildAuthModal();
  setupAnnouncement();
  setupNavigation();
  setupContentInteractions();
  typewrite();
  setupCountdown();
  setupTestLaunch();
  await loadAuth();
  await loadSiteData();
  await loadTestArchive();
  await loadRepeatedQuestions();
  await loadHomeProgress();
  await loadProfilePage();

  // Presence heartbeat keeps the online-student count meaningful for logged-in users.
  if (document.visibilityState === "visible") apiFetch("/presence", { method: "POST" }).catch(() => {});
  setInterval(() => { if (document.visibilityState === "visible") apiFetch("/presence", { method: "POST" }).catch(() => {}); }, 60_000);
})();
