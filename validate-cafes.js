const fs = require("fs");
const path = require("path");


/* =====================================================
   CONFIG
===================================================== */

const JSON_PATH =
  path.join(
    __dirname,
    "cafes.json"
  );

const IMAGES_FOLDER =
  path.join(
    __dirname,
    "assets",
    "images",
    "cafes"
  );


const VALID_ZONES = [
  "este",
  "centro este",
  "centro",
  "oeste",
  "sur",
  "varias"
];


const AMENITIES = [
  "wifi",
  "coworking",
  "cozy",
  "terrace",
  "pet_friendly",
  "parking",
  "brunch",
  "sightseeing"
];


const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];


/* =====================================================
   HELPERS
===================================================== */

function normalizeText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}


function slugify(value = "") {
  return normalizeText(value)

    .replace(
      /[^a-z0-9]+/g,
      "-"
    )

    .replace(
      /^-+|-+$/g,
      ""
    );
}


function hasValue(value) {
  return !(
    value === null ||
    value === undefined ||
    value === ""
  );
}


function isValidLatitude(value) {
  const number =
    Number(value);

  return (
    Number.isFinite(number) &&
    number >= -90 &&
    number <= 90
  );
}


function isValidLongitude(value) {
  const number =
    Number(value);

  return (
    Number.isFinite(number) &&
    number >= -180 &&
    number <= 180
  );
}


function isCaracasCoordinate(
  latitude,
  longitude
) {
  const lat =
    Number(latitude);

  const lng =
    Number(longitude);

  /*
    Rango amplio alrededor
    del área metropolitana de Caracas.
  */

  return (
    lat >= 10.3 &&
    lat <= 10.7 &&
    lng >= -67.2 &&
    lng <= -66.6
  );
}


function getMapsUrl(cafe) {
  return (
    cafe.location ||
    cafe.link ||
    cafe.source_url ||
    ""
  );
}


function isGoogleMapsUrl(value) {
  if (!value) {
    return false;
  }

  const text =
    String(value)
      .toLowerCase();

  return (
    text.includes("google.com/maps") ||
    text.includes("maps.google") ||
    text.includes("goo.gl/maps") ||
    text.includes("maps.app.goo.gl") ||
    text.includes("googleusercontent.com/maps")
  );
}


function imageExists(imageValue) {
  if (!imageValue) {
    return false;
  }


  const directPath =
    path.join(
      __dirname,
      imageValue
    );


  if (
    fs.existsSync(
      directPath
    )
  ) {
    return true;
  }


  const filename =
    path.basename(
      imageValue
    );


  const imagePath =
    path.join(
      IMAGES_FOLDER,
      filename
    );


  return fs.existsSync(
    imagePath
  );
}


function isPlaceholder(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }


  const text =
    normalizeText(value);


  return (
    text === "averiguar" ||
    text === "por verificar" ||
    text === "pendiente" ||
    text === "todo" ||
    text.includes(
      "averiguar"
    )
  );
}


function isValidCost(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return true;
  }

  if (
    isPlaceholder(value)
  ) {
    return false;
  }

  const text =
    String(value).trim();

  return (
    /^\d+\$$/.test(text) ||
    /^\d+\s*-\s*\d+\$?$/.test(text)
  );
}


function validateHourObject(
  value
) {

  if (value === null) {
    return {
      valid: true,
      complete: false
    };
  }


  if (
    typeof value !== "object"
  ) {
    return {
      valid: false,
      complete: false
    };
  }


  if (
    value.closed === true
  ) {
    return {
      valid: true,
      complete: true
    };
  }


  if (
    value.open &&
    value.close
  ) {
    return {
      valid: true,
      complete: true
    };
  }


  return {
    valid: false,
    complete: false
  };
}


/* =====================================================
   LOAD JSON
===================================================== */

let cafes;


