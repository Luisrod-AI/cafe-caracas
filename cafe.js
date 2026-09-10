function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


const params =
  new URLSearchParams(window.location.search);

const requestedCafe =
  params.get("cafe");

  const MENU_API_URL =
  "https://script.google.com/macros/s/AKfycby6VvYBLAxzgZLaXxy3KplS5cKYcWBcICuuhQ1qY9iayjO-gbLT-61BqFHWp1AR90XW/exec";

/* =====================================================
   ELEMENT REFERENCES
===================================================== */

const detailContainer =
  document.getElementById("cafeDetail");

const errorContainer =
  document.getElementById("cafeDetailError");

const cafeDetailImage =
  document.getElementById("cafeDetailImage");
  const cafeDetailGalleryImage2 =
  document.getElementById(
    "cafeDetailGalleryImage2"
  );

const cafeDetailGalleryImage3 =
  document.getElementById(
    "cafeDetailGalleryImage3"
  );

const cafeDetailGalleryImage4 =
  document.getElementById(
    "cafeDetailGalleryImage4"
  );

const cafeDetailGalleryButton =
  document.getElementById(
    "cafeDetailGalleryButton"
  );

const cafeDetailCategory =
  document.getElementById("cafeDetailCategory");

const cafeDetailName =
  document.getElementById("cafeDetailName");


const cafeDetailFavorite =
  document.querySelector(
    ".cafe-detail-favorite"
  );

const cafeDetailRating =
  document.getElementById("cafeDetailRating");

const cafeDetailSideRating =
  document.getElementById(
    "cafeDetailSideRating"
  );

const cafeDetailLocation =
  document.getElementById(
    "cafeDetailLocation"
  );

const cafeDetailAmenities =
  document.getElementById(
    "cafeDetailAmenities"
  );

const cafeDetailMenu =
  document.getElementById(
    "cafeDetailMenu"
  );

const cafeDetailDescription =
  document.getElementById(
    "cafeDetailDescription"
  );

const cafeDetailHours =
  document.getElementById(
    "cafeDetailHours"
  );

const cafeDetailAddress =
  document.getElementById(
    "cafeDetailAddress"
  );

const cafeDetailMap =
  document.getElementById(
    "cafeDetailMap"
  );

const cafeDetailMapsLink =
  document.getElementById(
    "cafeDetailMapsLink"
  );

const cafeDetailSideMapsLink =
  document.getElementById(
    "cafeDetailSideMapsLink"
  );

const cafeDetailPrice =
  document.getElementById(
    "cafeDetailPrice"
  );

const cafeDetailZone =
  document.getElementById(
    "cafeDetailZone"
  );


/* =====================================================
   LOCATION
===================================================== */

function getCafeLocation(cafe) {
  return (
    cafe.neighborhood ||
    cafe.municipality ||
    cafe.branch ||
    cafe.zone ||
    "Caracas"
  );
}

async function loadCafeMenu(slug) {
  try {
    const response =
      await fetch(MENU_API_URL);

    if (!response.ok) {
      throw new Error(
        `Menu API error: ${response.status}`
      );
    }

    const data =
      await response.json();

    const menu =
      data?.cafes?.[slug];

    if (!menu) {
      return null;
    }

    return menu;

  } catch (error) {
    console.error(
      "Error cargando menú:",
      error
    );

    return null;
  }
}


/* =====================================================
   AMENITIES
===================================================== */

function getAmenityData(key) {
  const amenities = {
    wifi: {
      label: "WiFi",
      icon: "⌁"
    },

    coworking: {
      label: "Ideal para trabajar",
      icon: "▣"
    },

    cozy: {
      label: "Ambiente acogedor",
      icon: "☕"
    },

    terrace: {
      label: "Terraza",
      icon: "♧"
    },

    pet_friendly: {
      label: "Pet Friendly",
      icon: "♡"
    },

    parking: {
      label: "Estacionamiento",
      icon: "P"
    },

    brunch: {
      label: "Brunch",
      icon: "◉"
    },

    sightseeing: {
      label: "Ideal para conocer",
      icon: "⌖"
    }
  };

  return amenities[key] || {
    label: key,
    icon: "•"
  };
}


