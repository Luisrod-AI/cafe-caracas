const fs = require("fs");
const path = require("path");

const JSON_PATH = path.join(__dirname, "cafes.json");

// Leer cafes.json
const cafes = JSON.parse(
  fs.readFileSync(JSON_PATH, "utf8")
);

console.log(`☕ Cafés cargados: ${cafes.length}`);

cafes.forEach((cafe) => {
  if (!cafe.amenities) {
    cafe.amenities = {};
  }

  if (!("sightseeing" in cafe.amenities)) {
    cafe.amenities.sightseeing = null;
  }
});

cafes.forEach((cafe) => {
  if (!cafe.hours) {
    cafe.hours = {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null
    };
  }
});

const updates = {
  "Páramo Café": {
    zone: "centro",
    branch: "Centro Histórico",
    municipality: "Libertador",
    status: "Verificado y activo"
  },

  "360 Roof Bar": {
  category: "Bar / rooftop / restaurante",
  status: "Verificado: activo, pero no es una cafetería principal",
  amenities: {
    terrace: true,
    parking: true,
    cozy: true,
    sightseeing: true
  }
},

  "Anella Café": {
  amenities: {
    terrace: true,
    brunch: true,
    cozy: true,
    sightseeing: true
  },
  hours: {
    monday: { open: "07:00", close: "21:00" },
    tuesday: { open: "07:00", close: "21:00" },
    wednesday: { open: "07:00", close: "21:00" },
    thursday: { open: "07:00", close: "21:00" },
    friday: { open: "07:00", close: "21:00" },
    saturday: { open: "07:00", close: "21:00" },
    sunday: { open: "07:00", close: "21:00" }
  },
  hours_source: "https://anellacafe.com/",
  hours_verified: "2026-08-14"
},

  "Arábica": {
  amenities: {
    terrace: true,
    parking: true,
    wifi: true
  },
  hours: {
    monday: { open: "07:00", close: "18:00" },
    tuesday: { open: "07:00", close: "18:00" },
    wednesday: { open: "07:00", close: "18:00" },
    thursday: { open: "07:00", close: "18:00" },
    friday: { open: "07:00", close: "18:00" },
    saturday: { open: "07:00", close: "17:00" },
    sunday: { open: "07:00", close: "17:00" }
  },
  hours_source: "https://wanderlog.com/place/details/1338705/ar%C3%A1bica",
  hours_verified: "2026-08-14"
},

  "Arazá": {
    amenities: {
      brunch: true
    }
  },

  "Aurora Café Restaurante": {
  amenities: {
    wifi: true,
    terrace: true,
    pet_friendly: true,
    parking: true,
    brunch: true,
    cozy: true
  },
  hours: {
    monday: { closed: true },
    tuesday: { open: "08:00", close: "20:00" },
    wednesday: { open: "08:00", close: "20:00" },
    thursday: { open: "08:00", close: "20:00" },
    friday: { open: "08:00", close: "20:00" },
    saturday: { open: "08:00", close: "20:00" },
    sunday: { open: "08:00", close: "16:00" }
  },
  hours_source: "https://guiapana.com/restaurantes/aurora-cafe/",
  hours_verified: "2026-08-14"
},

  "Azu Pastelería": {
    amenities: {
      terrace: true,
      parking: true,
      brunch: true,
      cozy: true
    }
  },

  "Pink Elephant": {
    amenities: {
      brunch: true
    }
  },

  "The Coffee": {
    amenities: {
      pet_friendly: true
    }
  },

  "Quiero 1 Café Roasters": {
    amenities: {
      pet_friendly: true
    }
  },

  "La Terraza Khoül": {
    amenities: {
      terrace: true
    }
  },
  "Sport Park Café": {
  amenities: {
    sightseeing: true
  }
},
"Artesanos Cafetería": {
  amenities: {
    cozy: true,
    wifi: false
  },
  hours: {
    monday: { open: "08:00", close: "20:00" },
    tuesday: { open: "08:00", close: "20:00" },
    wednesday: { open: "07:00", close: "20:00" },
    thursday: { open: "07:00", close: "20:00" },
    friday: { open: "07:00", close: "20:00" },
    saturday: { open: "07:00", close: "20:00" },
    sunday: { open: "07:30", close: "20:00" }
  },
  hours_source: "https://wanderlog.com/es/place/details/2921639/artesano-cafeter%C3%ADa",
  hours_verified: "2026-08-14"
},

"Caracas Coffee Roaster": {
  hours: {
    monday: { open: "08:00", close: "21:00" },
    tuesday: { open: "08:00", close: "21:00" },
    wednesday: { open: "08:00", close: "21:00" },
    thursday: { open: "08:00", close: "21:00" },
    friday: { open: "08:00", close: "21:00" },
    saturday: { open: "08:00", close: "21:00" },
    sunday: { open: "09:00", close: "19:00" }
  },
  hours_source: "https://wanderlog.com/place/details/4327639/caracas-coffee-roasters",
  hours_verified: "2026-08-14"
},
};


let updatedCount = 0;

cafes.forEach((cafe) => {
  const update = updates[cafe.name];

  if (!update) return;

  Object.entries(update).forEach(([key, value]) => {
    if (key === "amenities") {
      cafe.amenities = {
        ...cafe.amenities,
        ...value
      };
    } else {
      cafe[key] = value;
    }
  });

  updatedCount++;

  console.log(`✅ Actualizado: ${cafe.name}`);
});

fs.writeFileSync(
  JSON_PATH,
  JSON.stringify(cafes, null, 2),
  "utf8"
);

console.log("==============================");
console.log(`✅ Cafés actualizados: ${updatedCount}`);
console.log("💾 Cambios guardados en cafes.json");
console.log("==============================");
