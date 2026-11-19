(() => {
  "use strict";

  const PROJECT_CREDITS = {
    team: ["Shamim Ahmed", "Shaifuzzaman Ratul", "Sayed Asadur Rahman"],
    university: "Daffodil International University"
  };

  const FOOTER_CONFIG = {
    collectionPoint: {
      office: "Security Office",
      hours: "Sun–Thu, 9:00 AM – 4:00 PM"
    }
  };

  const DAILY_TIPS = [
    "Keep serial numbers for electronics in a private place.",
    "Save unique identifying details for claim verification.",
    "Meet at the Security Office when collecting a returned item.",
    "Never include passwords, ID numbers, or private documents in a post.",
    "Check nearby desks and your recent route when something goes missing.",
    "Hide names and identifying numbers in item photos.",
    "Ask claimants for details only the true owner would know.",
    "Use a contact method you can check and reply to."
  ];

  const escapeHTML = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  function formatProjectTeam() {
    const names = PROJECT_CREDITS.team;
    if (names.length < 2) return names[0] || "";
    return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
  }

  function showToast(message, type) {
    const region = document.getElementById("toast-region");
    if (!region) return;
    const toast = document.createElement("div");
    toast.className = `toast${type === "error" ? " error" : ""}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3800);
  }

  function formatDate(value) {
    if (!value) return "Date not provided";
    const date = new Date(`${value.slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? escapeHTML(value) : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function badgeClass(status) {
    return `badge-${String(status || "").toLowerCase().replace(/[^a-z]+/g, "-")}`;
  }

  function greetingForHour(hour) {
    if (hour >= 5 && hour <= 11) return "Good morning";
    if (hour >= 12 && hour <= 16) return "Good afternoon";
    if (hour >= 17 && hour <= 20) return "Good evening";
    return "Good night";
  }

  function renderUserGreeting(user) {
    const greeting = greetingForHour(new Date().getHours());
    if (user.role === "admin") return `<span class="nav-user">${greeting}, Admin <span class="nav-admin-badge">Admin</span></span>`;
    const firstName = String(user.name || "").trim().split(/\s+/)[0] || "Student";
    const displayName = firstName.length > 12 ? `${firstName.slice(0, 12)}…` : firstName;
    return `<span class="nav-user">${greeting}, ${escapeHTML(displayName)}</span>`;
  }

  function renderCompactGreeting(user) {
    if (user.role === "admin") return `<span class="nav-user">Admin</span>`;
    const firstName = String(user.name || "").trim().split(/\s+/)[0] || "Student";
    const displayName = firstName.length > 12 ? `${firstName.slice(0, 12)}…` : firstName;
    return `<span class="nav-user">${escapeHTML(displayName)}</span>`;
  }

  function renderNavigation() {
    const mount = document.getElementById("site-nav");
    if (!mount) return;
    const user = window.AppAuth.getCurrentUser();
    const page = window.location.pathname.split("/").pop() || "index.html";
    const link = (href, label) => `<a href="${href}"${page === href ? ' aria-current="page"' : ""}>${label}</a>`;
    const authLinks = user
      ? `${link(user.role === "admin" ? "admin.html" : "my-dashboard.html", user.role === "admin" ? "Admin panel" : "My dashboard")}${renderUserGreeting(user)}<button class="button button-outline button-small" type="button" data-logout>Log out</button>`
      : `<span class="nav-user">Welcome, Guest</span>${link("login.html", "Login")}<a href="login.html#register">Register</a>`;
    mount.innerHTML = `<header class="site-header"><nav class="nav-inner" aria-label="Main navigation">
      <a class="brand" href="index.html"><img src="images/logo.svg" alt="Campus Find logo" width="40" height="40"><span>Campus Find</span></a>
      <div class="nav-mobile-account">${user ? renderCompactGreeting(user) : '<span class="nav-user">Guest</span>'}${user ? '<button class="button button-outline button-small" type="button" data-logout>Log out</button>' : ""}</div>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open navigation menu">☰</button>
      <div id="nav-links" class="nav-links">${link("items.html", "Browse items")}${user ? link("post-item.html", "Post an item") : ""}${authLinks}</div>
      </nav></header>`;
    mount.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", () => window.AppAuth.logout()));
    const toggle = mount.querySelector(".nav-toggle");
    const links = mount.querySelector(".nav-links");
    const closeMenu = () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    };
    toggle.addEventListener("click", () => {
      const open = !links.classList.contains("open");
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });
    links.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("click", (event) => {
      if (!mount.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && links.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;

    let returnedCount = 0;
    try {
      const items = window.AppStore.getItems();
      if (Array.isArray(items)) returnedCount = items.filter((item) => item && item.status === "Returned").length;
    } catch (error) {
      console.error("Campus Find: could not read returned item count.", error);
    }

    const tip = DAILY_TIPS[(new Date().getDate() - 1) % DAILY_TIPS.length];
    mount.innerHTML = `<footer class="site-footer">
      <div class="footer-main">
        <section class="footer-brand" aria-label="About Campus Find">
          <a class="brand footer-logo" href="index.html"><img src="images/logo.svg" alt="Campus Find logo" width="40" height="40"><span>Campus Find</span></a>
          <p>Good neighbors help good things find their way home. A little campus kindness goes a long way.</p>
          <span class="footer-community"><span aria-hidden="true">●</span> Made for our campus community</span>
        </section>
        <section class="footer-how" aria-labelledby="footer-how-title">
          <h2 id="footer-how-title">How it works</h2>
          <ol>
            <li><span>1</span>Post what you lost or found</li>
            <li><span>2</span>Admin verifies the post</li>
            <li><span>3</span>Claim it and collect it</li>
          </ol>
        </section>
        <section class="footer-collection" aria-labelledby="footer-collection-title">
          <h2 id="footer-collection-title">Collection point</h2>
          <p>Returned items are handed over at the <strong>${escapeHTML(FOOTER_CONFIG.collectionPoint.office)}</strong>.</p>
          <p class="footer-hours">${escapeHTML(FOOTER_CONFIG.collectionPoint.hours)}</p>
        </section>
        <nav class="footer-links" aria-label="Footer navigation">
          <h2>Explore</h2>
          <a href="items.html">Browse items</a>
          <a href="post-item.html">Post a lost or found item</a>
          <a href="my-dashboard.html">My dashboard</a>
          <a href="faq.html">Rules &amp; FAQ</a>
          <a href="mailto:admin@uni.edu">Contact admin</a>
        </nav>
        <section class="footer-message" aria-label="Found something">
          <span class="footer-heart" aria-hidden="true">♡</span>
          <p><strong>Found something?</strong><br>Be the reason someone’s day gets better.</p>
          <a class="footer-cta" href="post-item.html">Help it find its owner <span aria-hidden="true">→</span></a>
        </section>
      </div>
      <div class="footer-info">
        <p class="footer-returned-count" aria-live="polite"><strong>${returnedCount}</strong> items have found their way home</p>
        <p class="footer-tip"><strong>Tip of the day:</strong> ${escapeHTML(tip)}</p>
      </div>
      <div class="footer-bottom">
        <span>Campus Find <span aria-hidden="true">·</span> University Lost &amp; Found</span>
        <span class="footer-credit">Made by ${escapeHTML(formatProjectTeam())} · ${escapeHTML(PROJECT_CREDITS.university)}</span>
        <a href="login.html">Student sign in</a>
      </div>
      <button class="back-to-top" type="button" aria-label="Back to top" hidden>Back to top ↑</button>
    </footer>`;

    const backToTop = mount.querySelector(".back-to-top");
    const updateBackToTop = () => { backToTop.hidden = window.scrollY <= 300; };
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop();
  }

  function getApprovedItems() {
    try {
      const items = window.AppStore.getItems();
      return Array.isArray(items) ? items.filter((item) => item && item.status === "Approved") : [];
    } catch (error) {
      console.error("Campus Find: could not read map item counts.", error);
      return [];
    }
  }

  function getPlaceCounts(place, items) {
    const lost = items.filter((item) => item.type === "Lost" && Array.isArray(item.lostLocationIds) && item.lostLocationIds.includes(place.id)).length;
    const found = items.filter((item) => item.type === "Found" && item.foundLocationId === place.id).length;
    return { lost, found };
  }

  function timeAgo(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time unavailable";
    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  function locationBadges(counts) {
    return `<span class="place-counts">
      ${counts.lost ? `<span class="place-count place-count-lost" aria-label="${counts.lost} lost">${counts.lost}</span>` : ""}
      ${counts.found ? `<span class="place-count place-count-found" aria-label="${counts.found} found">${counts.found}</span>` : ""}
    </span>`;
  }

  function placeButtonMarkup(place, counts, className, allCounts) {
    const labelCounts = allCounts || counts;
    const ariaLabel = `${place.label}: ${labelCounts.lost} lost, ${labelCounts.found} found`;
    const empty = !counts.lost && !counts.found;
    const state = counts.lost ? "pin-lost" : counts.found ? "pin-found" : "pin-empty";
    return `<button class="${className} ${state}${empty ? " has-no-items" : ""}" type="button" data-place-id="${escapeHTML(place.id)}"
      aria-label="${escapeHTML(ariaLabel)}" title="${escapeHTML(ariaLabel)}">
      <span class="place-pin-dot" aria-hidden="true"></span><span class="place-pin-label">${escapeHTML(place.label)}</span>${locationBadges(counts)}
    </button>`;
  }

  function renderCampusMap() {
    const mount = document.getElementById("campus-map");
    if (!mount) return;
    const groups = window.CampusLocations.getGroups();
    let activeType = "All";

    mount.innerHTML = `<div class="campus-map-header">
      <div><p class="eyebrow">Daffodil Smart City · Birulia, Savar</p><h2>Explore campus places</h2></div>
      <div class="campus-map-toggle" role="group" aria-label="Filter places by item type">
        <button type="button" class="active" data-map-type="All" aria-pressed="true">All</button>
        <button type="button" data-map-type="Lost" aria-pressed="false">Lost</button>
        <button type="button" data-map-type="Found" aria-pressed="false">Found</button>
      </div>
    </div>
    <div id="campus-image-map" class="campus-image-map" role="region" aria-label="Campus map with place pins" hidden>
      <div id="campus-image-pins" class="campus-image-pins"></div>
    </div>
    <div id="campus-location-groups" class="location-group-grid"></div>
    <section id="campus-location-panel" class="campus-location-panel" aria-live="polite" tabindex="-1" hidden></section>
    <div class="hero-note"><span class="hero-note-icon" aria-hidden="true">♡</span><span><strong>Small things matter.</strong><br>Let’s get them back.</span></div>`;

    const groupsRoot = mount.querySelector("#campus-location-groups");
    const panel = mount.querySelector("#campus-location-panel");
    const imageMap = mount.querySelector("#campus-image-map");
    const imagePins = mount.querySelector("#campus-image-pins");
    let selectedPlaceId = "";

    function renderGroups(items) {
      groupsRoot.innerHTML = groups.map((group) => {
        const places = group.places.map((place) => {
          const allCounts = getPlaceCounts(place, items);
          const counts = activeType === "All"
            ? allCounts
            : { lost: activeType === "Lost" ? allCounts.lost : 0, found: activeType === "Found" ? allCounts.found : 0 };
          return { place, counts, allCounts };
        });
        return `<section class="location-group">
          <h3>${escapeHTML(group.group)}</h3>
          <div class="location-group-places">${places.map(({ place, counts, allCounts }) =>
            placeButtonMarkup(place, counts, "campus-place-pin", allCounts)).join("")}</div>
        </section>`;
      }).join("");
    }

    function renderImagePins(items) {
      imagePins.innerHTML = groups.flatMap((group) => group.places).map((place) => {
        const allCounts = getPlaceCounts(place, items);
        const counts = activeType === "All"
          ? allCounts
          : { lost: activeType === "Lost" ? allCounts.lost : 0, found: activeType === "Found" ? allCounts.found : 0 };
        const ariaLabel = `${place.label}: ${allCounts.lost} lost, ${allCounts.found} found`;
        const state = counts.lost ? "pin-lost" : counts.found ? "pin-found" : "pin-empty";
        return `<button type="button" class="campus-image-pin ${state}"
          style="left:${place.x}%;top:${place.y}%" data-place-id="${escapeHTML(place.id)}"
          aria-label="${escapeHTML(ariaLabel)}" title="${escapeHTML(ariaLabel)}">
          <span class="place-pin-dot" aria-hidden="true"></span>${locationBadges(counts)}
        </button>`;
      }).join("");
    }

    function timeList(itemsAtPlace, typeLabel) {
      if (!itemsAtPlace.length) return `<p class="location-list-empty">No approved ${typeLabel.toLowerCase()} items here.</p>`;
      return `<ul>${itemsAtPlace.map((item) => `<li>
        <a href="item-details.html?id=${encodeURIComponent(item.id)}">${escapeHTML(item.title)}</a>
        <span>${escapeHTML(timeAgo(item.createdAt))}</span>
      </li>`).join("")}</ul>`;
    }

    function showPlacePanel(placeId) {
      const place = window.CampusLocations.getLocationById(placeId);
      if (!place) return;
      selectedPlaceId = placeId;
      const items = getApprovedItems();
      const lostItems = items.filter((item) => item.type === "Lost" && Array.isArray(item.lostLocationIds) && item.lostLocationIds.includes(placeId));
      const foundItems = items.filter((item) => item.type === "Found" && item.foundLocationId === placeId);
      const sections = activeType === "Lost"
        ? `<section><h4>Lost here</h4>${timeList(lostItems, "Lost")}</section>`
        : activeType === "Found"
          ? `<section><h4>Found here</h4>${timeList(foundItems, "Found")}</section>`
          : `<section><h4>Lost here</h4>${timeList(lostItems, "Lost")}</section>
             <section><h4>Found here</h4>${timeList(foundItems, "Found")}</section>`;
      panel.innerHTML = `<div class="location-panel-heading"><h3 tabindex="-1">${escapeHTML(place.label)}</h3>
        <a class="button button-outline button-small" href="items.html?location=${encodeURIComponent(place.id)}">View all</a>
        <button class="location-panel-close" type="button" data-close-location-panel aria-label="Close place details">×</button></div>
        <div class="location-panel-lists">${sections}</div>`;
      panel.hidden = false;
      panel.querySelector("h3").focus({ preventScroll: true });
    }

    mount.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-location-panel]")) {
        panel.hidden = true;
        const placeButton = Array.from(mount.querySelectorAll(`[data-place-id="${selectedPlaceId}"]`))
          .find((button) => button.getClientRects().length);
        selectedPlaceId = "";
        placeButton?.focus();
        return;
      }
      const target = event.target.closest("[data-place-id]");
      if (target && mount.contains(target)) showPlacePanel(target.dataset.placeId);
      const filter = event.target.closest("[data-map-type]");
      if (filter && mount.contains(filter)) {
        activeType = filter.dataset.mapType;
        mount.querySelectorAll("[data-map-type]").forEach((button) => {
          const selected = button.dataset.mapType === activeType;
          button.classList.toggle("active", selected);
          button.setAttribute("aria-pressed", String(selected));
        });
        const items = getApprovedItems();
        renderGroups(items);
        renderImagePins(items);
        if (selectedPlaceId) showPlacePanel(selectedPlaceId);
      }
    });

    const items = getApprovedItems();
    renderGroups(items);
    const background = new Image();
    background.addEventListener("load", () => {
      imageMap.style.backgroundImage = 'linear-gradient(rgba(242, 247, 235, .18), rgba(242, 247, 235, .18)), url("images/campus-map.png")';
      imageMap.hidden = false;
      mount.classList.add("has-campus-map-image");
      renderImagePins(getApprovedItems());
    });
    background.src = "images/campus-map.png";
  }

  window.AppUI = { escapeHTML, showToast, formatDate, badgeClass };
  renderNavigation();
  renderFooter();
  renderCampusMap();
})();
