/* =====================================================
   CARACAS CAFÉ - FAVORITES
===================================================== */

const FAVORITES_KEY = "caracasCafeFavorites";


/* =========================
   READ
========================= */

function getCafeFavorites() {
  try {
    const stored =
      JSON.parse(
        localStorage.getItem(FAVORITES_KEY)
      );

    return Array.isArray(stored)
      ? stored
      : [];

  } catch (error) {
    console.error(
      "Error leyendo favoritos:",
      error
    );

    return [];
  }
}


/* =========================
   SAVE
========================= */

function saveCafeFavorites(favorites) {
  try {
    localStorage.setItem(
      FAVORITES_KEY,
      JSON.stringify(favorites)
    );

    window.dispatchEvent(
      new CustomEvent(
        "caracasCafeFavoritesChanged",
        {
          detail: {
            favorites
          }
        }
      )
    );

  } catch (error) {
    console.error(
      "Error guardando favoritos:",
      error
    );
  }
}


/* =========================
   CHECK
========================= */

function isCafeFavorite(cafeSlug) {
  if (!cafeSlug) return false;

  return getCafeFavorites().includes(
    cafeSlug
  );
}


/* =========================
   TOGGLE
========================= */

function toggleCafeFavorite(cafeSlug) {
  if (!cafeSlug) return false;

  const favorites =
    getCafeFavorites();

  const alreadySaved =
    favorites.includes(cafeSlug);

  const updatedFavorites =
    alreadySaved
      ? favorites.filter(
          (slug) => slug !== cafeSlug
        )
      : [
          ...favorites,
          cafeSlug
        ];

  saveCafeFavorites(
    updatedFavorites
  );

  return !alreadySaved;
}


/* =========================
   BUTTON UI
========================= */

function updateFavoriteButton(
  button,
  cafeSlug
) {
  if (!button || !cafeSlug) return;

  const active =
    isCafeFavorite(cafeSlug);

  button.textContent =
    active ? "♥" : "♡";

  button.classList.toggle(
    "is-favorite",
    active
  );

  button.setAttribute(
    "aria-pressed",
    String(active)
  );

  button.dataset.cafeSlug =
    cafeSlug;
}

function updateFavoritesHeaderCount() {
  const counter =
    document.getElementById(
      "favoritesHeaderCount"
    );

  if (!counter) return;

  const count =
    getCafeFavorites().length;

  counter.textContent =
    count > 0
      ? count
      : "";

  counter.hidden =
    count === 0;
}


document.addEventListener(
  "DOMContentLoaded",
  updateFavoritesHeaderCount
);


window.addEventListener(
  "caracasCafeFavoritesChanged",
  updateFavoritesHeaderCount
);

/* =========================
   EXPOSE
========================= */

window.CaracasCafeFavorites = {
  get: getCafeFavorites,
  save: saveCafeFavorites,
  has: isCafeFavorite,
  toggle: toggleCafeFavorite,
  updateButton: updateFavoriteButton,
  updateCount: updateFavoritesHeaderCount
};