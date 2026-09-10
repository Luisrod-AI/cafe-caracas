const fs = require("fs");
const path = require("path");

const JSON_PATH = path.join(__dirname, "cafes.json");

const cafes = JSON.parse(
  fs.readFileSync(JSON_PATH, "utf8")
);

let updated = 0;
let missing = 0;

function extractCoordinates(url) {
  if (!url) return null;

  // Google Maps URLs often contain:
  // !3dLATITUDE!4dLONGITUDE
  const match = String(url).match(
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/
  );

  if (!match) {
    return null;
  }

  return {
    latitude: Number(match[1]),
    longitude: Number(match[2])
  };
}

cafes.forEach((cafe) => {
  const possibleUrls = [
    cafe.location,
    cafe.source_url,
    cafe.link
  ];

  let coordinates = null;

  for (const url of possibleUrls) {
    coordinates = extractCoordinates(url);

    if (coordinates) {
      break;
    }
  }

  if (coordinates) {
    cafe.latitude = coordinates.latitude;
    cafe.longitude = coordinates.longitude;

    updated++;

    console.log(
      `✅ ${cafe.name}: ${cafe.latitude}, ${cafe.longitude}`
    );
  } else {
    cafe.latitude = cafe.latitude ?? null;
    cafe.longitude = cafe.longitude ?? null;

    missing++;

    console.log(`❌ Sin coordenadas: ${cafe.name}`);
  }
});

fs.writeFileSync(
  JSON_PATH,
  JSON.stringify(cafes, null, 2),
  "utf8"
);

console.log("==============================");
console.log(`✅ Coordenadas encontradas: ${updated}`);
console.log(`❌ Sin coordenadas: ${missing}`);
console.log("==============================");