function renderAmenities(cafe) {
  if (!cafeDetailAmenities) return;

  cafeDetailAmenities.innerHTML = "";

  const amenities =
    cafe.amenities || {};

  const availableAmenities =
    Object.entries(amenities)
      .filter(
        ([, value]) =>
          value === true
      );

  if (
    availableAmenities.length === 0
  ) {
    cafeDetailAmenities.innerHTML = `
      <p class="cafe-detail-muted">
        Servicios por verificar.
      </p>
    `;

    return;
  }

  availableAmenities.forEach(
    ([key]) => {
      const amenity =
        getAmenityData(key);

      const item =
        document.createElement("div");

      item.className =
        "cafe-detail-amenity";

      item.innerHTML = `
        <span
          class="cafe-detail-amenity__icon"
          aria-hidden="true"
        >
          ${amenity.icon}
        </span>

        <span
          class="cafe-detail-amenity__label"
        >
          ${amenity.label}
        </span>
      `;

      cafeDetailAmenities
        .appendChild(item);
    }
  );
}


/* =====================================================
   MENU
===================================================== */

function formatMenuPrice(
  price,
  currency = "USD"
) {
  const numericPrice =
    Number(price);

  if (
    Number.isNaN(numericPrice)
  ) {
    return "";
  }

  if (currency === "USD") {
    return `$${numericPrice.toFixed(2)}`;
  }

  if (currency === "VES") {
    return `Bs. ${numericPrice.toFixed(2)}`;
  }

  return (
    `${numericPrice.toFixed(2)} ` +
    currency
  );
}

function chunkArray(array, size) {
  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(
      array.slice(i, i + size)
    );
  }

  return chunks;
}


/* =====================================================
   RENDER MENU
===================================================== */

function renderMenuLoading() {
  if (!cafeDetailMenu) return;

  cafeDetailMenu.innerHTML = `
    <div class="cafe-detail-menu__placeholder">

      <span class="cafe-menu-status">
        Cargando menú
      </span>

      <p>
        Consultando la información disponible...
      </p>

    </div>
  `;
}

function getMenuPreviewSize() {
  if (window.innerWidth >= 1100) {
    return 4;
  }

  if (window.innerWidth >= 700) {
    return 3;
  }

  return 2;
}


function createMenuItemMarkup(item, cafeSlug) {
  const hasPrice =
    item.price !== null &&
    item.price !== undefined &&
    item.price !== "";

  const price =
    hasPrice
      ? formatMenuPrice(
          item.price,
          item.currency || "USD"
        )
      : "";

  const imageUrl =
  getLocalMenuImageUrl(cafeSlug, item);

const imageMarkup = `
  <div class="cafe-menu-preview-card__image">
    <img
  src="${imageUrl}"
  alt="${item.name}"
  loading="lazy"
  onerror="
    if (!this.dataset.triedPng) {
      this.dataset.triedPng = '1';
      this.src = this.src.replace(/\.jpg$/i, '.png');
    } else {
      this.onerror = null;
      this.src = 'assets/images/menu/menu-placeholder.jpg';
    }
  "
>
  </div>
`;

  return `
    <article class="cafe-menu-preview-card">

      ${imageMarkup}

      <div class="cafe-menu-preview-card__content">

        <strong>
          ${item.name}
        </strong>

        ${
          price
            ? `
              <span class="cafe-menu-preview-card__price">
                ${price}
              </span>
            `
            : ""
        }

      </div>

    </article>
  `;
}


