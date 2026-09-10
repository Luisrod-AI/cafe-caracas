const fs = require("fs");
const path = require("path");

// ==============================
// CONFIG
// ==============================

const JSON_PATH = path.join(__dirname, "cafes.json");
const IMAGES_FOLDER = path.join(
  __dirname,
  "assets",
  "images",
  "cafes"
);

const WEB_IMAGE_PATH = "assets/images/cafes";

// ==============================
// NORMALIZAR NOMBRES
// ==============================

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "y")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ==============================
// LEER JSON
// ==============================

const cafes = JSON.parse(
  fs.readFileSync(JSON_PATH, "utf8")
);

// ==============================
// LEER IMÁGENES
// ==============================

const imageFiles = fs
  .readdirSync(IMAGES_FOLDER)
  .filter((file) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

// Mapa:
// cafe-vomero -> cafe-vomero.jpg
const imagesBySlug = {};

imageFiles.forEach((file) => {
  const ext = path.extname(file);
  const nameWithoutExtension = path.basename(file, ext);

  imagesBySlug[slugify(nameWithoutExtension)] = file;
});

// ==============================
// MATCH CAFÉS ↔ IMÁGENES
// ==============================

const imageAliases = {
  "readers-cafe": "reader-s-cafe.jpg",
  "norty-pizzeria-y-cafe": "norty-pizzeria-and-cafe.jpg",
  "juris-cafe-y-lunch": "juris-cafe-lunch.jpg",
  "caffetto-kfe": "caffetto-k-fe.jpg",
  "arabica": "arabica-cafe.jpg",
  "araza": "araza-cafe.jpg"
};

let matched = 0;
let missing = 0;

cafes.forEach((cafe) => {
  const cafeSlug = slugify(cafe.name);

  const imageFile =
  imageAliases[cafeSlug] ||
  imagesBySlug[cafeSlug];

  if (imageFile) {
    cafe.image = `${WEB_IMAGE_PATH}/${imageFile}`;
    cafe.image_type = "local";
    cafe.image_verified = true;

    console.log(`✅ ${cafe.name} -> ${imageFile}`);
    matched++;
  } else {
    console.log(`❌ Sin imagen: ${cafe.name}`);
    missing++;
  }
});

// ==============================
// GUARDAR JSON
// ==============================

fs.writeFileSync(
  JSON_PATH,
  JSON.stringify(cafes, null, 2),
  "utf8"
);

console.log("\n==============================");
console.log(`✅ Imágenes conectadas: ${matched}`);
console.log(`❌ Cafés sin match: ${missing}`);
console.log("==============================");