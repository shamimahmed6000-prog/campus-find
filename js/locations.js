(() => {
  "use strict";

  // Edit this file to match the real campus map.
  const definitions = [
    {
      group: "Academic Buildings",
      places: [
        { id: "academic-building-1", label: "Academic Building 1 (AB-1)", x: 8, y: 10 },
        { id: "academic-building-2", label: "Academic Building 2 (AB-2)", x: 22, y: 10 },
        { id: "academic-building-3", label: "Academic Building 3 (AB-3)", x: 36, y: 10 },
        { id: "academic-building-4", label: "Academic Building 4 (AB-4)", x: 50, y: 10 },
        { id: "knowledge-tower", label: "Knowledge Tower", x: 64, y: 10 },
        { id: "inspiration-building", label: "Inspiration Building", x: 78, y: 10 },
        { id: "knowledge-valley", label: "Knowledge Valley", x: 92, y: 10 }
      ]
    },
    {
      group: "Offices & Services",
      places: [
        { id: "safety-security-office", label: "Safety & Security Office", detail: "Knowledge Tower, Ground floor", x: 8, y: 22 },
        { id: "cc-control-room-lost-found-office", label: "CC Control Room - Lost & Found Office", detail: "Knowledge Tower, Ground floor", x: 22, y: 22 },
        { id: "career-development-centre", label: "Career Development Centre", detail: "Knowledge Tower, Level 1", x: 36, y: 22 },
        { id: "examination-office", label: "Examination Office", detail: "Inspiration Building, Level 2", x: 50, y: 22 },
        { id: "admission-building", label: "Admission Building", x: 64, y: 22 },
        { id: "counselling-office", label: "Counselling Office", x: 78, y: 22 },
        { id: "diu-medical-center", label: "DIU Medical Center", detail: "GYM Building, Level 1", x: 92, y: 22 },
        { id: "day-care-center", label: "Day Care Center", x: 8, y: 34 },
        { id: "daffodil-islamic-center", label: "Daffodil Islamic Center", x: 22, y: 34 },
        { id: "library", label: "Library", verified: false, x: 36, y: 34 } // verify exact name/location
      ]
    },
    {
      group: "Food",
      places: [
        { id: "food-court", label: "Food Court", x: 50, y: 34 },
        { id: "diu-cafe", label: "DIU Cafe", x: 64, y: 34 },
        { id: "green-garden-1", label: "Green Garden 1", x: 78, y: 34 },
        { id: "green-garden-2", label: "Green Garden 2", detail: "Engineering campus", x: 92, y: 34 },
        { id: "hall-dining", label: "Hall Dining", x: 8, y: 46 }
      ]
    },
    {
      group: "Residential Halls",
      places: [
        { id: "yunus-khan-scholar-garden-1", label: "Yunus Khan Scholar Garden-1", x: 22, y: 46 },
        { id: "yunus-khan-scholar-garden-2", label: "Yunus Khan Scholar Garden-2", x: 36, y: 46 },
        { id: "yunus-khan-scholar-garden-3", label: "Yunus Khan Scholar Garden-3", x: 50, y: 46 },
        { id: "rowshan-ara-scholar-garden-1", label: "Rowshan Ara Scholar Garden-1", x: 64, y: 46 },
        { id: "rowshan-ara-scholar-garden-2", label: "Rowshan Ara Scholar Garden-2", x: 78, y: 46 }
      ]
    },
    {
      group: "Outdoor & Recreation",
      places: [
        { id: "central-field", label: "Central Field", x: 92, y: 46 },
        { id: "gym-building", label: "GYM Building", x: 8, y: 58 },
        { id: "bonomaya-01", label: "Bonomaya 01", x: 22, y: 58 },
        { id: "bonomaya-02", label: "Bonomaya 02", x: 36, y: 58 },
        { id: "dsc-lake", label: "DSC Lake", x: 50, y: 58 },
        { id: "mosque", label: "Mosque", verified: false, x: 64, y: 58 } // verify exact name/location
      ]
    },
    {
      group: "Gates & Transport",
      places: [
        { id: "front-gate", label: "Front Gate", x: 78, y: 58 },
        { id: "gate-2", label: "Gate 2", x: 92, y: 58 },
        { id: "gate-3", label: "Gate 3", x: 8, y: 70 },
        { id: "transport-shed", label: "Transport Shed", x: 22, y: 70 }
      ]
    },
    {
      group: "Others",
      places: [
        { id: "corridor-lift-washroom", label: "Corridor / Lift / Washroom", x: 36, y: 70 },
        { id: "on-the-way-in-a-bus", label: "On the way / In a bus", x: 50, y: 70 },
        { id: "outside-campus", label: "Outside campus", x: 64, y: 70 },
        { id: "not-sure", label: "Not sure", x: 78, y: 70 }
      ]
    }
  ];

  const LOCATION_GROUPS = definitions.map((definition) => ({
    group: definition.group,
    places: definition.places.map((place) => ({ ...place, group: definition.group }))
  }));
  const allLocations = LOCATION_GROUPS.flatMap((group) => group.places);

  function getAllLocations() {
    return allLocations;
  }

  function getLocationById(id) {
    return allLocations.find((place) => place.id === id) || null;
  }

  function getLocationLabel(id) {
    const place = getLocationById(id);
    return place ? place.label : "";
  }

  function getGroups() {
    return LOCATION_GROUPS;
  }

  function formatLocation(place) {
    return place ? `${place.label}${place.detail ? ` (${place.detail})` : ""}` : "";
  }

  function findLocationByLegacyText(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return null;
    return allLocations.find((place) => {
      const label = place.label.toLowerCase();
      return text.includes(label) || label.includes(text);
    }) || null;
  }

  function formatItemLocation(item) {
    if (!item) return "";
    if (item.type === "Lost") {
      const labels = Array.isArray(item.lostLocationIds)
        ? item.lostLocationIds.map((id) => formatLocation(getLocationById(id))).filter(Boolean)
        : [];
      return `Lost at ${labels.length ? labels.join(", ") : (item.location || getLocationLabel("not-sure"))}`;
    }
    if (item.type === "Found") {
      const place = formatLocation(getLocationById(item.foundLocationId)) || item.location || getLocationLabel("not-sure");
      const keptAtPlace = allLocations.find((location) => location.label === item.keptAt);
      const keptAt = keptAtPlace ? formatLocation(keptAtPlace) : item.keptAt;
      return `Found at ${place}${keptAt ? ` · Kept at ${keptAt}` : ""}`;
    }
    return item.location || getLocationLabel("not-sure");
  }

  window.CampusLocations = {
    groups: LOCATION_GROUPS,
    getAllLocations,
    getLocationById,
    getLocationLabel,
    getGroups,
    findLocationByLegacyText,
    formatItemLocation
  };
})();