function renderMenu(menu, cafeSlug) {
  if (!cafeDetailMenu) return;

  const items =
    Array.isArray(menu?.items)
      ? menu.items
      : [];

  if (items.length === 0) {
    cafeDetailMenu.innerHTML = `
      <div class="cafe-detail-menu__placeholder">

        <span class="cafe-menu-status">
          Menú próximamente disponible
        </span>

        <p>
          Estamos preparando la información
          del menú de este café.
        </p>

      </div>
    `;

    return;
  }


  const pageSize =
    getMenuPreviewSize();

  const pages =
    chunkArray(
      items,
      pageSize
    );

  let currentPage = 0;


  cafeDetailMenu.innerHTML = `
    <div class="cafe-menu-preview">

      <div
        class="cafe-menu-preview__items"
        id="cafeMenuPreviewItems"
      ></div>


      ${
        pages.length > 1
          ? `
            <div
              class="cafe-menu-pagination"
              id="cafeMenuPagination"
              aria-label="Páginas del menú"
            ></div>
          `
          : ""
      }


      <button
        id="openFullMenu"
        class="cafe-menu-full-button"
        type="button"
      >
        <span aria-hidden="true">
          ▣
        </span>

        Ver menú completo
      </button>

    </div>
  `;


  const itemsContainer =
    document.getElementById(
      "cafeMenuPreviewItems"
    );

  const pagination =
    document.getElementById(
      "cafeMenuPagination"
    );

  const fullMenuButton =
    document.getElementById(
      "openFullMenu"
    );


  function renderCurrentPage() {
  if (!itemsContainer) return;

  /*
    1. Suavemente ocultamos
       los productos actuales
  */
  itemsContainer.classList.add(
    "is-changing"
  );

  /*
    2. Esperamos un instante
       antes de cambiar el contenido
  */
  window.setTimeout(() => {

    const currentItems =
      pages[currentPage] || [];

    itemsContainer.innerHTML =
    currentItems
  .map((item) =>
    createMenuItemMarkup(item, cafeSlug)
  )
  .join("");

    renderPagination();

    /*
      3. En el siguiente frame
         mostramos la nueva página
    */
    requestAnimationFrame(() => {

      itemsContainer.classList.remove(
        "is-changing"
      );

    });

  }, 150);
}


  function renderPagination() {
    if (!pagination) return;

    pagination.innerHTML = "";


    const previousButton =
      document.createElement(
        "button"
      );

    previousButton.type =
      "button";

    previousButton.className =
      "cafe-menu-pagination__arrow";

    previousButton.setAttribute(
      "aria-label",
      "Página anterior"
    );

    previousButton.textContent =
      "‹";

    previousButton.disabled =
      currentPage === 0;


    previousButton.addEventListener(
      "click",
      () => {
        if (currentPage === 0) {
          return;
        }

        currentPage -= 1;

        renderCurrentPage();
      }
    );


    pagination.appendChild(
      previousButton
    );


    const maxVisiblePages = 5;

    let startPage =
      Math.max(
        0,
        currentPage - 2
      );

    let endPage =
      Math.min(
        pages.length,
        startPage +
          maxVisiblePages
      );


    if (
      endPage - startPage <
      maxVisiblePages
    ) {
      startPage =
        Math.max(
          0,
          endPage -
            maxVisiblePages
        );
    }


    for (
      let index = startPage;
      index < endPage;
      index++
    ) {

      const pageButton =
        document.createElement(
          "button"
        );

      pageButton.type =
        "button";

      pageButton.className =
        "cafe-menu-pagination__page";

      if (
        index === currentPage
      ) {
        pageButton.classList.add(
          "is-active"
        );
      }

      pageButton.textContent =
        String(index + 1);

      pageButton.setAttribute(
        "aria-label",
        `Ir a página ${index + 1}`
      );


      pageButton.addEventListener(
        "click",
        () => {
          currentPage =
            index;

          renderCurrentPage();
        }
      );


      pagination.appendChild(
        pageButton
      );
    }


    const nextButton =
      document.createElement(
        "button"
      );

    nextButton.type =
      "button";

    nextButton.className =
      "cafe-menu-pagination__arrow";

    nextButton.setAttribute(
      "aria-label",
      "Página siguiente"
    );

    nextButton.textContent =
      "›";

    nextButton.disabled =
      currentPage ===
      pages.length - 1;


    nextButton.addEventListener(
      "click",
      () => {
        if (
          currentPage ===
          pages.length - 1
        ) {
          return;
        }

        currentPage += 1;

        renderCurrentPage();
      }
    );


    pagination.appendChild(
      nextButton
    );
  }


  renderCurrentPage();


  if (fullMenuButton) {
  fullMenuButton.addEventListener(
    "click",
    () => {
      openFullMenuModal(
        menu,
        cafeSlug
      );
    }
  );
}
}
function getLocalMenuImageUrl(cafeSlug, item) {
  if (!item?.name) {
    return "assets/images/menu/menu-placeholder.jpg";
  }

  const safeName = slugify(item.name);

  const imageAliases = {
    canel: {
      "reina-pepiada":
        "variedad-de-arepas-reina-carne-y-atun",

      "carne-al-grill":
        "variedad-de-arepas-reina-carne-y-atun",

      "atun":
        "variedad-de-arepas-reina-carne-y-atun",

      "carne-desmechada":
        "variedad-de-arepas-carne-pollo-y-asado",

      "pollo-al-grill-arepas":
        "variedad-de-arepas-carne-pollo-y-asado",

      "asado-negro-arepas":
        "variedad-de-arepas-carne-pollo-y-asado",

      "cordon-bleu":
        "corden-bleu",

      "milanesa-de-pollo-con-tomates-cherry-confitados":
        "milanesa-de-pollo-con-tomates-cherry",

      "hamburguesa-queso-cheddar-y-tocineta":
        "hamburguesa-de-queso-cheddar-y-tocineta",

      "panquecas-nutella-y-frutas":
  "panquecas-de-nutella-y-frutas"
}
};
  /*
    Glace Gelato Caffè

    Aquí no dependemos únicamente
    del nombre exacto del producto.

    Varias fotos representan familias
    completas de productos.
  */
  if (cafeSlug === "glace-gelato-caffe") {

    if (safeName.includes("glacita")) {
      return `assets/images/menu/${cafeSlug}/glacita.jpg`;
    }

    if (safeName.includes("flor-helada")) {
      return `assets/images/menu/${cafeSlug}/flor-helada.jpg`;
    }

    if (safeName.includes("waffle")) {
      return `assets/images/menu/${cafeSlug}/waffle-con-helado.jpg`;
    }

    if (safeName.includes("brookie")) {
      return `assets/images/menu/${cafeSlug}/brookie-con-helado.jpg`;
    }

    if (
      safeName.includes("brownie-premium")
    ) {
      return `assets/images/menu/${cafeSlug}/brownie-premium-con-helado.jpg`;
    }

    if (
      safeName.includes("brownie") &&
      safeName.includes("helado")
    ) {
      return `assets/images/menu/${cafeSlug}/brownie-con-helado.jpg`;
    }

    if (
      safeName.includes("barquilla") &&
      safeName.includes("doble")
    ) {
      return `assets/images/menu/${cafeSlug}/barquilla-doble.jpg`;
    }

    if (safeName.includes("batido")) {
      return `assets/images/menu/${cafeSlug}/batido-de-frutas.jpg`;
    }

    if (
      safeName.includes("mocktail") &&
      safeName.includes("naranja")
    ) {
      return `assets/images/menu/${cafeSlug}/mocktail-naranja.jpg`;
    }

    if (
      safeName.includes("mocktail") &&
      (
        safeName.includes("rojo") ||
        safeName.includes("frutos-rojos")
      )
    ) {
      return `assets/images/menu/${cafeSlug}/mocktail-rojo.jpg`;
    }

    if (
      safeName.includes("paleta") &&
      safeName.includes("sin-relleno")
    ) {
      return `assets/images/menu/${cafeSlug}/paletas-sin-relleno.jpg`;
    }

    if (
      safeName.includes("paleta") &&
      safeName.includes("rellena")
    ) {
      return `assets/images/menu/${cafeSlug}/paletas-rellenas.jpg`;
    }

    if (
      safeName.includes("crema-real")
    ) {
      return `assets/images/menu/${cafeSlug}/tinita-crema-real.jpg`;
    }

    if (
      safeName === "chocolate" ||
      safeName.includes("tinita-chocolate")
    ) {
      return `assets/images/menu/${cafeSlug}/tinita-chocolate.jpg`;
    }

    if (safeName.includes("pistacho")) {
      return `assets/images/menu/${cafeSlug}/galleta-pistacho.jpg`;
    }

    if (safeName.includes("red-velvet")) {
      return `assets/images/menu/${cafeSlug}/galleta-red-velvet.jpg`;
    }

    if (
      safeName.includes("chocolate-chips") ||
      safeName.includes("chispas-de-chocolate")
    ) {
      return `assets/images/menu/${cafeSlug}/galleta-chocolate-chips.jpg`;
    }

    if (
      safeName.includes("triple-chocolate")
    ) {
      return `assets/images/menu/${cafeSlug}/galleta-chocolate.jpg`;
    }

    if (
      safeName.includes("helado") &&
      (
        safeName.includes("1l") ||
        safeName.includes("1-l") ||
        safeName.includes("1-litro")
      )
    ) {
      return `assets/images/menu/${cafeSlug}/helado-1l.jpg`;
    }
  }

  const finalName =
    imageAliases[cafeSlug]?.[safeName] ||
    safeName;

  return `assets/images/menu/${cafeSlug}/${finalName}.jpg`;
}

