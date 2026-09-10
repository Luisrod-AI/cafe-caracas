const fs = require("fs");
const path = require("path");

const JSON_PATH = path.join(__dirname, "cafes.json");

const cafes = JSON.parse(
  fs.readFileSync(JSON_PATH, "utf8")
);

let updated = 0;
let skipped = 0;

cafes.forEach((cafe) => {
  if (!cafe.amenities) {
    cafe.amenities = {
      wifi: null,
      coworking: null,
      cozy: null,
      sightseeing: null,
      terrace: null,
      pet_friendly: null,
      parking: null,
      brunch: null
    };

    updated++;
  } else {
    skipped++;
  }
});

fs.writeFileSync(
  JSON_PATH,
  JSON.stringify(cafes, null, 2),
  "utf8"
);

console.log("==============================");
console.log(`✅ Cafés actualizados: ${updated}`);
console.log(`↪️ Cafés que ya tenían amenities: ${skipped}`);
console.log("==============================");