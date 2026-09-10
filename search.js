const searchPageInput = document.getElementById("searchPageInput");
const searchPageButton = document.getElementById("searchPageButton");

const amenityButtons = document.querySelectorAll("[data-amenity]");

let selectedAmenities = new Set();

const openNowFilter = document.getElementById("openNowFilter");

let openNowActive = false;

const filterChips = document.querySelectorAll(".filter-chip");

let activeFilter = "all";

const zoneFilterButton = document.getElementById("zoneFilterButton");
const zoneFilterMenu = document.getElementById("zoneFilterMenu");
const zoneOptions = document.querySelectorAll("[data-zone]");

let selectedZone = "all";

const priceFilterButton = document.getElementById("priceFilterButton");
const priceFilterMenu = document.getElementById("priceFilterMenu");
const priceOptions = document.querySelectorAll("[data-price]");

let selectedPrice = "all";

const nearbyCafes = document.getElementById("nearbyCafes");
const recommendedCafes = document.getElementById("recommendedCafes");

const nearbySection = document.getElementById("nearbySection");
const recommendedSection = document.getElementById(
  "recommendedSection"
  );
  
const locationButton = document.getElementById("locationButton");

let userLocation = null;
let cafesMap = null;
let cafeMarkers = [];
const cafeMarkerMap = new Map();
let userMarker = null;

const mobileMapToggle =
  document.getElementById("mobileMapToggle");

const searchMapPanel =
  document.querySelector(".search-map-panel");

const searchIntro = document.getElementById("searchIntro");

const mapOriginalParent =
  searchMapPanel?.parentElement;

const searchResultsSection = document.getElementById(
  "searchResultsSection"
);

const searchResultsGrid = document.getElementById(
  "searchResultsGrid"
);

const searchResultsTitle = document.getElementById(
  "searchResultsTitle"
);

const searchResultsCount = document.getElementById(
  "searchResultsCount"
);

const backToResultsButton =
  document.getElementById("backToResultsButton");

let allCafes = [];

const searchParams = new URLSearchParams(window.location.search);

const initialZone = searchParams.get("zone") || "";

const initialConcepts = (searchParams.get("concept") || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const initialPrice = searchParams.get("price") || "";

/* =========================
   Load cafés
========================= */

async function loadSearchCafes() {
  try {
    const response = await fetch("cafes.json");

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const cafes = await response.json();

    allCafes = cafes.filter((cafe) => cafe.name);

    initializeMap();

  if (
  initialZone ||
  initialConcepts.length > 0 ||
  initialPrice
) {
  renderFilteredResults();
} else {
  renderInitialSections();
}
    } catch (error) {
    console.error("Error cargando cafés:", error);
  }
}

function initializeMap() {
  const mapElement = document.getElementById("cafesMap");

  if (!mapElement || cafesMap) return;

  cafesMap = L.map("cafesMap").setView(
    [10.4895, -66.8750],
    13
  );

  L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 16,
    attribution:
      "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, FAO, NOAA, USGS"
  }
).addTo(cafesMap);

  renderMapCafes(allCafes);
}

function refreshMapLayout() {
  if (!cafesMap) return;

  cafesMap.invalidateSize({
    pan: false
  });
}

function resetMapView() {
  if (!cafesMap) return;

  cafesMap.closePopup();

  if (userLocation) {
    cafesMap.flyTo(
      [
        userLocation.latitude,
        userLocation.longitude
      ],
      13,
      {
        animate: true,
        duration: 0.7
      }
    );

    return;
  }

  cafesMap.flyTo(
    [10.4895, -66.8750],
    13,
    {
      animate: true,
      duration: 0.7
    }
  );
}