try {

  const rawData =
    fs.readFileSync(
      JSON_PATH,
      "utf8"
    );


  cafes =
    JSON.parse(
      rawData
    );


} catch (error) {

  console.error(
    "\n❌ No se pudo leer cafes.json"
  );


  console.error(
    error.message
  );


  process.exit(1);

}


if (
  !Array.isArray(cafes)
) {

  console.error(
    "\n❌ cafes.json no contiene un array."
  );


  process.exit(1);

}


/* =====================================================
   RESULTS
===================================================== */

const errors = [];
const warnings = [];
const enrichment = {
  missingMunicipality: [],
  missingNeighborhood: [],
  mapsNotRecognized: [],
  incompleteHours: []
};
const info = [];

const slugMap =
  new Map();

const nameMap =
  new Map();


let coordinatesComplete = 0;
let municipalityComplete = 0;
let neighborhoodComplete = 0;
let mapsComplete = 0;
let imagesComplete = 0;
let hoursComplete = 0;
let hoursPartial = 0;


/* =====================================================
   VALIDATE
===================================================== */

cafes.forEach(
  (
    cafe,
    index
  ) => {

    const record =
      index + 1;


    const name =
      String(
        cafe.name || ""
      ).trim();


    const generatedSlug =
      slugify(name);


    /* =================================================
       NAME
    ================================================= */

    if (!name) {

      errors.push({
        cafe:
          `Registro ${record}`,

        message:
          "No tiene nombre"
      });

      return;
    }


    /* =================================================
       GENERATED SLUG
    ================================================= */

    if (!generatedSlug) {

      errors.push({
        cafe: name,

        message:
          "No se puede generar un slug válido desde el nombre"
      });

    }


    if (
      slugMap.has(
        generatedSlug
      )
    ) {

      errors.push({
        cafe: name,

        message:
          `Slug generado duplicado "${generatedSlug}". También pertenece a "${slugMap.get(generatedSlug)}"`
      });

    } else {

      slugMap.set(
        generatedSlug,
        name
      );

    }


    /* =================================================
       DUPLICATE NAMES
    ================================================= */

    const normalizedName =
      normalizeText(
        name
      );


    if (
      nameMap.has(
        normalizedName
      )
    ) {

      errors.push({
        cafe: name,

        message:
          `Nombre duplicado. También aparece como "${nameMap.get(normalizedName)}"`
      });

    } else {

      nameMap.set(
        normalizedName,
        name
      );

    }


    /* =================================================
       ZONE
    ================================================= */

    if (!cafe.zone) {

      errors.push({
        cafe: name,
        message:
          "No tiene zone"
      });

    } else {

      const zone =
        normalizeText(
          cafe.zone
        );


      if (
        !VALID_ZONES.includes(
          zone
        )
      ) {

        warnings.push({
          cafe: name,

          message:
            `Zona fuera del estándar actual: "${cafe.zone}"`
        });

      }

    }


    /* =================================================
       MUNICIPALITY
    ================================================= */

    if (
      hasValue(
        cafe.municipality
      )
    ) {

      municipalityComplete++;

    } else {

      enrichment.missingMunicipality.push(
  name
);

    }


    /* =================================================
       NEIGHBORHOOD
    ================================================= */

    if (
      hasValue(
        cafe.neighborhood
      )
    ) {

      neighborhoodComplete++;

    } else {

      enrichment.missingNeighborhood.push(
  name
);

    }


    /* =================================================
       COORDINATES
    ================================================= */

    const hasLatitude =
      hasValue(
        cafe.latitude
      );


    const hasLongitude =
      hasValue(
        cafe.longitude
      );


    if (
      !hasLatitude ||
      !hasLongitude
    ) {

      errors.push({
        cafe: name,

        message:
          "Coordenadas incompletas"
      });

    } else {

      if (
        !isValidLatitude(
          cafe.latitude
        )
      ) {

        errors.push({
          cafe: name,

          message:
            `Latitud inválida: ${cafe.latitude}`
        });

      }


      if (
        !isValidLongitude(
          cafe.longitude
        )
      ) {

        errors.push({
          cafe: name,

          message:
            `Longitud inválida: ${cafe.longitude}`
        });

      }


      if (
        isValidLatitude(
          cafe.latitude
        ) &&
        isValidLongitude(
          cafe.longitude
        )
      ) {

        coordinatesComplete++;


        if (
          !isCaracasCoordinate(
            cafe.latitude,
            cafe.longitude
          )
        ) {

          warnings.push({
            cafe: name,

            message:
              `Las coordenadas parecen estar fuera de Caracas: ${cafe.latitude}, ${cafe.longitude}`
          });

        }

      }

    }


    /* =================================================
       MAPS URL
    ================================================= */

    const mapsUrl =
      getMapsUrl(cafe);


    if (!mapsUrl) {

      errors.push({
        cafe: name,

        message:
          "No tiene URL de Google Maps"
      });

    } else if (
      !isGoogleMapsUrl(
        mapsUrl
      )
    ) {

      enrichment.mapsNotRecognized.push(
  name
);

    } else {

      mapsComplete++;

    }


    /* =================================================
       IMAGE
    ================================================= */

    if (!cafe.image) {

      errors.push({
        cafe: name,

        message:
          "No tiene image"
      });

    } else if (
      !imageExists(
        cafe.image
      )
    ) {

      errors.push({
        cafe: name,

        message:
          `Archivo de imagen no encontrado: ${cafe.image}`
      });

    } else {

      imagesComplete++;

    }


    /* =================================================
       COST
    ================================================= */

    if (
      isPlaceholder(
        cafe.cost
      )
    ) {

      errors.push({
        cafe: name,

        message:
          `Cost contiene placeholder: "${cafe.cost}"`
      });

    } else if (
      !isValidCost(
        cafe.cost
      )
    ) {

      warnings.push({
        cafe: name,

        message:
          `Formato de cost no reconocido: "${cafe.cost}"`
      });

    }


    /* =================================================
       NOTES PLACEHOLDERS
    ================================================= */

    if (
      isPlaceholder(
        cafe.notes
      )
    ) {

      errors.push({
        cafe: name,

        message:
          `Notes contiene placeholder: "${cafe.notes}"`
      });

    }


    /* =================================================
       STATUS
    ================================================= */

    if (!cafe.status) {

      warnings.push({
        cafe: name,

        message:
          "No tiene status"
      });

    }


    /* =================================================
       AMENITIES
    ================================================= */

    if (
      !cafe.amenities ||
      typeof cafe.amenities
        !== "object"
    ) {

      warnings.push({
        cafe: name,

        message:
          "No tiene objeto amenities"
      });

    } else {

      AMENITIES.forEach(
        (amenity) => {

          if (
            !Object.prototype
              .hasOwnProperty
              .call(
                cafe.amenities,
                amenity
              )
          ) {

            warnings.push({
              cafe: name,

              message:
                `Amenity faltante: ${amenity}`
            });

            return;
          }


          const value =
            cafe.amenities[
              amenity
            ];


          if (
            value !== true &&
            value !== false &&
            value !== null
          ) {

            errors.push({
              cafe: name,

              message:
                `Amenity "${amenity}" debe ser true, false o null`
            });

          }

        }
      );

    }


   /* =================================================
   HOURS
================================================= */

if (
  !cafe.hours ||
  typeof cafe.hours !== "object"
) {

  enrichment.incompleteHours.push(
    name
  );

} else {

  let completeDays = 0;
  let validHours = true;


  DAYS.forEach(
    (day) => {

      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            cafe.hours,
            day
          )
      ) {

        validHours = false;

        return;
      }


      const validation =
        validateHourObject(
          cafe.hours[day]
        );


      if (
        !validation.valid
      ) {

        validHours = false;

        warnings.push({
          cafe: name,

          message:
            `Horario inválido para ${day}`
        });

      }


      if (
        validation.complete
      ) {

        completeDays++;

      }

    }
  );


  if (
    validHours &&
    completeDays === 7
  ) {

    hoursComplete++;

  } else {

    enrichment.incompleteHours.push(
      name
    );


    if (
      completeDays > 0
    ) {

      hoursPartial++;

    }

  }

}


    /* =================================================
       OTHER LOCATIONS
    ================================================= */

    if (
      cafe.other_locations !== undefined &&
      !Array.isArray(
        cafe.other_locations
      )
    ) {

      errors.push({
        cafe: name,

        message:
          "other_locations debe ser un array"
      });

    }


    /* =================================================
       RESEARCH
    ================================================= */

    if (
      cafe.research &&
      typeof cafe.research
        !== "object"
    ) {

      warnings.push({
        cafe: name,

        message:
          "research tiene un formato inesperado"
      });

    }

  }
);