function openFullMenuModal(menu, cafeSlug) {
  const items =
    Array.isArray(menu?.items)
      ? menu.items
      : [];

  if (items.length === 0) {
    return;
  }


  /*
    Evitamos crear dos modales
    si el usuario hace doble click.
  */
  const existingModal =
    document.getElementById(
      "fullMenuModal"
    );

  if (existingModal) {
    existingModal.remove();
  }


  const modal =
    document.createElement("div");

  modal.id =
    "fullMenuModal";

  modal.className =
    "full-menu-modal";


  const itemsMarkup =
    items
      .map((item) => {

        const hasPrice =
          item.price !== null &&
          item.price !== undefined &&
          item.price !== "";

        const price =
          hasPrice
            ? formatMenuPrice(
                item.price,
                item.currency || "USD"
              )
            : "";


        const imageUrl =
  getLocalMenuImageUrl(cafeSlug, item);

const imageMarkup = `
  <div class="full-menu-card__image">
    <img
  src="${imageUrl}"
  alt="${item.name}"
  loading="lazy"
  onerror="
    if (!this.dataset.triedPng) {
      this.dataset.triedPng = '1';
      this.src = this.src.replace(/\.jpg$/i, '.png');
    } else {
      this.onerror = null;
      this.src = 'assets/images/menu/menu-placeholder.jpg';
    }
  "
>
  </div>
`;


        return `
          <article
            class="full-menu-card"
          >

            ${imageMarkup}

            <div
              class="full-menu-card__content"
            >

              <strong>
                ${item.name}
              </strong>

              ${
                price
                  ? `
                    <span
                      class="full-menu-card__price"
                    >
                      ${price}
                    </span>
                  `
                  : ""
              }

            </div>

          </article>
        `;
      })
      .join("");


  modal.innerHTML = `
    <div
      class="full-menu-modal__backdrop"
      data-close-full-menu
    ></div>


    <div
      class="full-menu-modal__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullMenuTitle"
    >

      <header
        class="full-menu-modal__header"
      >

        <div>

          <span
            class="eyebrow"
          >
            MENÚ
          </span>

          <h2
            id="fullMenuTitle"
          >
            Menú completo
          </h2>

          <p>
            Explora todos los productos
            disponibles de este café.
          </p>

        </div>


        <button
          class="full-menu-modal__close"
          type="button"
          aria-label="Cerrar menú completo"
          data-close-full-menu
        >
          ×
        </button>

      </header>


      <div
        class="full-menu-modal__body"
      >

        <div
          class="full-menu-grid"
        >
          ${itemsMarkup}
        </div>

      </div>

    </div>
  `;


  document.body.appendChild(
    modal
  );


  /*
    Evita que la página del café
    siga haciendo scroll detrás del modal.
  */
  document.body.classList.add(
    "full-menu-open"
  );


  function closeFullMenuModal() {
    modal.remove();

    document.body.classList.remove(
      "full-menu-open"
    );

    document.removeEventListener(
      "keydown",
      handleEscape
    );
  }


  function handleEscape(event) {
    if (event.key === "Escape") {
      closeFullMenuModal();
    }
  }


  modal
    .querySelectorAll(
      "[data-close-full-menu]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        closeFullMenuModal
      );

    });


  document.addEventListener(
    "keydown",
    handleEscape
  );


  const closeButton =
    modal.querySelector(
      ".full-menu-modal__close"
    );

  if (closeButton) {
    closeButton.focus();
  }
}

