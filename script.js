const searchInput = document.getElementById("searchInput");
const coffeeShopList = document.getElementById("coffeeShopList");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");

let allCafes = [];

// Load JSON
async function loadCafes() {
  try {
    const response = await fetch("cafes.json");
    const cafes = await response.json();
    renderCafes(cafes);
  } catch (error) {
    console.error("Error cargando cafés:", error);
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderCafes(cafes) {
  allCafes = cafes.filter((cafe) => cafe.name);

  coffeeShopList.innerHTML = "";

  allCafes.forEach((cafe) => {
    const card = document.createElement("article");
    card.className = "coffee-card";

    card.dataset.name = cafe.name || "";
    card.dataset.zone = cafe.zone || "";
    card.dataset.cost = cafe.cost || "";
    card.dataset.notes = cafe.notes || "";
    card.dataset.category = cafe.category || "";

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

    const zone =
      cafe.municipality ||
      cafe.branch ||
      cafe.zone ||
      "Caracas";

    const rating =
      cafe.rate !== undefined &&
      cafe.rate !== null &&
      cafe.rate !== ""
        ? Number(cafe.rate).toFixed(1)
        : "N/A";

    const tags = [
      cafe.category,
      cafe.notes
    ]
      .filter(Boolean)
      .flatMap((value) =>
        String(value)
          .split(/[,/·-]/)
          .map((item) => item.trim())
      )
      .filter(Boolean)
      .slice(0, 2);

    const tagMarkup = tags.length
      ? tags
          .map(
            (tag) =>
              `<span class="coffee-card__chip">${tag}</span>`
          )
          .join("")
      : `<span class="coffee-card__chip">Cafetería</span>`;

    const imageMarkup = imageUrl
      ? `
        <img
          class="coffee-card__image"
          src="${imageUrl}"
          alt="${cafe.name}"
          loading="lazy"
        >
      `
      : `
        <div class="coffee-card__placeholder" aria-hidden="true">
          <span>Caracas Café</span>
        </div>
      `;
   const cafeSlug = slugify(cafe.name);

    card.innerHTML = `
      <a
        class="coffee-card__link"
        href="cafe.html?cafe=${encodeURIComponent(cafeSlug)}"
        aria-label="Ver detalles de ${cafe.name}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="coffee-card__media">
          ${imageMarkup}

          <button
            class="coffee-card__favorite"
            type="button"
            aria-label="Guardar ${cafe.name} en favoritos"
          >
            ♡
          </button>
        </div>

        <div class="coffee-card__body">
          <div class="coffee-card__heading">
            <h3>${cafe.name}</h3>

            <span class="coffee-card__rating">
              <span aria-hidden="true">★</span>
              ${rating}
            </span>
          </div>

          <p class="coffee-card__location">
            ${zone}
          </p>

          <div class="coffee-card__chips">
            ${tagMarkup}
          </div>

          <div class="coffee-card__footer">
            <span class="coffee-card__price">
              ${cafe.cost || "Precio por verificar"}
            </span>

            <span class="coffee-card__action">
              Ver ubicación →
            </span>
          </div>
        </div>
      </a>
    `;

    const locationAction = card.querySelector(
  ".coffee-card__action"
);

if (locationAction) {
  locationAction.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    window.open(
      mapsUrl,
      "_blank",
      "noopener,noreferrer"
    );
  });
}

    const favoriteButton = card.querySelector(
      ".coffee-card__favorite"
    );

    window.CaracasCafeFavorites.updateButton(
  favoriteButton,
  cafeSlug
);

favoriteButton.classList.toggle(
  "coffee-card__favorite--active",
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
      "coffee-card__favorite--active",
      nowFavorite
    );

    window.CaracasCafeFavorites.updateButton(
      favoriteButton,
      cafeSlug
    );
  }
);

    coffeeShopList.appendChild(card);
  });

  updateResultCount(allCafes.length);
}