/* =====================================================
   PRINT HELPERS
===================================================== */

function printGroup(
  title,
  list
) {

  if (
    list.length === 0
  ) {
    return;
  }


  console.log(
    `\n${title}`
  );


  console.log(
    "----------------------------------------"
  );


  list.forEach(
    (
      item,
      index
    ) => {

      console.log(
        `${index + 1}. ${item.cafe}`
      );


      console.log(
        `   ${item.message}`
      );

    }
  );

}


/* =====================================================
   SUMMARY
===================================================== */

console.log(
  "\n=========================================="
);

console.log(
  "   CARACAS CAFÉ - VALIDACIÓN DE DATOS"
);

console.log(
  "==========================================\n"
);


console.log(
  `📍 Cafés revisados: ${cafes.length}`
);


console.log(
  `✅ Coordenadas completas: ${coordinatesComplete}/${cafes.length}`
);


console.log(
  `✅ URLs de Maps válidas: ${mapsComplete}/${cafes.length}`
);


console.log(
  `✅ Imágenes encontradas: ${imagesComplete}/${cafes.length}`
);


console.log(
  `✅ Municipality completo: ${municipalityComplete}/${cafes.length}`
);


console.log(
  `✅ Neighborhood completo: ${neighborhoodComplete}/${cafes.length}`
);


