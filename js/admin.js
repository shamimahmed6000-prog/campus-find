(() => {
  "use strict";

  const store = window.AppStore;
  const ui = window.AppUI;
  const locations = window.CampusLocations;

  function table(headers, rows, emptyMessage) {
    if (!rows.length) return `<div class="admin-table-wrap"><p class="table-empty">${ui.escapeHTML(emptyMessage)}</p></div>`;
    return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${headers.map((header) => `<th scope="col">${ui.escapeHTML(header)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  }

  function askReason(subject) {
    const reason = window.prompt(`Optional review note for ${subject}:`);
    return reason === null ? null : reason.trim();
  }

  function render() {
    const items = store.getItems();
    const claims = store.getClaims();
    const users = store.getUsers();
    document.getElementById("admin-stats").innerHTML = [
      ["Total posts", items.length], ["Pending posts", items.filter((item) => item.status === "Pending").length],
      ["Total claims", claims.length], ["Returned items", items.filter((item) => item.status === "Returned").length]
    ].map(([label, count]) => `<article class="stat-card"><strong>${count}</strong><span>${label}</span></article>`).join("");

    const pendingPosts = items.filter((item) => item.status === "Pending");
    document.getElementById("pending-posts").innerHTML = table(
      ["Item", "Posted by", "Location / date", "Actions"],
      pendingPosts.map((item) => {
        const owner = users.find((user) => user.id === item.ownerId);
        return `<tr><td><strong>${ui.escapeHTML(item.title)}</strong><br><span class="badge ${ui.badgeClass(item.type)}">${ui.escapeHTML(item.type)}</span> <span class="badge">${ui.escapeHTML(item.category)}</span><br>${ui.escapeHTML(item.description)}</td>
          <td>${ui.escapeHTML(owner ? owner.name : "Sample account")}<br>${ui.escapeHTML(owner ? owner.email : "")}</td>
          <td>${ui.escapeHTML(locations.formatItemLocation(item))}<br>${ui.escapeHTML(ui.formatDate(item.date))}</td>
          <td><div class="table-actions"><button class="button button-primary button-small" data-approve-post="${ui.escapeHTML(item.id)}">Approve</button>
          <button class="button button-danger button-small" data-reject-post="${ui.escapeHTML(item.id)}">Reject</button></div></td></tr>`;
      }),
      "No posts are waiting for review."
    );

    const pendingClaims = claims.filter((claim) => claim.status === "Pending");
    document.getElementById("pending-claims").innerHTML = table(
      ["Item", "Claimant", "Proof / contact", "Actions"],
      pendingClaims.map((claim) => {
        const item = items.find((entry) => entry.id === claim.itemId);
        const claimant = users.find((user) => user.id === claim.claimantId);
        return `<tr><td>${ui.escapeHTML(item ? item.title : "Removed item")}<br><span class="muted">${ui.escapeHTML(item ? locations.formatItemLocation(item) : "")}</span></td>
          <td>${ui.escapeHTML(claimant ? claimant.name : "Former user")}<br>${ui.escapeHTML(claimant ? claimant.email : "")}</td>
          <td>${ui.escapeHTML(claim.proof)}<br><strong>${ui.escapeHTML(claim.contact)}</strong></td>
          <td><div class="table-actions"><button class="button button-primary button-small" data-approve-claim="${ui.escapeHTML(claim.id)}">Approve</button>
          <button class="button button-danger button-small" data-reject-claim="${ui.escapeHTML(claim.id)}">Reject</button></div></td></tr>`;
      }),
      "No claim requests are waiting for review."
    );

    document.getElementById("admin-users").innerHTML = table(
      ["Name", "Email", "Student ID", "Phone", "Role"],
      users.map((user) => `<tr><td>${ui.escapeHTML(user.name)}</td><td>${ui.escapeHTML(user.email)}</td><td>${ui.escapeHTML(user.studentId)}</td><td>${ui.escapeHTML(user.phone || "—")}</td><td>${ui.escapeHTML(user.role)}</td></tr>`),
      "No users are registered."
    );

    document.getElementById("all-admin-posts").innerHTML = table(
      ["Item", "Owner", "Status", "Actions"],
      items.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => {
        const owner = users.find((user) => user.id === item.ownerId);
        return `<tr><td>${ui.escapeHTML(item.title)}<br><span class="muted">${ui.escapeHTML(item.type)} · ${ui.escapeHTML(item.category)} · ${ui.escapeHTML(locations.formatItemLocation(item))}</span></td>
          <td>${ui.escapeHTML(owner ? owner.name : "Sample item")}</td><td><span class="badge ${ui.badgeClass(item.status)}">${ui.escapeHTML(item.status)}</span></td>
          <td><button class="button button-danger button-small" data-delete-any-post="${ui.escapeHTML(item.id)}">Delete post</button></td></tr>`;
      }),
      "There are no posts."
    );

    bindActions();
  }

  function bindActions() {
    document.querySelectorAll("[data-approve-post]").forEach((button) => button.addEventListener("click", () => {
      const items = store.getItems();
      const item = items.find((entry) => entry.id === button.dataset.approvePost && entry.status === "Pending");
      if (!item) return;
      item.status = "Approved";
      item.reviewedAt = new Date().toISOString();
      try {
        store.saveItems(items);
        ui.showToast("Post approved and now visible to students.", "success");
        render();
      } catch (error) {
        ui.showToast("Could not save this decision. Browser storage may be unavailable.", "error");
      }
    }));

    document.querySelectorAll("[data-reject-post]").forEach((button) => button.addEventListener("click", () => {
      const item = store.getItems().find((entry) => entry.id === button.dataset.rejectPost && entry.status === "Pending");
      if (!item) return;
      const reason = askReason(`“${item.title}”`);
      if (reason === null) return;
      if (!reason) {
        ui.showToast("A rejection reason is required.", "error");
        return;
      }
      const items = store.getItems();
      const target = items.find((entry) => entry.id === item.id);
      target.status = "Rejected";
      target.rejectionReason = reason;
      target.reviewedAt = new Date().toISOString();
      try {
        store.saveItems(items);
        ui.showToast("Post rejected.", "success");
        render();
      } catch (error) {
        ui.showToast("Could not save this decision. Browser storage may be unavailable.", "error");
      }
    }));

    document.querySelectorAll("[data-approve-claim]").forEach((button) => button.addEventListener("click", () => {
      const claims = store.getClaims();
      const claim = claims.find((entry) => entry.id === button.dataset.approveClaim && entry.status === "Pending");
      if (!claim) return;
      const items = store.getItems();
      const item = items.find((entry) => entry.id === claim.itemId && entry.status === "Approved");
      if (!item) {
        ui.showToast("This item is no longer available for a claim decision.", "error");
        render();
        return;
      }
      claim.status = "Approved";
      claim.reviewedAt = new Date().toISOString();
      item.status = "Returned";
      item.returnedAt = new Date().toISOString();
      claims.forEach((other) => {
        if (other.itemId === item.id && other.id !== claim.id && other.status === "Pending") {
          other.status = "Rejected";
          other.rejectionReason = "Another claim for this item was approved.";
          other.reviewedAt = new Date().toISOString();
        }
      });
      try {
        store.saveItems(items);
        store.saveClaims(claims);
        ui.showToast("Claim approved; the item is marked returned.", "success");
        render();
      } catch (error) {
        ui.showToast("Could not save the claim decision. Browser storage may be unavailable.", "error");
      }
    }));

    document.querySelectorAll("[data-reject-claim]").forEach((button) => button.addEventListener("click", () => {
      const claims = store.getClaims();
      const claim = claims.find((entry) => entry.id === button.dataset.rejectClaim && entry.status === "Pending");
      if (!claim) return;
      const reason = askReason("this claim");
      if (reason === null) return;
      claim.status = "Rejected";
      claim.rejectionReason = reason;
      claim.reviewedAt = new Date().toISOString();
      try {
        store.saveClaims(claims);
        ui.showToast("Claim rejected.", "success");
        render();
      } catch (error) {
        ui.showToast("Could not save this decision. Browser storage may be unavailable.", "error");
      }
    }));

    document.querySelectorAll("[data-delete-any-post]").forEach((button) => button.addEventListener("click", () => {
      const item = store.getItems().find((entry) => entry.id === button.dataset.deleteAnyPost);
      if (!item || !window.confirm(`Permanently delete “${item.title}” and its claim requests?`)) return;
      try {
        store.saveItems(store.getItems().filter((entry) => entry.id !== item.id));
        store.saveClaims(store.getClaims().filter((claim) => claim.itemId !== item.id));
        ui.showToast("Post and related claims deleted.", "success");
        render();
      } catch (error) {
        ui.showToast("Could not delete the post. Browser storage may be unavailable.", "error");
      }
    }));
  }

  render();
})();