function normalizeText(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function filterCoffeeShops() {
  const query = normalizeText(searchInput.value.trim());
  const cards = Array.from(document.querySelectorAll(".coffee-card"));

  let visibleCount = 0;

  cards.forEach(card => {
    const searchable = normalizeText(
      `${card.dataset.name} ${card.dataset.zone} ${card.dataset.cost} ${card.dataset.notes}`
    );

    const matches = searchable.includes(query);
    card.hidden = !matches;

    if (matches) visibleCount++;
  });

  updateResultCount(visibleCount);
  emptyState.hidden = visibleCount !== 0;
}

function updateResultCount(count) {
  resultCount.textContent = `${count} ${count === 1 ? "café" : "cafés"}`;
}

if (searchInput) {
  searchInput.addEventListener("input", filterCoffeeShops);
}

/* =====================================================
   HOMEPAGE EVENTS
===================================================== */

const eventsList =
  document.getElementById("eventsList");

const eventsEmptyState =
  document.getElementById(
    "eventsEmptyState"
  );


async function loadEvents() {
  if (!eventsList) return;

  try {
    const response =
      await fetch("events.json");

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status}`
      );
    }

    const events =
      await response.json();

    renderEvents(events);

  } catch (error) {
    console.error(
      "Error cargando eventos:",
      error
    );

    showEventsEmptyState();
  }
}


function renderEvents(events) {
  if (!eventsList) return;

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  const upcomingEvents =
    events
      .filter((event) => {

        if (
          event.verified !== true ||
          !event.date
        ) {
          return false;
        }

        const eventDate =
          new Date(
            `${event.date}T00:00:00`
          );

        return eventDate >= today;
      })

      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      )

      .slice(0, 3);


  if (
    upcomingEvents.length === 0
  ) {
    showEventsEmptyState();
    return;
  }


  eventsEmptyState.hidden = true;
  eventsList.hidden = false;

  eventsList.innerHTML =
    upcomingEvents
      .map((event) =>
        createEventMarkup(event)
      )
      .join("");
}


function createEventMarkup(event) {

  const eventDate =
    new Date(
      `${event.date}T00:00:00`
    );


  const day =
    eventDate
      .getDate()
      .toString()
      .padStart(2, "0");


  const month =
    eventDate
      .toLocaleDateString(
        "es-VE",
        {
          month: "short"
        }
      )
      .replace(".", "")
      .toUpperCase();


  const time =
    event.time
      ? formatEventTime(
          event.time
        )
      : "";


  const eventUrl =
    event.link ||
    (
      event.cafe_slug
        ? `cafe.html?cafe=${encodeURIComponent(
            event.cafe_slug
          )}`
        : "#"
    );


  return `
    <a
      class="event-item"
      href="${eventUrl}"
    >

      <div class="event-item__date">

        <strong>
          ${day}
        </strong>

        <span>
          ${month}
        </span>

      </div>


      <div class="event-item__content">

        <h3>
          ${event.title}
        </h3>

        <p>
          ${event.cafe_name || ""}
        </p>

        ${
          time
            ? `
              <small>
                ${time}
              </small>
            `
            : ""
        }

      </div>

    </a>
  `;
}


function formatEventTime(value) {
  if (!value) return "";

  const [hour, minute] =
    value
      .split(":")
      .map(Number);

  const date =
    new Date();

  date.setHours(
    hour,
    minute,
    0,
    0
  );

  return date.toLocaleTimeString(
    "es-VE",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }
  );
}


function showEventsEmptyState() {
  if (!eventsList) return;

  eventsList.innerHTML = "";
  eventsList.hidden = true;

  if (eventsEmptyState) {
    eventsEmptyState.hidden = false;
  }
}

// Initial load
loadCafes();
loadEvents();
// ==============================
// HOMEPAGE - Zona Dropdown
// ==============================

const zoneButton = document.getElementById("zoneDropdownButton");
const zoneMenu = document.getElementById("zoneDropdown");
const selectedZone = document.getElementById("selectedZone");

if (zoneButton && zoneMenu && selectedZone) {
  zoneButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const wasOpen = !zoneMenu.hidden;

    closeSearchDropdowns(zoneMenu);

    zoneMenu.hidden = wasOpen;
    zoneButton.setAttribute("aria-expanded", String(!wasOpen));
});

  zoneMenu.querySelectorAll("[data-zone]").forEach((option) => {
    option.addEventListener("click", () => {
      zoneMenu
  .querySelectorAll("[data-zone]")
  .forEach((item) => {
    item.setAttribute("aria-selected", "false");
  });

option.setAttribute("aria-selected", "true");
      selectedZone.textContent = option.textContent.trim();

      zoneMenu.hidden = true;
      zoneButton.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", () => {
    zoneMenu.hidden = true;
    zoneButton.setAttribute("aria-expanded", "false");
  });

  zoneMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}
// ==============================
// HOMEPAGE - Concepto Dropdown
// ==============================

const conceptButton = document.getElementById("conceptDropdownButton");
const conceptMenu = document.getElementById("conceptDropdown");
const selectedConcept = document.getElementById("selectedConcept");

if (conceptButton && conceptMenu && selectedConcept) {
  conceptButton.addEventListener("click", (event) => {
  event.stopPropagation();

  const wasOpen = !conceptMenu.hidden;

  closeSearchDropdowns(conceptMenu);

  conceptMenu.hidden = wasOpen;
  conceptButton.setAttribute(
    "aria-expanded",
    String(!wasOpen)
  );
});

  conceptMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    conceptMenu.hidden = true;
    conceptButton.setAttribute("aria-expanded", "false");
  });
}
const conceptCheckboxes = conceptMenu.querySelectorAll(
  'input[type="checkbox"]'
);

conceptCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const selectedValues = Array.from(conceptCheckboxes)
      .filter((item) => item.checked)
      .map((item) => item.value);

    if (selectedValues.length === 0) {
      selectedConcept.textContent = "¿Cómo es el café?";
    } else if (selectedValues.length === 1) {
      const selectedLabel = checkbox
        .closest(".concept-option")
        .querySelector("span")
        .textContent.trim();

      selectedConcept.textContent = selectedLabel;
    } else {
      selectedConcept.textContent =
        `${selectedValues.length} conceptos`;
    }
  });
});
// ==============================
// HOMEPAGE - Precio Dropdown
// ==============================

const priceButton = document.getElementById("priceDropdownButton");
const priceMenu = document.getElementById("priceDropdown");
const selectedPrice = document.getElementById("selectedPrice");

if (priceButton && priceMenu && selectedPrice) {
  priceButton.addEventListener("click", (event) => {
  event.stopPropagation();

  const wasOpen = !priceMenu.hidden;

  closeSearchDropdowns(priceMenu);

  priceMenu.hidden = wasOpen;
  priceButton.setAttribute(
    "aria-expanded",
    String(!wasOpen)
  );
});

  priceMenu.querySelectorAll("[data-price]").forEach((option) => {
    option.addEventListener("click", () => {
      priceMenu
  .querySelectorAll("[data-price]")
  .forEach((item) => {
    item.setAttribute("aria-selected", "false");
  });

option.setAttribute("aria-selected", "true");
      selectedPrice.textContent = option.textContent.trim();

      priceMenu.hidden = true;
      priceButton.setAttribute("aria-expanded", "false");
    });
  });

  priceMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    priceMenu.hidden = true;
    priceButton.setAttribute("aria-expanded", "false");
  });
}
// ==============================
// HOMEPAGE - Enviar filtros a Search
// ==============================

const homepageSearchButton = document.getElementById(
  "homepageSearchButton"
);

if (homepageSearchButton) {
  homepageSearchButton.addEventListener("click", (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    const zoneValue =
      zoneMenu
        ?.querySelector("[data-zone][aria-selected='true']")
        ?.dataset.zone || "";

    const selectedConceptValues = conceptMenu
      ? Array.from(
          conceptMenu.querySelectorAll(
            'input[type="checkbox"]:checked'
          )
        ).map((checkbox) => checkbox.value)
      : [];

    const priceValue =
      priceMenu
        ?.querySelector("[data-price][aria-selected='true']")
        ?.dataset.price || "";

    if (zoneValue) {
      params.set("zone", zoneValue);
    }

    if (selectedConceptValues.length > 0) {
      params.set(
        "concept",
        selectedConceptValues.join(",")
      );
    }

    if (priceValue) {
      params.set("price", priceValue);
    }

    const queryString = params.toString();

    window.location.href = queryString
      ? `search.html?${queryString}`
      : "search.html";
  });
}
// Cierra los demás dropdowns del buscador
function closeSearchDropdowns(exceptMenu = null) {
  const dropdowns = [
    {
      button: zoneButton,
      menu: zoneMenu
    },
    {
      button: conceptButton,
      menu: conceptMenu
    },
    {
      button: priceButton,
      menu: priceMenu
    }
  ];

  dropdowns.forEach(({ button, menu }) => {
    if (!button || !menu || menu === exceptMenu) {
      return;
    }

    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  });
}

/* =========================================
   MOBILE HOMEPAGE SEARCH
========================================= */

const mobileSearchLauncher =
  document.getElementById(
    "mobileSearchLauncher"
  );

const mobileHomepageMedia =
  window.matchMedia(
    "(max-width: 768px)"
  );


/*
  En mobile, la barra principal
  lleva directamente a search.html.
*/

if (mobileSearchLauncher) {
  mobileSearchLauncher.addEventListener(
    "click",
    () => {
      if (
        mobileHomepageMedia.matches
      ) {
        window.location.href =
          "search.html";
      }
    }
  );
}


/*
  En mobile ocultamos únicamente
  Zona / Concepto / Precio / lupa.

  Los botones rápidos:
  Todo / Coworking / Cozy / Sightseeing
  permanecen visibles.
*/

function updateMobileHomepageSearch() {
  const compactSearch =
    document.getElementById(
      "compactSearchLauncher"
    );

  if (!compactSearch) return;

  compactSearch.hidden =
    mobileHomepageMedia.matches;
}


updateMobileHomepageSearch();


if (
  typeof mobileHomepageMedia
    .addEventListener === "function"
) {
  mobileHomepageMedia.addEventListener(
    "change",
    updateMobileHomepageSearch
  );
}

/* =========================================
   HOMEPAGE - COMPACT HEADER ON SCROLL
========================================= */

const homepageHeader =
  document.querySelector(".app-header");

const compactSearchLauncher =
  document.getElementById("compactSearchLauncher");

if (compactSearchLauncher) {
  compactSearchLauncher.addEventListener("click", (event) => {

    const filterTrigger =
      event.target.closest("[data-open-filter]");

    homepageHeader.classList.add(
      "search-open"
    );

    if (!filterTrigger) {
      return;
    }

    const filter =
      filterTrigger.dataset.openFilter;

    const filterButtons = {
      zone: zoneButton,
      concept: conceptButton,
      price: priceButton
    };

    const targetButton =
      filterButtons[filter];

    if (!targetButton) {
      return;
    }

    requestAnimationFrame(() => {
      targetButton.click();
    });
  });
}

document.addEventListener("click", (event) => {
  if (!homepageHeader?.classList.contains("search-open")) {
    return;
  }

  const clickedInsideHeader =
    homepageHeader.contains(event.target);

  if (!clickedInsideHeader) {
    homepageHeader.classList.remove("search-open");
  }
});

let headerIsCompact = false;

function updateHomepageHeader() {
  if (!homepageHeader) return;

  const scrollY = window.scrollY;

  if (!headerIsCompact && scrollY > 120) {
    headerIsCompact = true;

    homepageHeader.classList.add(
      "is-compact"
    );

    document.body.classList.add(
      "header-compact"
    );
  }

  if (headerIsCompact && scrollY < 40) {
    headerIsCompact = false;

    homepageHeader.classList.remove(
      "is-compact"
    );

    document.body.classList.remove(
      "header-compact"
    );
  }
}

window.addEventListener(
  "scroll",
  updateHomepageHeader,
  {
    passive: true
  }
);

updateHomepageHeader();