function initMenuSliders() {
  const controls = document.querySelectorAll(".cafe-menu-control");

  controls.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const direction = button.dataset.direction;
      const track = document.getElementById(targetId);

      if (!track) return;

      const page = track.querySelector(".cafe-menu-page");
      if (!page) return;

      const pageWidth = page.offsetWidth + 24;

      track.scrollBy({
        left: direction === "next" ? pageWidth : -pageWidth,
        behavior: "smooth"
      });
    });
  });
}


/* =====================================================
   HOURS
===================================================== */

function formatHour(value) {
  if (!value) return "";

  const [hour, minute] =
    value
      .split(":")
      .map(Number);

  const date =
    new Date();

  date.setHours(hour);
  date.setMinutes(minute);

  return date.toLocaleTimeString(
    "es-VE",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }
  );
}


function renderHours(cafe) {
  if (!cafeDetailHours) return;

  cafeDetailHours.innerHTML = "";

  const days = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo"
  };

  Object.entries(days).forEach(
    ([key, label]) => {
      const schedule =
        cafe.hours?.[key];

      const row =
        document.createElement("div");

      row.className =
        "cafe-detail-hours__row";

      let value =
        "Horario por verificar";

      if (
        schedule?.closed === true
      ) {
        value = "Cerrado";

      } else if (
        schedule?.open &&
        schedule?.close
      ) {
        value =
          `${formatHour(
            schedule.open
          )} – ${formatHour(
            schedule.close
          )}`;
      }

      row.innerHTML = `
        <span>
          ${label}
        </span>

        <strong>
          ${value}
        </strong>
      `;

      cafeDetailHours
        .appendChild(row);
    }
  );
}


