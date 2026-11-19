(() => {
  "use strict";

  const store = window.AppStore;

  function makeId() {
    return window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function getCurrentUser() {
    const session = store.getSession();
    if (!session || !session.userId) return null;
    const user = store.getUsers().find((entry) => entry.id === session.userId);
    if (!user) {
      store.clearSession();
      return null;
    }
    return user;
  }

  function register(details) {
    const users = store.getUsers();
    const email = details.email.trim().toLowerCase();
    const studentId = details.studentId.trim().toLowerCase();
    if (users.some((user) => user.email.toLowerCase() === email)) throw new Error("An account with this email already exists.");
    if (users.some((user) => user.studentId.toLowerCase() === studentId)) throw new Error("This student ID is already registered.");
    if (details.password.length < 6) throw new Error("Password must be at least 6 characters.");
    const user = {
      id: makeId(),
      name: details.name.trim(),
      studentId: details.studentId.trim(),
      email,
      password: details.password,
      phone: details.phone.trim(),
      role: "student",
      createdAt: new Date().toISOString()
    };
    users.push(user);
    store.saveUsers(users);
    store.saveSession({ userId: user.id });
    return user;
  }

  function login(emailInput, password) {
    const email = emailInput.trim().toLowerCase();
    const user = store.getUsers().find((entry) => entry.email.toLowerCase() === email && entry.password === password);
    if (!user) throw new Error("Email or password is incorrect.");
    store.saveSession({ userId: user.id });
    return user;
  }

  function logout() {
    store.clearSession();
    window.location.href = "index.html";
  }

  function destination(user) {
    const requested = new URLSearchParams(window.location.search).get("next");
    if (requested && requested.startsWith("/") && !requested.startsWith("//")) {
      const relative = requested.slice(1);
      if (/^(?:index|items|post-item|item-details|login|my-dashboard|admin)\.html(?:\?.*)?$/.test(relative)) return relative;
    }
    return user.role === "admin" ? "admin.html" : "my-dashboard.html";
  }

  function showFormError(targetId, message) {
    const target = document.getElementById(targetId);
    if (target) {
      target.textContent = message;
      target.hidden = false;
    }
  }

  function switchTab(tab) {
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");
    const loginPanel = document.getElementById("login-panel");
    const registerPanel = document.getElementById("register-panel");
    if (!loginTab || !registerTab || !loginPanel || !registerPanel) return;
    const isLogin = tab === "login";
    loginTab.classList.toggle("active", isLogin);
    registerTab.classList.toggle("active", !isLogin);
    loginTab.setAttribute("aria-selected", String(isLogin));
    registerTab.setAttribute("aria-selected", String(!isLogin));
    loginPanel.hidden = !isLogin;
    registerPanel.hidden = isLogin;
  }

  function bindLoginForms() {
    const loginForm = document.getElementById("login-panel");
    const registerForm = document.getElementById("register-panel");
    if (!loginForm || !registerForm) return;
    document.getElementById("login-tab").addEventListener("click", () => switchTab("login"));
    document.getElementById("register-tab").addEventListener("click", () => switchTab("register"));

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      document.getElementById("login-error").hidden = true;
      if (!loginForm.reportValidity()) return;
      try {
        const user = login(document.getElementById("login-email").value, document.getElementById("login-password").value);
        window.location.href = destination(user);
      } catch (error) {
        showFormError("login-error", error.message);
      }
    });

    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      document.getElementById("register-error").hidden = true;
      if (!registerForm.reportValidity()) return;
      try {
        const user = register({
          name: document.getElementById("register-name").value,
          studentId: document.getElementById("register-student-id").value,
          email: document.getElementById("register-email").value,
          phone: document.getElementById("register-phone").value,
          password: document.getElementById("register-password").value
        });
        window.location.href = destination(user);
      } catch (error) {
        showFormError("register-error", error.message);
      }
    });
  }

  const protectedPage = document.body.dataset.protected;
  const currentUser = getCurrentUser();
  if (protectedPage === "admin" && (!currentUser || currentUser.role !== "admin")) {
    window.location.replace(`login.html?next=${encodeURIComponent("/admin.html")}`);
  } else if (protectedPage === "student" && !currentUser) {
    const next = `${window.location.pathname.split("/").pop()}${window.location.search}`;
    window.location.replace(`login.html?next=${encodeURIComponent(`/${next}`)}`);
  }

  bindLoginForms();
  if (window.location.hash === "#register") switchTab("register");
  window.AppAuth = { getCurrentUser, register, login, logout, makeId };
})();