console.log(
  `✅ Horarios completos: ${hoursComplete}/${cafes.length}`
);


console.log(
  `⚠️ Horarios parciales: ${hoursPartial}/${cafes.length}`
);


console.log(
  `❌ Errores críticos: ${errors.length}`
);


console.log(
  `⚠️ Advertencias: ${warnings.length}`
);

console.log(
  "\nℹ️ ENRIQUECIMIENTO PENDIENTE"
);

console.log(
  "----------------------------------------"
);

console.log(
  `Municipality faltante: ${enrichment.missingMunicipality.length}`
);

console.log(
  `Neighborhood faltante: ${enrichment.missingNeighborhood.length}`
);

console.log(
  `URLs de Maps no reconocidas: ${enrichment.mapsNotRecognized.length}`
);

console.log(
  `Horarios incompletos: ${enrichment.incompleteHours.length}`
);


printGroup(
  "❌ ERRORES CRÍTICOS",
  errors
);


printGroup(
  "⚠️ ADVERTENCIAS",
  warnings
);


/* =====================================================
   FINAL RESULT
===================================================== */

console.log(
  "\n=========================================="
);


if (
  errors.length > 0
) {

  console.log(
    "❌ BASE NO LISTA PARA PUBLICAR"
  );


  console.log(
    "Corrige los errores críticos antes de publicar."
  );


  process.exitCode = 1;

} else {

  console.log(
    "✅ BASE LISTA PARA PUBLICAR"
  );


  if (
    warnings.length > 0
  ) {

    console.log(
      "Existen advertencias no críticas para revisar."
    );

  }

}


console.log(
  "==========================================\n"
);