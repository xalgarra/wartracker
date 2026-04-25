// Datos de ejemplo realistas para WarTracker
window.WT_DATA = {
  user: { email: "alex@wartracker.app" },

  games: [
    { slug: "40k", name: "Warhammer 40K", short: "40K" },
    { slug: "aos", name: "Age of Sigmar", short: "AoS" },
  ],

  // Colección — mezcla de unidades, varios estados, varias facciones
  minis: [
    { id: 1,  name: "Intercessors",         alt: "Squad Vex",    factions: ["Space Marines"],            game: "40k", qty: 2, models: 10, status: "pintada",   type: "infantería", points: 80,  notes: "Capítulo Crimson Fists" },
    { id: 2,  name: "Redemptor Dreadnought", alt: "Brother Aurus", factions: ["Space Marines"],            game: "40k", qty: 1, models: 1,  status: "pintando",  type: "vehículo",   points: 210, notes: "" },
    { id: 3,  name: "Lord Kroak",           alt: null,           factions: ["Seraphon"],                  game: "aos", qty: 1, models: 1,  status: "imprimada", type: "personaje",  points: 350, notes: "Centro de la lista" },
    { id: 4,  name: "Saurus Warriors",      alt: null,           factions: ["Seraphon"],                  game: "aos", qty: 3, models: 30, status: "montada",   type: "infantería", points: 90,  notes: "" },
    { id: 5,  name: "Necron Warriors",      alt: null,           factions: ["Necrons"],                   game: "40k", qty: 2, models: 20, status: "comprada",  type: "infantería", points: 130, notes: "Sin abrir" },
    { id: 6,  name: "Stormcast Liberators", alt: null,           factions: ["Stormcast Eternals"],        game: "aos", qty: 1, models: 5,  status: "pintada",   type: "infantería", points: 105, notes: "" },
    { id: 7,  name: "Custodian Guard",      alt: null,           factions: ["Adeptus Custodes"],          game: "40k", qty: 1, models: 5,  status: "pintada",   type: "élite",      points: 215, notes: "Esquema oro mate" },
    { id: 8,  name: "Idoneth Eels",         alt: null,           factions: ["Idoneth Deepkin"],           game: "aos", qty: 2, models: 6,  status: "pintando",  type: "caballería", points: 240, notes: "" },
    { id: 9,  name: "Land Raider",          alt: null,           factions: ["Space Marines"],             game: "40k", qty: 1, models: 1,  status: "comprada",  type: "vehículo",   points: 240, notes: "Regalo cumpleaños" },
    { id: 10, name: "Tyranid Warriors",     alt: null,           factions: ["Tyranids"],                  game: "40k", qty: 1, models: 6,  status: "imprimada", type: "infantería", points: 105, notes: "" },
    { id: 11, name: "Sylvaneth Dryads",     alt: null,           factions: ["Sylvaneth"],                 game: "aos", qty: 1, models: 10, status: "pintada",   type: "infantería", points: 110, notes: "" },
    { id: 12, name: "Bloodletters",         alt: null,           factions: ["Daemons of Khorne", "Chaos Daemons"], game: "aos", qty: 2, models: 20, status: "montada", type: "infantería", points: 160, notes: "Cross-game" },
  ],

  wishlist: [
    { id: 101, name: "Magnus the Red",     factions: ["Thousand Sons"],     game: "40k", points: 460, notes: "Cuando baje de precio" },
    { id: 102, name: "Knight-Questor",     factions: ["Stormcast Eternals"], game: "aos", points: 110, notes: "" },
    { id: 103, name: "Trygon",             factions: ["Tyranids"],          game: "40k", points: 180, notes: "" },
  ],

  pinturas: [
    { id: 1, brand: "Citadel",  name: "Macragge Blue",    type: "base",     color: "#1f3a93", stock: true },
    { id: 2, brand: "Citadel",  name: "Mephiston Red",    type: "base",     color: "#9c1818", stock: true },
    { id: 3, brand: "Citadel",  name: "Nuln Oil",         type: "shade",    color: "#0d0d0d", stock: false },
    { id: 4, brand: "Citadel",  name: "Agrax Earthshade", type: "shade",    color: "#3d2818", stock: true },
    { id: 5, brand: "Vallejo",  name: "Bone White",       type: "layer",    color: "#d8cfa8", stock: true },
    { id: 6, brand: "Citadel",  name: "Retributor Armour", type: "base",    color: "#a17a2a", stock: true },
    { id: 7, brand: "Citadel",  name: "Liberator Gold",   type: "layer",    color: "#c89b46", stock: true },
    { id: 8, brand: "AK",       name: "Black Primer",     type: "spray",    color: "#0a0a0a", stock: false },
    { id: 9, brand: "Citadel",  name: "Contrast Medium",  type: "technical", color: null,     stock: true },
    { id: 10, brand: "Vallejo", name: "Game Color Verde Oliva", type: "layer", color: "#5a6a3a", stock: true },
  ],

  factions: [
    { name: "Space Marines",       game: "40k" },
    { name: "Necrons",             game: "40k" },
    { name: "Tyranids",            game: "40k" },
    { name: "Adeptus Custodes",    game: "40k" },
    { name: "Thousand Sons",       game: "40k" },
    { name: "Seraphon",            game: "aos" },
    { name: "Stormcast Eternals",  game: "aos" },
    { name: "Idoneth Deepkin",     game: "aos" },
    { name: "Sylvaneth",           game: "aos" },
    { name: "Daemons of Khorne",   game: "aos" },
  ],
};

// Helpers compartidos
window.WT_HELPERS = {
  statusOrder: ["comprada", "montada", "imprimada", "pintando", "pintada"],
  statusLabel: {
    comprada: "Comprada",
    montada: "Montada",
    imprimada: "Imprimada",
    pintando: "Pintando",
    pintada: "Pintada",
    wishlist: "Wishlist",
  },

  // Calcula stats agrupando minis
  computeStats(minis) {
    const byGame = {};
    let totalPts = 0, paintedPts = 0, totalUnits = 0, paintedUnits = 0;

    for (const m of minis) {
      const totalForMini = (m.points || 0) * (m.qty || 1);
      totalPts += totalForMini;
      totalUnits += (m.qty || 1);
      if (m.status === "pintada") {
        paintedPts += totalForMini;
        paintedUnits += (m.qty || 1);
      }
      const g = m.game;
      if (!byGame[g]) byGame[g] = {};
      for (const f of m.factions) {
        if (!byGame[g][f]) byGame[g][f] = { pts: 0, painted: 0, byStatus: {}, items: [] };
        byGame[g][f].pts += totalForMini;
        if (m.status === "pintada") byGame[g][f].painted += totalForMini;
        byGame[g][f].byStatus[m.status] = (byGame[g][f].byStatus[m.status] || 0) + totalForMini;
        byGame[g][f].items.push(m);
      }
    }
    return { byGame, totalPts, paintedPts, totalUnits, paintedUnits };
  },
};
