(() => {
  "use strict";

  const store = window.AppStore;
  const ui = window.AppUI;
  const locations = window.CampusLocations;

  function renderItemDetails() {
    const root = document.getElementById("item-detail-root");
    if (!root) return;
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      root.innerHTML = `<div class="empty-state"><h2>Item not specified</h2><p>Choose an item from the browse page to see its details.</p></div>`;
      return;
    }
    const item = store.getItems().find((entry) => entry.id === id);
    if (!item || !["Approved", "Returned"].includes(item.status)) {
      root.innerHTML = `<div class="empty-state"><h2>Item not found</h2><p>This item may have been removed or is not publicly available.</p><a class="button button-primary" href="items.html">Browse items</a></div>`;
      return;
    }
    const user = window.AppAuth.getCurrentUser();
    const isOwner = user && item.ownerId === user.id;
    const isComplete = item.status === "Returned";
    const photoMarkup = item.photo
      ? `<div class="detail-image"><img src="${ui.escapeHTML(item.photo)}" alt="${ui.escapeHTML(item.title)}"></div>`
      : `<div class="detail-image" role="img" aria-label="${ui.escapeHTML(item.title)}">${ui.escapeHTML(item.icon || "📦")}</div>`;
    const claimArea = isComplete
      ? `<section class="claim-panel"><h2>Item returned</h2><p>This item has been marked as returned to its owner.</p></section>`
      : isOwner
        ? `<section class="claim-panel"><h2>Your post</h2><p>Claim requests for this item appear in your dashboard under “Claims received”.</p><a class="text-link" href="my-dashboard.html">Go to dashboard →</a></section>`
        : user
          ? `<section class="claim-panel"><h2>Is this yours?</h2><p>Share a detail only the owner would know. An administrator will verify the request.</p>
            <form id="claim-form" novalidate><div id="claim-error" class="form-error" role="alert" hidden></div>
              <div class="form-grid"><div class="field field-full"><label for="claim-proof">Proof / description *</label><textarea id="claim-proof" rows="3" maxlength="800" required placeholder="Describe a unique mark, contents, or another identifying detail."></textarea></div>
              <div class="field field-full"><label for="claim-contact">Contact number *</label><input id="claim-contact" type="tel" maxlength="30" required value="${ui.escapeHTML(user.phone || "")}" placeholder="A phone number for follow-up"></div></div>
              <div class="form-actions"><button class="button button-primary" type="submit">Submit claim request</button></div>
            </form></section>`
          : `<section class="claim-panel"><h2>Think this belongs to you?</h2><p>Sign in to submit a claim request with details that verify ownership.</p><a class="button button-primary" href="login.html?next=${encodeURIComponent(`/item-details.html?id=${item.id}`)}">Sign in to claim</a></section>`;

    root.innerHTML = `<article class="detail-card">${photoMarkup}<div class="detail-content">
      <div class="item-card-top"><span class="badge ${ui.badgeClass(item.type)}">${ui.escapeHTML(item.type)}</span>
      <span class="badge ${ui.badgeClass(item.status)}">${ui.escapeHTML(item.status)}</span><span class="badge">${ui.escapeHTML(item.category)}</span></div>
      <h1>${ui.escapeHTML(item.title)}</h1><p class="detail-description">${ui.escapeHTML(item.description)}</p>
      <div class="detail-facts"><div class="detail-fact"><strong>Location</strong>${ui.escapeHTML(locations.formatItemLocation(item))}</div>
      <div class="detail-fact"><strong>Date lost / found</strong>${ui.escapeHTML(ui.formatDate(item.date))}</div>
      ${item.type === "Lost" && item.lastSeenTime ? `<div class="detail-fact"><strong>Last seen time</strong>${ui.escapeHTML(item.lastSeenTime)}</div>` : ""}
      <div class="detail-fact"><strong>Contact</strong>${ui.escapeHTML(item.contact)}</div>
      <div class="detail-fact"><strong>Posted</strong>${ui.escapeHTML(ui.formatDate(item.createdAt))}</div></div>${claimArea}</div></article>`;

    const form = document.getElementById("claim-form");
    if (form) form.addEventListener("submit", (event) => {
      event.preventDefault();
      const errorBox = document.getElementById("claim-error");
      errorBox.hidden = true;
      if (!form.reportValidity()) return;
      const proof = document.getElementById("claim-proof").value.trim();
      const contact = document.getElementById("claim-contact").value.trim();
      if (!proof || !/^[+()\d.\-\s]{7,30}$/.test(contact)) {
        errorBox.textContent = "Enter proof details and a valid contact number.";
        errorBox.hidden = false;
        return;
      }
      const claims = store.getClaims();
      if (claims.some((claim) => claim.itemId === item.id && claim.claimantId === user.id)) {
        errorBox.textContent = "You have already submitted a claim for this item.";
        errorBox.hidden = false;
        return;
      }
      claims.unshift({
        id: window.AppAuth.makeId(),
        itemId: item.id,
        claimantId: user.id,
        proof,
        contact,
        status: "Pending",
        createdAt: new Date().toISOString()
      });
      try {
        store.saveClaims(claims);
        window.AppUI.showToast("Claim request submitted for verification.", "success");
        renderItemDetails();
      } catch (error) {
        errorBox.textContent = "Could not save your claim. Browser storage may be full.";
        errorBox.hidden = false;
      }
    });
  }

  function renderMyClaims() {
    const panel = document.getElementById("dashboard-claims");
    if (!panel) return;
    const user = window.AppAuth.getCurrentUser();
    if (!user) return;
    const claims = store.getClaims().filter((claim) => claim.claimantId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    panel.innerHTML = claims.length ? `<div class="dashboard-list">${claims.map((claim) => {
      const item = store.getItems().find((entry) => entry.id === claim.itemId);
      return `<article class="dashboard-row"><div class="dashboard-row-main"><h3>${ui.escapeHTML(item ? item.title : "Removed item")}</h3>
        <p>${ui.escapeHTML(item ? locations.formatItemLocation(item) : "This item is no longer available.")}</p>
        <p>Submitted ${ui.escapeHTML(ui.formatDate(claim.createdAt))}</p>${claim.rejectionReason ? `<p class="proof-box">Review note: ${ui.escapeHTML(claim.rejectionReason)}</p>` : ""}</div>
        <span class="badge ${ui.badgeClass(claim.status)}">${ui.escapeHTML(claim.status)}</span></article>`;
    }).join("")}</div>` : `<div class="empty-state"><h2>No claim requests</h2><p>When you request an item, its status will show here.</p><a class="button button-primary" href="items.html">Browse items</a></div>`;
  }

  function renderReceivedClaims() {
    const panel = document.getElementById("dashboard-received");
    if (!panel) return;
    const user = window.AppAuth.getCurrentUser();
    if (!user) return;
    const items = store.getItems().filter((item) => item.ownerId === user.id);
    const itemById = new Map(items.map((item) => [item.id, item]));
    const claims = store.getClaims().filter((claim) => itemById.has(claim.itemId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    panel.innerHTML = claims.length ? `<div class="dashboard-list">${claims.map((claim) => {
      const item = itemById.get(claim.itemId);
      const claimant = store.getUsers().find((entry) => entry.id === claim.claimantId);
      return `<article class="dashboard-row"><div class="dashboard-row-main"><h3>${ui.escapeHTML(item.title)} · ${ui.escapeHTML(claimant ? claimant.name : "Former user")}</h3>
        <p>Claimant contact: ${ui.escapeHTML(claim.contact)}</p><p>Submitted ${ui.escapeHTML(ui.formatDate(claim.createdAt))}</p>
        <p class="proof-box"><strong>Claim proof:</strong> ${ui.escapeHTML(claim.proof)}</p>
        ${claim.rejectionReason ? `<p class="proof-box">Review note: ${ui.escapeHTML(claim.rejectionReason)}</p>` : ""}</div>
        <span class="badge ${ui.badgeClass(claim.status)}">${ui.escapeHTML(claim.status)}</span></article>`;
    }).join("")}</div>` : `<div class="empty-state"><h2>No claims received</h2><p>Requests from other users for your items will appear here.</p></div>`;
  }

  function renderDashboardClaims() {
    renderMyClaims();
    renderReceivedClaims();
  }

  renderItemDetails();
  renderDashboardClaims();
  window.addEventListener("campusfind:dashboard-tab", (event) => {
    if (event.detail.tab === "claims" || event.detail.tab === "received") renderDashboardClaims();
  });
  window.AppClaims = { renderDashboardClaims };
})();