let cafeMapInstance = null;
let cafeMapResizeObserver = null;

function renderCafeMap(cafe) {
  if (!cafeDetailMap) return;

  const latitude = Number(cafe.latitude);
  const longitude = Number(cafe.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    cafeDetailMap.innerHTML = `
      <div class="cafe-detail-map__empty">
        Ubicación en mapa por verificar.
      </div>
    `;

    return;
  }

  const coordinates = [
    latitude,
    longitude
  ];

  /*
    Si ya existe un mapa,
    lo eliminamos correctamente.
  */
  if (cafeMapInstance) {
    cafeMapInstance.remove();
    cafeMapInstance = null;
  }

  /*
    Esperamos a que el navegador
    haya terminado de calcular el layout.
  */
  requestAnimationFrame(() => {

    cafeMapInstance =
      L.map(cafeDetailMap, {
        zoomControl: false,
        scrollWheelZoom: false
      });

L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 16,
    attribution:
      "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, FAO, NOAA, USGS"
  }
).addTo(cafeMapInstance);

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


L.marker(
  coordinates,
  {
    icon: cafeIcon
  }
)
  .addTo(cafeMapInstance)
  .bindPopup(cafe.name);

    L.control
      .zoom({
        position: "bottomright"
      })
      .addTo(cafeMapInstance);

    cafeMapInstance.setView(
      coordinates,
      15
    );

    /*
      Recalcular después del primer render.
    */
    requestAnimationFrame(() => {
      cafeMapInstance.invalidateSize({
        animate: false
      });

      cafeMapInstance.panTo(
        coordinates,
        {
          animate: false
        }
      );
    });


    /*
      Si CSS cambia el ancho posteriormente,
      Leaflet se vuelve a ajustar solo.
    */
    if (
      "ResizeObserver" in window
    ) {
      cafeMapResizeObserver =
        new ResizeObserver(() => {
          if (!cafeMapInstance) return;

          cafeMapInstance.invalidateSize({
            animate: false
          });
        });

      cafeMapResizeObserver.observe(
        cafeDetailMap
      );
    }

  });
}

function initializeCafeFavorite(
  cafeSlug
) {
  if (
    !cafeDetailFavorite ||
    !cafeSlug
  ) {
    return;
  }

  window.CaracasCafeFavorites.updateButton(
    cafeDetailFavorite,
    cafeSlug
  );

  cafeDetailFavorite.classList.toggle(
    "cafe-detail-favorite--active",
    window.CaracasCafeFavorites.has(cafeSlug)
  );

  cafeDetailFavorite.addEventListener(
    "click",
    () => {
      const nowFavorite =
        window.CaracasCafeFavorites.toggle(
          cafeSlug
        );

      cafeDetailFavorite.classList.toggle(
        "cafe-detail-favorite--active",
        nowFavorite
      );

      window.CaracasCafeFavorites.updateButton(
        cafeDetailFavorite,
        cafeSlug
      );
    }
  );
}
function renderCafeGallery(cafe) {
  const gallery =
    Array.isArray(cafe.gallery)
      ? cafe.gallery.filter(Boolean)
      : [];

  const mainImage =
    cafe.image || "";

  cafeDetailImage.src =
    mainImage;

  cafeDetailImage.alt =
    `${cafe.name} - foto principal`;


  if (cafeDetailGalleryImage2) {
    cafeDetailGalleryImage2.src =
      gallery[0] || mainImage;

    cafeDetailGalleryImage2.alt =
      `${cafe.name} - foto 2`;
  }


  if (cafeDetailGalleryImage3) {
    cafeDetailGalleryImage3.src =
      gallery[1] || mainImage;

    cafeDetailGalleryImage3.alt =
      `${cafe.name} - foto 3`;
  }


  if (cafeDetailGalleryImage4) {
    cafeDetailGalleryImage4.src =
      gallery[2] || mainImage;

    cafeDetailGalleryImage4.alt =
      `${cafe.name} - foto 4`;
  }
}