function renderMapCafes(cafes) {
  if (!cafesMap) return;

  cafeMarkers.forEach((marker) => {
    cafesMap.removeLayer(marker);
  });

  cafeMarkers = [];
  cafeMarkerMap.clear();

  const cafesWithCoordinates = cafes.filter(
    (cafe) =>
      typeof cafe.latitude === "number" &&
      typeof cafe.longitude === "number"
  );

  console.log(
    "Cafés recibidos:",
    cafes.length,
    "Cafés con coordenadas:",
    cafesWithCoordinates.length
  );

  cafesWithCoordinates.forEach((cafe) => {
    const cafeIcon = L.divIcon({
      className: "cafe-map-marker-wrapper",
      html: `
        <div class="cafe-map-marker">
          <span>☕</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -36]
    });

    const marker = L.marker(
      [
        cafe.latitude,
        cafe.longitude
      ],
      {
        icon: cafeIcon
      }
    );

    marker.on("click", () => {
      showCafeFromMap(cafe);

      cafesMap.flyTo(
        [
          cafe.latitude,
          cafe.longitude
        ],
        16,
        {
          animate: true,
          duration: 0.7
        }
      );
    });

    marker.bindPopup(`
      <strong>${cafe.name}</strong><br>
      ${cafe.zone || "Caracas"}<br>
      ⭐ ${cafe.rate || "Por verificar"}
    `);

    marker.addTo(cafesMap);

    cafeMarkers.push(marker);
    cafeMarkerMap.set(cafe.name, marker);
  });

  if (cafesWithCoordinates.length === 1) {
    cafesMap.setView(
      [
        cafesWithCoordinates[0].latitude,
        cafesWithCoordinates[0].longitude
      ],
      16
    );

  } else if (userLocation) {
    cafesMap.setView(
      [
        userLocation.latitude,
        userLocation.longitude
      ],
      14
    );

  } else if (cafesWithCoordinates.length > 1) {
    const bounds = L.latLngBounds(
      cafesWithCoordinates.map((cafe) => [
        cafe.latitude,
        cafe.longitude
      ])
    );

    cafesMap.fitBounds(
  bounds,
  {
    padding: [45, 45],
    maxZoom: 12
  }
);
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const toRadians = (degrees) =>
    degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

function renderNearbyCafes() {
  if (!userLocation) return;

  const cafesWithDistance = allCafes
    .filter(
      (cafe) =>
        typeof cafe.latitude === "number" &&
        typeof cafe.longitude === "number"
    )
    .map((cafe) => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        cafe.latitude,
        cafe.longitude
      );

      return {
        ...cafe,
        distance
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);

  renderCards(cafesWithDistance, nearbyCafes);
  renderMapCafes(allCafes);
}

function renderInitialSections() {
  searchIntro.hidden = false;
  nearbySection.hidden = false;
  recommendedSection.hidden = false;
  searchResultsSection.hidden = true;

nearbyCafes.innerHTML = "";

  const recommendedSelection = [...allCafes]
    .sort(
      (a, b) =>
        Number(b.rate || 0) - Number(a.rate || 0)
    )
    .slice(0, 8);

  renderCards(recommendedSelection, recommendedCafes);
}

/* =========================
   Initial page content
========================= */
function parseCafePrice(value) {
  const text = String(value || "").toLowerCase().trim();

  if (
    !text ||
    text.includes("averiguar") ||
    text.includes("por verificar")
  ) {
    return {
      min: null,
      max: null,
      unknown: true
    };
  }

  const numbers = text.match(/\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length === 0) {
    return {
      min: null,
      max: null,
      unknown: true
    };
  }

  const min = Number(numbers[0]);
  const max = numbers[1] ? Number(numbers[1]) : min;

  return {
    min,
    max,
    unknown: false
  };
}

function matchesPriceFilter(cafe, priceFilter) {
  if (!priceFilter) {
    return true;
  }

  const price = parseCafePrice(cafe.cost);

  if (priceFilter === "unknown") {
    return price.unknown;
  }

  if (price.unknown) {
    return false;
  }

  if (priceFilter === "0-10") {
    return price.min <= 10;
  }

  if (priceFilter === "10-20") {
    return price.max >= 10 && price.min <= 20;
  }

  if (priceFilter === "20-30") {
    return price.max >= 20 && price.min <= 30;
  }

  if (priceFilter === "30-plus") {
    return price.max > 30;
  }

  return true;
}

function applyFilters(cafes, filters) {
  const normalizedZone = normalizeText(filters.zone);

  const normalizedConcepts = filters.concepts.map((concept) =>
    normalizeText(concept)
  );

  return cafes.filter((cafe) => {
    const cafeZone = normalizeText(cafe.zone);

    const searchableText = normalizeText(
      [
        cafe.name,
        cafe.category,
        cafe.notes,
        cafe.zone,
        cafe.municipality,
        cafe.branch
      ]
        .filter(Boolean)
        .join(" ")
    );

    const matchesZone =
      !normalizedZone ||
      cafeZone === normalizedZone ||
      cafeZone.includes(normalizedZone);

    const matchesConcepts =
  normalizedConcepts.length === 0 ||
  normalizedConcepts.every((concept) => {
    if (concept === "coworking") {
      return cafe.amenities?.coworking === true;
    }

    if (concept === "cozy") {
      return cafe.amenities?.cozy === true;
    }

    if (concept === "sightseeing") {
      return cafe.amenities?.sightseeing === true;
    }

    return searchableText.includes(concept);
  });

    const matchesPrice = matchesPriceFilter(
      cafe,
      filters.price
    );

    return (
      matchesZone &&
      matchesConcepts &&
      matchesPrice
    );
  });
}

function renderFilteredResults() {
  const results = applyFilters(allCafes, {
    zone: initialZone,
    concepts: initialConcepts,
    price: initialPrice
  });

  searchIntro.hidden = true;

  searchResultsSection.hidden = false;

  const labels = [];

  if (initialZone) {
    labels.push(initialZone);
  }

  if (initialConcepts.length > 0) {
    labels.push(initialConcepts.join(", "));
  }

  if (initialPrice) {
    labels.push(initialPrice);
  }

  searchResultsTitle.textContent = labels.length
    ? `Resultados para ${labels.join(" · ")}`
    : "Resultados de búsqueda";

  searchResultsCount.textContent =
    `${results.length} ${
      results.length === 1 ? "café" : "cafés"
    }`;

  nearbySection.hidden = true;
  recommendedSection.hidden = true;
  searchResultsSection.hidden = false;

  renderCards(results, searchResultsGrid);
  renderMapCafes(results);
}

/* =========================
   Search
========================= */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getMinimumPrice(cost) {
  if (!cost) return 9999;

  const match = String(cost).match(/\d+/);

  if (!match) return 9999;

  return Number(match[0]);
}
function cafeMatchesZone(cafe, selectedZone) {
  if (!selectedZone || selectedZone === "all") {
    return true;
  }

  const zone = normalizeText(cafe.zone || "");

  const zoneParts = zone
    .split(/[\s-]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (selectedZone === "varias") {
    const zonesFound = ["este", "centro", "oeste"]
      .filter((item) => zoneParts.includes(item));

    return zonesFound.length > 1 || zone.includes("varias");
  }

  return zoneParts.includes(selectedZone);
}

function cafeMatchesPrice(cafe, selectedPrice) {
  if (!selectedPrice || selectedPrice === "all") {
    return true;
  }

  const cost = String(cafe.cost || "").toLowerCase();

  if (
    !cost ||
    cost.includes("averiguar") ||
    cost.includes("verificar")
  ) {
    return selectedPrice === "unknown";
  }

  const match = cost.match(/\d+/);

  if (!match) {
    return selectedPrice === "unknown";
  }

  const minPrice = Number(match[0]);

  if (selectedPrice === "low") {
    return minPrice <= 10;
  }

  if (selectedPrice === "medium") {
    return minPrice > 10 && minPrice <= 20;
  }

  if (selectedPrice === "high") {
    return minPrice > 20;
  }

  return true;
}

function isCafeOpenNow(cafe) {
  if (!cafe.hours) return false;

  const caracasNow = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Caracas"
    })
  );

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];

  const today = days[caracasNow.getDay()];
  const schedule = cafe.hours[today];

  if (!schedule || schedule.closed === true) {
    return false;
  }

  if (!schedule.open || !schedule.close) {
    return false;
  }

  const currentMinutes =
    caracasNow.getHours() * 60 +
    caracasNow.getMinutes();

  const [openHour, openMinute] =
    schedule.open.split(":").map(Number);

  const [closeHour, closeMinute] =
    schedule.close.split(":").map(Number);

  const openMinutes =
    openHour * 60 + openMinute;

  const closeMinutes =
    closeHour * 60 + closeMinute;

  // Horarios normales, por ejemplo 08:00 → 20:00
  if (closeMinutes > openMinutes) {
    return (
      currentMinutes >= openMinutes &&
      currentMinutes < closeMinutes
    );
  }

  // Horarios que pasan medianoche, por ejemplo 17:00 → 02:00
  return (
    currentMinutes >= openMinutes ||
    currentMinutes < closeMinutes
  );
}

function runSearch() {
  searchResultsGrid.classList.add("is-updating");
  const rawQuery = searchPageInput.value.trim();
  const query = normalizeText(rawQuery);

  let results = [...allCafes];

  // ==========================
// PRICE FILTER
// ==========================

if (selectedPrice !== "all") {
  results = results.filter((cafe) =>
    cafeMatchesPrice(cafe, selectedPrice)
  );
}

// ============================
// AMENITIES FILTER
// ============================

if (selectedAmenities.size > 0) {
  results = results.filter((cafe) => {
    return [...selectedAmenities].every((amenity) => {
      return cafe.amenities?.[amenity] === true;
    });
  });
}

// ============================
// OPEN NOW FILTER
// ============================

if (openNowActive) {
  results = results.filter((cafe) =>
    isCafeOpenNow(cafe)
  );
}

  // ============================
  // TEXT SEARCH
  // ============================

  if (query) {
    results = results.filter((cafe) => {
      const searchableText = normalizeText(
        [
          cafe.name,
          cafe.brand,
          cafe.branch,
          cafe.municipality,
          cafe.zone,
          cafe.category,
          cafe.notes,
          cafe.cost
        ]
          .filter(Boolean)
          .join(" ")
      );

      return searchableText.includes(query);
    });
  }

  // ============================
  // FILTERS
  // ============================

  if (selectedZone !== "all") {
  results = results.filter((cafe) =>
    cafeMatchesZone(cafe, selectedZone)
  );
}

  if (activeFilter === "price") {
    results.sort((a, b) => {
      return getMinimumPrice(a.cost) - getMinimumPrice(b.cost);
    });
  }

  // ============================
  // INITIAL / RESULT STATE
  // ============================

  if (
  !query &&
  activeFilter === "all" &&
  selectedZone === "all" &&
  selectedPrice === "all" &&
  selectedAmenities.size === 0 && 
  !openNowActive
) {
    searchResultsSection.hidden = true;
    nearbySection.hidden = false;
    recommendedSection.hidden = false;

    renderMapCafes(allCafes);

    searchResultsGrid.classList.remove("is-updating");

    return;
  }

  nearbySection.hidden = true;
  recommendedSection.hidden = true;
  searchResultsSection.hidden = false;

  // ============================
  // TITLE
  // ============================

  if (query) {
    searchResultsTitle.textContent =
      `Resultados para “${rawQuery}”`;
  } else if (activeFilter === "zone") {
    searchResultsTitle.textContent = "Cafés por zona";
  } else if (activeFilter === "price") {
    searchResultsTitle.textContent = "Cafés por precio";
  } else {
    searchResultsTitle.textContent = "Explora cafés en Caracas";
  }

  searchResultsCount.textContent =
    `${results.length} ${results.length === 1 ? "café" : "cafés"}`;

  setTimeout(() => {
  renderCards(results, searchResultsGrid);
  renderMapCafes(results);

  requestAnimationFrame(() => {
    searchResultsGrid.classList.remove("is-updating");
  });
}, 180);
}

/* =========================
   Cards
========================= */

function showCafeFromMap(cafe) {
  if (!cafe) return;

  nearbySection.hidden = true;
  recommendedSection.hidden = true;
  searchResultsSection.hidden = false;

  searchResultsTitle.textContent = cafe.name;
  searchResultsCount.textContent = "1 café";

  backToResultsButton.hidden = false;

  renderCards(
    [cafe],
    searchResultsGrid
  );
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderCards(cafes, container) {
  container.innerHTML = "";

  cafes.forEach((cafe) => {
    const card = document.createElement("article");

    card.className = "search-card";
    card.dataset.cafeName = cafe.name;

    const locationContext = [
      cafe.name,
      cafe.branch,
      cafe.municipality,
      "Caracas",
      "Venezuela"
    ]
      .filter(Boolean)
      .join(" ");

    const mapsUrl =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        locationContext
      )}`;

    const imageUrl =
      cafe.image ||
      cafe.heroImage ||
      "";

    const location =
      cafe.municipality ||
      cafe.branch ||
      cafe.zone ||
      "Caracas";

      const distanceText =
  typeof cafe.distance === "number"
    ? `${cafe.distance.toFixed(1)} km`
    : "";

    const rating =
      cafe.rate !== undefined &&
      cafe.rate !== null &&
      cafe.rate !== ""
        ? Number(cafe.rate).toFixed(1)
        : "N/A";

    const imageMarkup = imageUrl
      ? `
        <img
          src="${imageUrl}"
          alt="${cafe.name}"
          loading="lazy"
        >
      `
      : `
        <div class="search-card__placeholder">
          Caracas Café
        </div>
      `;

    card.innerHTML = `
      <div class="search-card__media">
        ${imageMarkup}

        <button
          type="button"
          class="search-card__favorite"
          aria-label="Guardar ${cafe.name}"
        >
          ♡
        </button>
      </div>

      <div class="search-card__content">
        <div class="search-card__heading">
          <h3>${cafe.name}</h3>

          <span class="search-card__rating">
            ★ ${rating}
          </span>
        </div>

        <p>
  ${location}
  ${distanceText ? ` · ${distanceText}` : ""}
</p>

        <div class="search-card__footer">
          <span>${cafe.cost || "Precio por verificar"}</span>

          <a
            href="${mapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver ubicación →
          </a>
        </div>
      </div>
    `;

  const cafeSlug =
  slugify(cafe.name);

const favoriteButton =
  card.querySelector(
    ".search-card__favorite"
  );

if (favoriteButton) {
  window.CaracasCafeFavorites.updateButton(
    favoriteButton,
    cafeSlug
  );

  favoriteButton.classList.toggle(
    "search-card__favorite--active",
    window.CaracasCafeFavorites.has(cafeSlug)
  );

  favoriteButton.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      const nowFavorite =
        window.CaracasCafeFavorites.toggle(
          cafeSlug
        );

      favoriteButton.classList.toggle(
        "search-card__favorite--active",
        nowFavorite
      );

      window.CaracasCafeFavorites.updateButton(
        favoriteButton,
        cafeSlug
      );
    }
  );
}

    card.addEventListener("click", (event) => {
  if (event.target.closest("button, a")) return;

  window.location.href =
    `cafe.html?cafe=${encodeURIComponent(cafeSlug)}`;
});

    container.appendChild(card);
  });
}

