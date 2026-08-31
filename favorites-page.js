const favoritesGrid =
  document.getElementById(
    "favoritesGrid"
  );

const favoritesEmpty =
  document.getElementById(
    "favoritesEmpty"
  );

const favoritesCount =
  document.getElementById(
    "favoritesCount"
  );


function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


async function loadFavoriteCafes() {
  try {

    const response =
      await fetch("cafes.json");

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status}`
      );
    }

    const cafes =
      await response.json();

    renderFavoriteCafes(cafes);

  } catch (error) {
    console.error(
      "Error cargando favoritos:",
      error
    );
  }
}


function renderFavoriteCafes(cafes) {

  const favoriteSlugs =
    window.CaracasCafeFavorites.get();

  const favoriteCafes =
    cafes.filter((cafe) =>
      favoriteSlugs.includes(
        slugify(cafe.name)
      )
    );


  favoritesGrid.innerHTML = "";


  favoritesCount.textContent =
    `${favoriteCafes.length} ${
      favoriteCafes.length === 1
        ? "café"
        : "cafés"
    }`;


  if (favoriteCafes.length === 0) {

    favoritesGrid.hidden = true;
    favoritesEmpty.hidden = false;

    return;
  }


  favoritesGrid.hidden = false;
  favoritesEmpty.hidden = true;


  favoriteCafes.forEach((cafe) => {

    const cafeSlug =
      slugify(cafe.name);

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "coffee-card";


    const imageUrl =
      cafe.image ||
      cafe.heroImage ||
      "";


    const imageMarkup =
      imageUrl
        ? `
          <img
            class="coffee-card__image"
            src="${imageUrl}"
            alt="${cafe.name}"
            loading="lazy"
          >
        `
        : `
          <div
            class="coffee-card__placeholder"
            aria-hidden="true"
          >
            <span>
              Caracas Café
            </span>
          </div>
        `;


    const location =
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


    card.innerHTML = `
      <a
        class="coffee-card__link"
        href="cafe.html?cafe=${encodeURIComponent(cafeSlug)}"
        aria-label="Ver detalles de ${cafe.name}"
      >

        <div class="coffee-card__media">

          ${imageMarkup}

          <button
            class="coffee-card__favorite coffee-card__favorite--active"
            type="button"
            aria-label="Quitar ${cafe.name} de favoritos"
          >
            ♥
          </button>

        </div>


        <div class="coffee-card__body">

          <div class="coffee-card__heading">

            <h3>
              ${cafe.name}
            </h3>

            <span class="coffee-card__rating">
              <span aria-hidden="true">
                ★
              </span>

              ${rating}
            </span>

          </div>


          <p class="coffee-card__location">
            ${location}
          </p>


          <div class="coffee-card__footer">

            <span class="coffee-card__price">
              ${cafe.cost || "Precio por verificar"}
            </span>

            <span class="coffee-card__action">
              Ver café →
            </span>

          </div>

        </div>

      </a>
    `;


    const favoriteButton =
      card.querySelector(
        ".coffee-card__favorite"
      );


    favoriteButton.addEventListener(
      "click",
      (event) => {

        event.preventDefault();
        event.stopPropagation();

        window.CaracasCafeFavorites.toggle(
          cafeSlug
        );

        renderFavoriteCafes(
          cafes
        );
      }
    );


    favoritesGrid.appendChild(
      card
    );
  });
}


window.addEventListener(
  "caracasCafeFavoritesChanged",
  () => {
    loadFavoriteCafes();
  }
);


loadFavoriteCafes();