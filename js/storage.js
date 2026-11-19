(() => {
  "use strict";

  const KEYS = {
    users: "campusFind.users",
    items: "campusFind.items",
    claims: "campusFind.claims",
    session: "campusFind.session"
  };

  const sampleItems = [
    { id: "sample-1", type: "Found", title: "Forest green water bottle", category: "Others", description: "Reusable bottle with a small mountain sticker on the side.", foundLocationId: "academic-building-1", keptAt: "With me", date: daysAgo(1), contact: "Campus Find desk", photo: "", icon: "🧴", ownerId: "sample-owner", status: "Approved", createdAt: daysAgo(1) },
    { id: "sample-2", type: "Lost", title: "Wireless earbuds in white case", category: "Electronics", description: "Small white charging case, possibly left near the cafe.", lostLocationIds: ["diu-cafe"], date: daysAgo(2), contact: "Campus Find desk", photo: "", icon: "🎧", ownerId: "sample-owner", status: "Approved", createdAt: daysAgo(2) },
    { id: "sample-3", type: "Found", title: "Set of two silver keys", category: "Keys", description: "Two keys on a simple blue fabric keyring.", foundLocationId: "library", keptAt: "Safety & Security Office", date: daysAgo(3), contact: "Campus Find desk", photo: "", icon: "🔑", ownerId: "sample-owner", status: "Approved", createdAt: daysAgo(3) },
    { id: "sample-4", type: "Lost", title: "Calculus textbook", category: "Books", description: "Hardcover calculus book with handwritten notes inside the front cover.", lostLocationIds: ["academic-building-3"], date: daysAgo(4), contact: "Campus Find desk", photo: "", icon: "📚", ownerId: "sample-owner", status: "Approved", createdAt: daysAgo(4) },
    { id: "sample-5", type: "Found", title: "Black card holder", category: "Wallet/Bag", description: "Slim black card holder. Owner can identify what is inside.", foundLocationId: "food-court", keptAt: "CC Control Room - Lost & Found Office", date: daysAgo(5), contact: "Campus Find desk", photo: "", icon: "👛", ownerId: "sample-owner", status: "Approved", createdAt: daysAgo(5) },
    { id: "sample-6", type: "Lost", title: "University ID card", category: "ID Card", description: "Student ID card lost near the campus entrance.", lostLocationIds: ["front-gate"], date: daysAgo(6), contact: "Campus Find desk", photo: "", icon: "🪪", ownerId: "sample-owner", status: "Approved", createdAt: daysAgo(6) },
    { id: "sample-7", type: "Found", title: "Blue sports jacket", category: "Clothing", description: "A blue jacket was left near the recreation building.", foundLocationId: "gym-building", keptAt: "With me", date: daysAgo(7), contact: "Campus Find desk", photo: "", icon: "🧥", ownerId: "sample-owner", status: "Approved", createdAt: daysAgo(7) },
    { id: "sample-8", type: "Lost", title: "Small canvas backpack", category: "Wallet/Bag", description: "A small canvas backpack with a green zipper pull.", lostLocationIds: ["yunus-khan-scholar-garden-1"], date: daysAgo(8), contact: "Campus Find desk", photo: "", icon: "🎒", ownerId: "sample-owner", status: "Approved", createdAt: daysAgo(8) }
  ];

  const keptAtOptions = ["With me", "CC Control Room - Lost & Found Office", "Safety & Security Office", "Other"];

  function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }

  function read(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`Campus Find: invalid stored data for "${key}" was reset.`, error);
      write(key, fallback);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function migrateItemLocations(items) {
    let changed = false;
    const knownIds = new Set(window.CampusLocations.getAllLocations().map((place) => place.id));
    const notSureId = window.CampusLocations.getLocationById("not-sure").id;
    const validItems = items.filter((item) => item && typeof item === "object" && !Array.isArray(item)
      && typeof item.id === "string" && typeof item.type === "string" && typeof item.status === "string"
      && typeof item.title === "string" && typeof item.date === "string" && typeof item.createdAt === "string");
    if (validItems.length !== items.length) changed = true;
    const migrated = validItems.map((item) => {
      const legacyLocation = item.location || "";
      const match = window.CampusLocations.findLocationByLegacyText(legacyLocation);
      if (item.type === "Lost") {
        const validIds = Array.isArray(item.lostLocationIds)
          ? item.lostLocationIds.filter((id) => knownIds.has(id)).slice(0, 3)
          : [];
        const lostLocationIds = validIds.length ? validIds : [match ? match.id : notSureId];
        if (JSON.stringify(item.lostLocationIds) !== JSON.stringify(lostLocationIds)) changed = true;
        return { ...item, lostLocationIds };
      }
      if (item.type === "Found") {
        const foundLocationId = knownIds.has(item.foundLocationId)
          ? item.foundLocationId
          : match ? match.id : notSureId;
        const legacyText = String(legacyLocation).toLowerCase();
        const keptAt = keptAtOptions.includes(item.keptAt)
          ? item.keptAt
          : legacyText.includes("cc control room") ? keptAtOptions[1]
            : legacyText.includes("safety & security") ? keptAtOptions[2]
              : legacyText.includes("with me") ? keptAtOptions[0]
                : "Other";
        if (item.foundLocationId !== foundLocationId || item.keptAt !== keptAt) changed = true;
        return { ...item, foundLocationId, keptAt };
      }
      return item;
    });
    if (changed) write(KEYS.items, migrated);
  }

  function seed() {
    let users = read(KEYS.users, null);
    if (!Array.isArray(users)) write(KEYS.users, [{
      id: "campus-find-admin",
      name: "Admin",
      studentId: "ADMIN",
      email: "admin@uni.edu",
      password: "admin123",
      phone: "",
      role: "admin",
      createdAt: new Date().toISOString()
    }]);
    else {
      const validUsers = users.filter((user) => user && typeof user === "object" && !Array.isArray(user)
        && typeof user.email === "string" && typeof user.studentId === "string");
      let usersChanged = validUsers.length !== users.length;
      const admin = validUsers.find((user) => user.role === "admin" && user.email.toLowerCase() === "admin@uni.edu");
      if (!admin) {
        validUsers.unshift({
          id: "campus-find-admin",
          name: "Admin",
          studentId: "ADMIN",
          email: "admin@uni.edu",
          password: "admin123",
          phone: "",
          role: "admin",
          createdAt: new Date().toISOString()
        });
        usersChanged = true;
      }
      if (admin && admin.name !== "Admin") {
        admin.name = "Admin";
        usersChanged = true;
      }
      if (usersChanged) write(KEYS.users, validUsers);
    }

    const items = read(KEYS.items, null);
    if (!Array.isArray(items)) write(KEYS.items, sampleItems);
    else migrateItemLocations(items);

    const claims = read(KEYS.claims, null);
    if (!Array.isArray(claims)) write(KEYS.claims, []);
    else {
      const validClaims = claims.filter((claim) => claim && typeof claim === "object" && !Array.isArray(claim)
        && typeof claim.id === "string" && typeof claim.itemId === "string" && typeof claim.claimantId === "string"
        && typeof claim.status === "string" && typeof claim.createdAt === "string");
      if (validClaims.length !== claims.length) write(KEYS.claims, validClaims);
    }
  }

  function getUsers() { return read(KEYS.users, []); }
  function saveUsers(users) { write(KEYS.users, users); }
  function getItems() { return read(KEYS.items, []); }
  function saveItems(items) { write(KEYS.items, items); }
  function getClaims() { return read(KEYS.claims, []); }
  function saveClaims(claims) { write(KEYS.claims, claims); }
  function getSession() { return read(KEYS.session, null); }
  function saveSession(session) { write(KEYS.session, session); }
  function clearSession() { localStorage.removeItem(KEYS.session); }

  seed();
  window.AppStore = { getUsers, saveUsers, getItems, saveItems, getClaims, saveClaims, getSession, saveSession, clearSession };
})();