/* =========================
   Events
========================= */
function positionFilterMenu(button, menu) {
  if (!button || !menu) return;

  const rect = button.getBoundingClientRect();

  menu.style.setProperty(
    "--menu-top",
    `${rect.bottom + 10}px`
  );

  menu.style.setProperty(
    "--menu-left",
    `${rect.left}px`
  );

  menu.classList.add("filter-menu--floating");
}

zoneFilterButton.addEventListener("click", (event) => {
  event.stopPropagation();

  const willOpen = zoneFilterMenu.hidden;

  zoneFilterMenu.hidden = !willOpen;
  priceFilterMenu.hidden = true;

  if (willOpen) {
    positionFilterMenu(
      zoneFilterButton,
      zoneFilterMenu
    );
  }
});

zoneOptions.forEach((option) => {
  option.addEventListener("click", (event) => {
    event.stopPropagation();

    selectedZone = option.dataset.zone;
    activeFilter = "zone";

    zoneFilterButton.textContent = `${option.textContent.trim()} ▾`;

    filterChips.forEach((button) => {
      button.classList.remove("filter-chip--active");
    });

    zoneFilterButton.classList.add("filter-chip--active");

    zoneFilterMenu.hidden = true;

    runSearch();
  });
});

document.addEventListener("click", () => {
  zoneFilterMenu.hidden = true;
  priceFilterMenu.hidden = true;
});

