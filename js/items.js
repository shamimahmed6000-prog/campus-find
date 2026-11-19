(() => {
  "use strict";

  const store = window.AppStore;
  const ui = window.AppUI;
  const locations = window.CampusLocations;
  const categories = ["Electronics", "ID Card", "Books", "Clothing", "Keys", "Wallet/Bag", "Others"];
  const icons = { Electronics: "🎧", "ID Card": "🪪", Books: "📚", Clothing: "🧥", Keys: "🔑", "Wallet/Bag": "🎒", Others: "📦" };
  const MAX_LOST_LOCATIONS = 3;

  function getPublicItems() {
    return store.getItems().filter((item) => item.status === "Approved");
  }

  function mediaMarkup(item) {
    const alt = ui.escapeHTML(item.title || "Item photo");
    if (item.photo) return `<div class="item-image"><img src="${ui.escapeHTML(item.photo)}" alt="${alt}"></div>`;
    return `<div class="item-image" role="img" aria-label="${alt}"><span class="emoji-image" aria-hidden="true">${ui.escapeHTML(item.icon || icons[item.category] || "📦")}</span></div>`;
  }

  function cardMarkup(item) {
    const locationText = locations.formatItemLocation(item);
    return `<article class="item-card"><a class="item-card-link" href="item-details.html?id=${encodeURIComponent(item.id)}">
      ${mediaMarkup(item)}<div class="item-card-content"><div class="item-card-top">
      <span class="badge ${ui.badgeClass(item.type)}">${ui.escapeHTML(item.type)}</span><span class="badge">${ui.escapeHTML(item.category)}</span></div>
      <h3>${ui.escapeHTML(item.title)}</h3><div class="item-card-meta"><span>${ui.escapeHTML(locationText)}</span><span>${ui.escapeHTML(ui.formatDate(item.date))}</span></div></div></a></article>`;
  }

  function renderItems(container, items) {
    if (!container) return;
    container.innerHTML = items.map(cardMarkup).join("");
  }

  function groupedOptionsMarkup() {
    return locations.getGroups().map((group) => `<optgroup label="${ui.escapeHTML(group.group)}">${group.places.map((place) =>
      `<option value="${ui.escapeHTML(place.id)}">${ui.escapeHTML(place.label)}</option>`).join("")}</optgroup>`).join("");
  }

  function populateLocationSelect(select) {
    if (!select) return;
    const firstOption = select.querySelector("option");
    const placeholder = firstOption && !firstOption.parentElement.matches("optgroup") ? firstOption.outerHTML : "";
    select.innerHTML = `${placeholder}${groupedOptionsMarkup()}`;
  }

  function initializeHome() {
    const recent = document.getElementById("recent-items");
    if (recent) renderItems(recent, getPublicItems().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3));
    const form = document.getElementById("quick-search-form");
    if (form) form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = document.getElementById("quick-search-input").value.trim();
      window.location.href = `items.html${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    });
  }

  function initializeBrowse() {
    const container = document.getElementById("all-items");
    if (!container) return;
    const fields = {
      search: document.getElementById("item-search"),
      type: document.getElementById("filter-type"),
      category: document.getElementById("filter-category"),
      location: document.getElementById("filter-location"),
      from: document.getElementById("filter-from"),
      to: document.getElementById("filter-to"),
      sort: document.getElementById("filter-sort")
    };
    populateLocationSelect(fields.location);
    const params = new URLSearchParams(window.location.search);
    fields.search.value = params.get("q") || "";
    const requestedLocation = locations.getLocationById((params.get("location") || "").trim());
    if (requestedLocation) fields.location.value = requestedLocation.id;
    const filterPanel = document.getElementById("item-filter-panel");
    const filterToggle = document.getElementById("filters-toggle");
    const initialFilterIsSet = Boolean(params.get("q") || requestedLocation);
    if (initialFilterIsSet) {
      filterPanel.classList.add("is-open");
      filterToggle.setAttribute("aria-expanded", "true");
    }
    filterToggle.addEventListener("click", () => {
      const open = filterPanel.classList.toggle("is-open");
      filterToggle.setAttribute("aria-expanded", String(open));
    });

    function update() {
      const query = fields.search.value.trim().toLowerCase();
      const location = fields.location.value.trim().toLowerCase();
      const from = fields.from.value;
      const to = fields.to.value;
      let items = getPublicItems().filter((item) => {
        const searchable = `${item.title} ${item.description} ${locations.formatItemLocation(item)}`.toLowerCase();
        const matchesLocation = !location || (item.type === "Lost"
          ? Array.isArray(item.lostLocationIds) && item.lostLocationIds.includes(location)
          : item.foundLocationId === location);
        return (!query || searchable.includes(query))
          && (!fields.type.value || item.type === fields.type.value)
          && (!fields.category.value || item.category === fields.category.value)
          && matchesLocation
          && (!from || item.date >= from)
          && (!to || item.date <= to);
      });
      items.sort((a, b) => {
        const delta = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return fields.sort.value === "oldest" ? -delta : delta;
      });
      renderItems(container, items);
      document.getElementById("items-empty").hidden = items.length > 0;
      document.getElementById("results-count").textContent = `${items.length} ${items.length === 1 ? "item" : "items"} found`;
    }

    Object.values(fields).forEach((field) => field.addEventListener(field.tagName === "SELECT" || field.type === "date" ? "change" : "input", update));
    document.getElementById("clear-filters").addEventListener("click", () => {
      fields.search.value = "";
      fields.type.value = "";
      fields.category.value = "";
      fields.location.value = "";
      fields.from.value = "";
      fields.to.value = "";
      fields.sort.value = "newest";
      window.history.replaceState(null, "", window.location.pathname);
      update();
    });
    update();
  }

  function initializePostForm() {
    const form = document.getElementById("post-item-form");
    if (!form) return;
    const user = window.AppAuth.getCurrentUser();
    if (!user) return;
    const errorBox = document.getElementById("post-error");
    const photoInput = document.getElementById("post-photo");
    const preview = document.getElementById("photo-preview");
    const typeSelect = document.getElementById("post-type");
    const lostFieldset = document.getElementById("lost-location-fields");
    const lostSelect = document.getElementById("post-lost-locations");
    const lostCounter = document.getElementById("lost-location-counter");
    const lostChips = document.getElementById("lost-location-chips");
    const lostFeedback = document.getElementById("lost-location-feedback");
    const foundFieldset = document.getElementById("found-location-fields");
    const foundSelect = document.getElementById("post-found-location");
    const keptAtSelect = document.getElementById("post-kept-at");
    const foundDetail = document.getElementById("found-location-detail");
    const keptAtDetail = document.getElementById("kept-at-detail");
    const editId = new URLSearchParams(window.location.search).get("id");
    const currentItem = editId ? store.getItems().find((item) => item.id === editId) : null;
    let photoData = currentItem ? currentItem.photo || "" : "";
    populateLocationSelect(lostSelect);
    populateLocationSelect(foundSelect);
    if (editId && (!currentItem || currentItem.ownerId !== user.id || currentItem.status !== "Pending")) {
      errorBox.textContent = "This post cannot be edited.";
      errorBox.hidden = false;
      Array.from(form.elements).forEach((element) => { element.disabled = true; });
      return;
    }

    function selectedLostLocationIds() {
      return Array.from(lostSelect.selectedOptions, (option) => option.value);
    }

    function renderLostChips() {
      const selectedIds = selectedLostLocationIds();
      lostCounter.textContent = `${selectedIds.length}/${MAX_LOST_LOCATIONS}`;
      lostChips.innerHTML = selectedIds.map((id) => {
        const label = locations.getLocationLabel(id);
        return `<button class="location-chip" type="button" data-remove-location="${ui.escapeHTML(id)}" aria-label="Remove ${ui.escapeHTML(label)}">${ui.escapeHTML(label)} <span aria-hidden="true">×</span></button>`;
      }).join("");
      lostChips.querySelectorAll("[data-remove-location]").forEach((button) => button.addEventListener("click", () => {
        const option = Array.from(lostSelect.options).find((entry) => entry.value === button.dataset.removeLocation);
        if (option) option.selected = false;
        lastLostSelection = selectedLostLocationIds();
        lostFeedback.textContent = "";
        renderLostChips();
      }));
    }

    function updateTypeFields() {
      const isLost = typeSelect.value === "Lost";
      lostFieldset.hidden = !isLost;
      lostFieldset.disabled = !isLost;
      foundFieldset.hidden = !typeSelect.value || isLost;
      foundFieldset.disabled = !typeSelect.value || isLost;
    }

    function updatePlaceDetails() {
      const foundPlace = locations.getLocationById(foundSelect.value);
      foundDetail.textContent = foundPlace && foundPlace.detail ? `Location detail: ${foundPlace.detail}` : "";
      foundDetail.hidden = !foundPlace || !foundPlace.detail;

      const keptPlace = locations.getAllLocations().find((place) => place.label === keptAtSelect.value);
      keptAtDetail.textContent = keptPlace && keptPlace.detail ? `Location detail: ${keptPlace.detail}` : "";
      keptAtDetail.hidden = !keptPlace || !keptPlace.detail;
    }

    let lastLostSelection = [];
    lostSelect.addEventListener("change", () => {
      let selectedIds = selectedLostLocationIds();
      if (selectedIds.length > MAX_LOST_LOCATIONS) {
        const newlySelected = selectedIds.find((id) => !lastLostSelection.includes(id));
        const option = Array.from(lostSelect.options).find((entry) => entry.value === newlySelected);
        if (option) option.selected = false;
        lostFeedback.textContent = "You can choose up to 3 places.";
        selectedIds = selectedLostLocationIds();
      } else {
        lostFeedback.textContent = "";
      }
      lastLostSelection = selectedIds;
      renderLostChips();
    });
    foundSelect.addEventListener("change", updatePlaceDetails);
    keptAtSelect.addEventListener("change", updatePlaceDetails);

    if (currentItem) {
      document.getElementById("post-page-title").textContent = "Edit your post";
      typeSelect.value = currentItem.type;
      document.getElementById("post-category").value = currentItem.category;
      document.getElementById("post-title").value = currentItem.title;
      document.getElementById("post-description").value = currentItem.description;
      (currentItem.lostLocationIds || []).forEach((id) => {
        const option = Array.from(lostSelect.options).find((entry) => entry.value === id);
        if (option) option.selected = true;
      });
      foundSelect.value = currentItem.foundLocationId || "";
      keptAtSelect.value = currentItem.keptAt || "";
      document.getElementById("post-last-seen-time").value = currentItem.lastSeenTime || "";
      document.getElementById("post-date").value = currentItem.date;
      document.getElementById("post-contact").value = currentItem.contact;
      document.querySelector("#post-item-form button[type=submit]").textContent = "Save changes";
      if (photoData) {
        preview.src = photoData;
        preview.hidden = false;
      }
    }
    lastLostSelection = selectedLostLocationIds();
    typeSelect.addEventListener("change", updateTypeFields);
    updateTypeFields();
    renderLostChips();
    updatePlaceDetails();

    photoInput.addEventListener("change", () => {
      errorBox.hidden = true;
      const file = photoInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        photoInput.value = "";
        errorBox.textContent = "Please choose an image file.";
        errorBox.hidden = false;
        return;
      }
      if (file.size > 1024 * 1024) {
        photoInput.value = "";
        errorBox.textContent = "The selected image is larger than 1 MB.";
        errorBox.hidden = false;
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        photoData = String(reader.result);
        preview.src = photoData;
        preview.hidden = false;
      });
      reader.addEventListener("error", () => {
        errorBox.textContent = "The image could not be read. Please try another file.";
        errorBox.hidden = false;
      });
      reader.readAsDataURL(file);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      errorBox.hidden = true;
      if (!form.reportValidity()) return;
      const type = document.getElementById("post-type").value;
      const category = document.getElementById("post-category").value;
      const title = document.getElementById("post-title").value.trim();
      const description = document.getElementById("post-description").value.trim();
      const date = document.getElementById("post-date").value;
      const contact = document.getElementById("post-contact").value.trim();
      const lostLocationIds = selectedLostLocationIds();
      const foundLocationId = foundSelect.value;
      const keptAt = keptAtSelect.value;
      const today = new Date().toISOString().slice(0, 10);
      if (!["Lost", "Found"].includes(type) || !categories.includes(category) || !title || !description || !date || !contact
        || (type === "Lost" && (lostLocationIds.length < 1 || lostLocationIds.length > MAX_LOST_LOCATIONS || lostLocationIds.some((id) => !locations.getLocationById(id))))
        || (type === "Found" && (!locations.getLocationById(foundLocationId) || !["With me", "CC Control Room - Lost & Found Office", "Safety & Security Office", "Other"].includes(keptAt)))) {
        errorBox.textContent = "Please complete all required fields.";
        errorBox.hidden = false;
        return;
      }
      if (date > today) {
        errorBox.textContent = "Date lost/found cannot be in the future.";
        errorBox.hidden = false;
        return;
      }
      if (!/^[+()\d.\-\s]{7,30}$/.test(contact)) {
        errorBox.textContent = "Enter a valid contact phone number.";
        errorBox.hidden = false;
        return;
      }
      const items = store.getItems();
      const item = {
        ...(currentItem || {}),
        id: currentItem ? currentItem.id : window.AppAuth.makeId(),
        type, category, title, description, date, contact,
        photo: photoData,
        icon: icons[category] || "📦",
        ownerId: user.id,
        status: "Pending",
        createdAt: currentItem ? currentItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      delete item.location;
      if (type === "Lost") {
        item.lostLocationIds = lostLocationIds;
        item.lastSeenTime = document.getElementById("post-last-seen-time").value;
        delete item.foundLocationId;
        delete item.keptAt;
      } else {
        item.foundLocationId = foundLocationId;
        item.keptAt = keptAt;
        delete item.lostLocationIds;
        delete item.lastSeenTime;
      }
      if (currentItem) {
        const index = items.findIndex((entry) => entry.id === currentItem.id);
        items[index] = item;
      } else {
        items.unshift(item);
      }
      try {
        store.saveItems(items);
        window.AppUI.showToast(currentItem ? "Your post was updated and is pending review." : "Your item was submitted for review.", "success");
        window.location.href = "my-dashboard.html";
      } catch (error) {
        errorBox.textContent = "Could not save your post. Browser storage may be full.";
        errorBox.hidden = false;
      }
    });
  }

  function initializeDashboardPosts() {
    const panel = document.getElementById("dashboard-posts");
    if (!panel) return;
    const user = window.AppAuth.getCurrentUser();
    if (!user) return;
    function render() {
      const posts = store.getItems().filter((item) => item.ownerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      panel.innerHTML = posts.length ? `<div class="dashboard-list">${posts.map((item) => {
        const mayEdit = item.status === "Pending";
        return `<article class="dashboard-row"><div class="dashboard-row-main"><h3>${ui.escapeHTML(item.title)}</h3>
          <p>${ui.escapeHTML(item.type)} · ${ui.escapeHTML(item.category)} · ${ui.escapeHTML(locations.formatItemLocation(item))}</p>
          <p>Posted ${ui.escapeHTML(ui.formatDate(item.createdAt))}</p>
          ${item.rejectionReason ? `<p class="proof-box">Review note: ${ui.escapeHTML(item.rejectionReason)}</p>` : ""}
          </div><div class="row-actions"><span class="badge ${ui.badgeClass(item.status)}">${ui.escapeHTML(item.status)}</span>
          ${mayEdit ? `<a class="button button-outline button-small" href="post-item.html?id=${encodeURIComponent(item.id)}">Edit</a><button class="button button-danger button-small" type="button" data-delete-post="${ui.escapeHTML(item.id)}">Delete</button>` : ""}</div></article>`;
      }).join("")}</div>` : `<div class="empty-state"><h2>No posts yet</h2><p>Your submitted items will appear here.</p><a class="button button-primary" href="post-item.html">Post an item</a></div>`;
      panel.querySelectorAll("[data-delete-post]").forEach((button) => button.addEventListener("click", () => {
        if (!window.confirm("Delete this pending post?")) return;
        const updated = store.getItems().filter((item) => item.id !== button.dataset.deletePost || item.ownerId !== user.id);
        try {
          store.saveItems(updated);
          render();
          window.AppUI.showToast("Post deleted.", "success");
        } catch (error) {
          window.AppUI.showToast("Could not delete the post. Browser storage may be unavailable.", "error");
        }
      }));
    }
    render();
  }

  function initializeDashboardTabs() {
    const tabs = document.querySelectorAll(".dashboard-tab");
    if (!tabs.length) return;
    const panels = {
      posts: document.getElementById("dashboard-posts"),
      claims: document.getElementById("dashboard-claims"),
      received: document.getElementById("dashboard-received")
    };
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      tabs.forEach((entry) => {
        const selected = entry === tab;
        entry.classList.toggle("active", selected);
        entry.setAttribute("aria-selected", String(selected));
      });
      Object.entries(panels).forEach(([name, panel]) => { panel.hidden = name !== tab.dataset.tab; });
      window.dispatchEvent(new CustomEvent("campusfind:dashboard-tab", { detail: { tab: tab.dataset.tab } }));
    }));
  }

  initializeHome();
  initializeBrowse();
  initializePostForm();
  initializeDashboardPosts();
  initializeDashboardTabs();

  window.AppItems = { getPublicItems, cardMarkup, renderItems };
})();