/* =====================================================
   RENDER CAFE
===================================================== */

function renderCafe(cafe, menu) {
  const location =
    getCafeLocation(cafe);

  const rating =
    cafe.rate !== undefined &&
    cafe.rate !== null
      ? Number(cafe.rate)
          .toFixed(1)
      : "N/A";

  document.title =
    `${cafe.name} | Caracas Café`;

  renderCafeGallery(cafe);

  cafeDetailCategory.textContent =
    cafe.category ||
    "Café en Caracas";

  cafeDetailName.textContent =
    cafe.name;

  cafeDetailRating.textContent =
    `★ ${rating}`;

  cafeDetailSideRating.textContent =
    rating;

  cafeDetailLocation.textContent =
    location;

  cafeDetailPrice.textContent =
    cafe.cost ||
    "Por verificar";

  cafeDetailZone.textContent =
    cafe.municipality ||
    cafe.zone ||
    "Caracas";

  cafeDetailAddress.textContent =
    [
      cafe.neighborhood,
      cafe.municipality,
      "Caracas"
    ]
      .filter(Boolean)
      .join(" · ");

  const mapsUrl =
  cafe.link ||
  (
    Number.isFinite(Number(cafe.latitude)) &&
    Number.isFinite(Number(cafe.longitude))
      ? `https://www.google.com/maps/search/?api=1&query=${cafe.latitude},${cafe.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [
            cafe.name,
            cafe.neighborhood,
            cafe.municipality,
            "Caracas",
            "Venezuela"
          ]
            .filter(Boolean)
            .join(" ")
        )}`
  );

cafeDetailMapsLink.href =
  mapsUrl;

cafeDetailSideMapsLink.href =
  mapsUrl;

  cafeDetailDescription.textContent =
    cafe.notes ||
    `${cafe.name} forma parte de nuestra selección de cafés en Caracas. Aquí podrás consultar su ubicación, servicios, horario y más información relevante.`;

  renderAmenities(cafe);

  renderHours(cafe);

  renderMenu(
  menu,
  cafe.slug || slugify(cafe.name)
);
  renderCafeMap(cafe);
}


async function loadCafeDetail() {
  try {

    /* =========================================
       1. LOAD MAIN CAFE DATA
    ========================================= */

    const response =
      await fetch("cafes.json");

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status}`
      );
    }

    const cafes =
      await response.json();

    const cafe =
  cafes.find(
    (item) =>
      item.slug === requestedCafe ||
      slugify(item.name) === requestedCafe
  );

    /* =========================================
       2. CAFE NOT FOUND
    ========================================= */

    if (!cafe) {
      detailContainer.hidden = true;
      errorContainer.hidden = false;
      return;
    }


    /* =========================================
       3. RENDER CAFE IMMEDIATELY
    ========================================= */

    renderCafe(cafe, null);

initializeCafeFavorite(
  requestedCafe
);

renderMenuLoading();


    /* =========================================
       4. LOAD MENU SEPARATELY
       Do NOT block the rest of the page
    ========================================= */

    loadCafeMenu(
  cafe.slug || slugify(cafe.name)
)
  .then((menu) => {
  renderMenu(
    menu,
    cafe.slug || slugify(cafe.name)
  );
})
      .catch((error) => {
        console.error(
          "Error cargando menú:",
          error
        );

        renderMenu(
  null,
  cafe.slug || slugify(cafe.name)
);
      });


  } catch (error) {

    console.error(
      "Error cargando detalle del café:",
      error
    );

    detailContainer.hidden = true;
    errorContainer.hidden = false;
  }
}


loadCafeDetail();