priceFilterButton.addEventListener("click", (event) => {
  event.stopPropagation();

  /* TABLET / DESKTOP */
  const willOpen = priceFilterMenu.hidden;

  priceFilterMenu.hidden = !willOpen;
  zoneFilterMenu.hidden = true;

  if (willOpen) {
    positionFilterMenu(
      priceFilterButton,
      priceFilterMenu
    );
  }
});

priceOptions.forEach((option) => {
  option.addEventListener("click", (event) => {
    event.stopPropagation();

    selectedPrice = option.dataset.price;
    activeFilter = "price";

    priceFilterButton.textContent =
      `${option.textContent.trim()} ▾`;

    filterChips.forEach((button) => {
      button.classList.remove("filter-chip--active");
    });

    priceFilterButton.classList.add("filter-chip--active");

    priceFilterMenu.hidden = true;

    runSearch();
  });
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const filter = chip.dataset.filter;

    if (!filter) return;

    if (filter === "zone" || filter === "price") {
  return;
}

    if (filter === "all") {
      activeFilter = "all";
      selectedZone = "all";
      selectedPrice = "all";
      selectedAmenities.clear();
      openNowActive = false;

      searchPageInput.value = "";

      zoneFilterButton.textContent = "Zona ▾";
      priceFilterButton.textContent = "Precio ▾";

      filterChips.forEach((button) => {
        button.classList.remove("filter-chip--active");
      });

      amenityButtons.forEach((button) => {
        button.classList.remove("filter-chip--active");
      });

      openNowFilter.classList.remove("filter-chip--active");

      chip.classList.add("filter-chip--active");

      zoneFilterMenu.hidden = true;
      priceFilterMenu.hidden = true;

      runSearch();
      return;
    }

    activeFilter = filter;

    filterChips.forEach((button) => {
      button.classList.remove("filter-chip--active");
    });

    chip.classList.add("filter-chip--active");

    runSearch();
  });
});

amenityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const amenity = button.dataset.amenity;

    if (selectedAmenities.has(amenity)) {
      selectedAmenities.delete(amenity);
      button.classList.remove("filter-chip--active");
    } else {
      selectedAmenities.add(amenity);
      button.classList.add("filter-chip--active");
    }

    runSearch();
  });
});

openNowFilter.addEventListener("click", () => {
  openNowActive = !openNowActive;

  openNowFilter.classList.toggle(
    "filter-chip--active",
    openNowActive
  );

  runSearch();
});

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Tu navegador no permite usar geolocalización.");
    return;
  }

  locationButton.textContent = "Buscando ubicación...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      locationButton.textContent = "Ubicación activada";

  if (cafesMap) {
    if (userMarker) {
    cafesMap.removeLayer(userMarker);
  }

  userMarker = L.circleMarker(
  [
    userLocation.latitude,
    userLocation.longitude
  ],
  {
    radius: 9,
    color: "#ffffff",
    weight: 4,
    fillColor: "#4285f4",
    fillOpacity: 1,
    opacity: 1
  }
)
  .addTo(cafesMap)
  .bindPopup("Tu ubicación")
  .bringToFront();

  cafesMap.setView(
    [
      userLocation.latitude,
      userLocation.longitude
    ],
    13
  );
}

      renderNearbyCafes();
    },

    (error) => {
      console.error("Error obteniendo ubicación:", error);

      locationButton.textContent = "Usar mi ubicación";

      alert(
        "No pudimos acceder a tu ubicación. Revisa los permisos del navegador."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
});

if (mobileMapToggle && searchMapPanel) {
  mobileMapToggle.addEventListener("click", () => {
    const isOpen =
      searchMapPanel.classList.toggle("mobile-map-open");

    /* Mobile: mapa justo debajo del intro */
    if (window.innerWidth <= 700) {
      if (isOpen) {
        searchIntro.insertAdjacentElement(
          "afterend",
          searchMapPanel
        );
      } else if (mapOriginalParent) {
        mapOriginalParent.appendChild(searchMapPanel);
      }
    }

    mobileMapToggle.textContent =
      isOpen ? "Ocultar mapa" : "Ver mapa";

    mobileMapToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    if (isOpen && cafesMap) {
  setTimeout(() => {
    cafesMap.invalidateSize({
      pan: false
    });
  }, 150);
  }
  });
}

window.addEventListener("resize", () => {
  if (
    window.innerWidth > 700 &&
    searchMapPanel &&
    mapOriginalParent
  ) {
    searchMapPanel.classList.remove("mobile-map-open");

    mapOriginalParent.appendChild(searchMapPanel);

    if (mobileMapToggle) {
      mobileMapToggle.textContent = "Ver mapa";
      mobileMapToggle.setAttribute(
        "aria-expanded",
        "false"
      );
    }

    if (cafesMap) {
      setTimeout(() => {
        cafesMap.invalidateSize();
      }, 100);
    }
  }

  if (cafesMap) {
  setTimeout(() => {
    cafesMap.invalidateSize({
      pan: false
    });
  }, 100);
}

});

// ============================
// SEARCH EVENTS
// ============================

backToResultsButton.addEventListener("click", () => {
  backToResultsButton.hidden = true;

  cafesMap?.closePopup();

  if (userLocation) {
    searchResultsSection.hidden = true;
    nearbySection.hidden = false;
    recommendedSection.hidden = false;

    renderNearbyCafes();

    setTimeout(() => {
      resetMapView();
    }, 50);

    return;
  }

  runSearch();

  setTimeout(() => {
    resetMapView();
  }, 50);
});

searchPageInput.addEventListener("input", runSearch);

searchPageButton.addEventListener("click", runSearch);

searchPageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    runSearch();
  }
});

window.addEventListener("load", () => {
  setTimeout(() => {
    refreshMapLayout();
  }, 150);
});

/* =========================
   Initial load
========================= */

loadSearchCafes();