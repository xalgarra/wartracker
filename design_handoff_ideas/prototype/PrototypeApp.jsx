/* global React, IOSDevice, BottomNav, HoyScreen, MiniDetail, QuickAddSheet, PaintLinkSheet, IdeasScreen, IdeaActionsSheet, LinkMiniSheet */
// =============================================================
// PrototypeApp — the redesigned WarTracker app, running in iOS
// =============================================================
const { useState } = React;

// Inventory of paints — mock; in prod comes from `paints` table.
const PROTO_PAINTS = [
  { id: 'p1',  name: 'Macragge Blue',      brand: 'Citadel', type: 'Base',    hex: '#1e3a8a' },
  { id: 'p2',  name: 'Abaddon Black',      brand: 'Citadel', type: 'Base',    hex: '#0c0c0c' },
  { id: 'p3',  name: 'Retributor Armour',  brand: 'Citadel', type: 'Base',    hex: '#c39a3e' },
  { id: 'p4',  name: 'Agrax Earthshade',   brand: 'Citadel', type: 'Shade',   hex: '#3a2010' },
  { id: 'p5',  name: 'Calgar Blue',        brand: 'Citadel', type: 'Layer',   hex: '#3a5fb8' },
  { id: 'p6',  name: 'Ushabti Bone',       brand: 'Citadel', type: 'Layer',   hex: '#cfb98a' },
  { id: 'p7',  name: 'Mephiston Red',      brand: 'Citadel', type: 'Base',    hex: '#9a1f1f' },
  { id: 'p8',  name: 'Leadbelcher',        brand: 'Citadel', type: 'Base',    hex: '#5a5a5a' },
  { id: 'p9',  name: 'Nuln Oil',           brand: 'Citadel', type: 'Shade',   hex: '#15161a' },
  { id: 'p10', name: 'Vallejo Pale Sand',  brand: 'Vallejo', type: 'Model',   hex: '#d8c79a' },
];

// Recetas guardadas — esquemas reutilizables. Cuando aplicas una, sus pinturas
// se COPIAN al `mini_paints` de la mini (no se vinculan).
const PROTO_RECIPES = [
  {
    id: 'r1',
    name: 'Ultramarines clásico',
    subject: 'Space Marines azul',
    paints: ['p1', 'p2', 'p4', 'p5', 'p8'].map(id => PROTO_PAINTS.find(p => p.id === id)),
  },
  {
    id: 'r2',
    name: 'Custodes dorado profundo',
    subject: 'Armadura dorada',
    paints: ['p3', 'p4', 'p6', 'p2'].map(id => PROTO_PAINTS.find(p => p.id === id)),
  },
  {
    id: 'r3',
    name: 'Squad Vex — Intercessors',
    subject: 'Mi esquema',
    paints: ['p1', 'p5', 'p4', 'p2', 'p6'].map(id => PROTO_PAINTS.find(p => p.id === id)),
  },
];

// Ideas seed — cosas que el usuario tiene en la cabeza, no proyectos
// activos. mini_id es opcional; cuando existe, vincula con la
// colección o wishlist.
const PROTO_IDEAS = [
  { id: 'i1', text: 'Probar OSL en el martillo del Lord-Celestant', category: 'tecnica', linkedMini: null },
  { id: 'i2', text: "Pintar mi Be'lakor antes de fin de año", category: 'mini', linkedMini: { id: 'w1', name: "Be'lakor", faction: 'Slaves to Darkness' } },
  { id: 'i3', text: 'Hacer peana temática con nieve para Stormcast', category: 'tecnica', linkedMini: null },
  { id: 'i4', text: 'Comprar Contrast Black Templar y Wyldwood', category: 'compra', linkedMini: null },
  { id: 'i5', text: 'Montar lista 2000pts Idoneth para el torneo de mayo', category: 'lista', linkedMini: null },
  { id: 'i6', text: 'Re-imprimar las Plaguebearers (quedó granulada)', category: 'mini', linkedMini: { id: 'm5', name: 'Plaguebearers', faction: 'Maggotkin' } },
  { id: 'i7', text: 'Organizar la mesa de pintar (cables y luz)', category: 'otros', linkedMini: null },
];

const PROTOTYPE_DATA = {
  paints: PROTO_PAINTS,
  recipes: PROTO_RECIPES,
  minis: [
    { id: 'm1', game: '40K', faction: 'Space Marines', name: 'Redemptor Dreadnought', type: 'élite', status: 'pintando', qty: 1, models: 1, pts: 210,
      paints: ['p1', 'p2', 'p3', 'p4'].map(id => PROTO_PAINTS.find(p => p.id === id)) },
    { id: 'm2', game: '40K', faction: 'Space Marines', name: 'Intercessors', name_custom: 'Squad Vex', type: 'infantería', status: 'pintada', qty: 2, models: 10, pts: 80,
      paints: ['p1', 'p5', 'p4', 'p2', 'p6'].map(id => PROTO_PAINTS.find(p => p.id === id)) },
    { id: 'm3', game: '40K', faction: 'Necrons', name: 'Lokhust Destroyers', type: 'élite', status: 'montada', qty: 1, models: 3, pts: 165, paints: [] },
    { id: 'm4', game: 'AoS', faction: 'Stormcast Eternals', name: 'Liberators', type: 'infantería', status: 'imprimada', qty: 2, models: 5, pts: 110, paints: [] },
    { id: 'm5', game: 'AoS', faction: 'Maggotkin', name: 'Plaguebearers', type: 'infantería', status: 'comprada', qty: 1, models: 10, pts: 130, paints: [] },
  ],
};

function PrototypeApp({
  dark = true,
  initialScreen = 'hoy',
  initialMiniId = null,
  initialSheet = null,
  initialPaintSheet = false,
  initialWishlist = false,
  initialIdeasOpen = false,    // abrir pantalla completa de Ideas
  initialIdeaActions = false,  // abrir sheet de acciones sobre la primera idea
  initialIdeaLink = false,     // abrir sheet de vincular mini
}) {
  const [tab, setTab] = useState(initialScreen);
  const [openMiniId, setOpenMiniId] = useState(initialMiniId);
  const [sheet, setSheet] = useState(initialSheet); // null | 'pick' | 'mini-search' | 'mini-confirm'
  const [paintSheet, setPaintSheet] = useState(initialPaintSheet);
  const [minis, setMinis] = useState(PROTOTYPE_DATA.minis);

  // Ideas state
  const [ideas, setIdeas] = useState(PROTO_IDEAS);
  const [ideasOpen, setIdeasOpen] = useState(initialIdeasOpen);
  const [activeIdeaId, setActiveIdeaId] = useState(initialIdeaActions ? PROTO_IDEAS[1].id : null);
  const [linkSheetOpen, setLinkSheetOpen] = useState(initialIdeaLink);
  const activeIdea = activeIdeaId ? ideas.find(i => i.id === activeIdeaId) : null;

  const openMini = openMiniId ? minis.find(m => m.id === openMiniId) : null;

  React.useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  const handleChangeStatus = (status) => {
    setMinis(ms => ms.map(m => m.id === openMiniId ? { ...m, status } : m));
  };

  const handleAddPaints = (newPaints) => {
    setMinis(ms => ms.map(m => {
      if (m.id !== openMiniId) return m;
      const existing = m.paints || [];
      const existingIds = new Set(existing.map(p => p.id));
      const additions = newPaints.filter(p => !existingIds.has(p.id));
      return { ...m, paints: [...existing, ...additions] };
    }));
  };

  const handleRemovePaint = (paintId) => {
    setMinis(ms => ms.map(m => {
      if (m.id !== openMiniId) return m;
      return { ...m, paints: (m.paints || []).filter(p => p.id !== paintId) };
    }));
  };

  // ─── Idea handlers ────────────────────────────────────────
  const addIdea = (text) => {
    const id = 'i' + Date.now();
    setIdeas(prev => [{ id, text, category: null, linkedMini: null }, ...prev]);
  };
  const updateIdea = (next) => {
    setIdeas(prev => prev.map(i => i.id === next.id ? next : i));
  };
  const deleteIdea = (id) => {
    setIdeas(prev => prev.filter(i => i.id !== id));
    setActiveIdeaId(null);
  };
  const linkIdeaToMini = (mini) => {
    if (!activeIdea) return;
    updateIdea({ ...activeIdea, linkedMini: mini ? { id: mini.id, name: mini.name, faction: mini.faction } : null });
  };

  // Minis disponibles para vincular (colección + wishlist mock)
  const linkableMinis = [
    ...minis.map(m => ({ ...m, wishlist: false })),
    { id: 'w1', name: "Be'lakor", faction: 'Slaves to Darkness', pts: 320, wishlist: true },
    { id: 'w2', name: 'Morathi-Khaine', faction: 'Daughters of Khaine', pts: 330, wishlist: true },
  ];

  return (
    <div className="phone-canvas">
      <div className="phone-scroll">
        {tab === 'hoy' && (
          <HoyScreen
            data={{ ...PROTOTYPE_DATA, minis }}
            onOpenMini={(m) => setOpenMiniId(m.id)}
            onContinue={(m) => setOpenMiniId(m.id)}
            ideas={ideas}
            onOpenIdea={(i) => setActiveIdeaId(i.id)}
            onAddIdea={addIdea}
            onSeeAllIdeas={() => setIdeasOpen(true)}
          />
        )}
        {tab === 'coleccion' && <PlaceholderScreen title="Colección" subtitle="Lista buscable de tu colección" />}
        {tab === 'pinturas'  && <PlaceholderScreen title="Pinturas" subtitle="Inventario de potes y rack" />}
        {tab === 'mas'       && <MasScreen />}
      </div>

      <BottomNav
        active={tab}
        onChange={setTab}
        onAdd={() => setSheet('pick')}
      />

      {openMini && (
        <MiniDetail
          mini={openMini}
          onClose={() => setOpenMiniId(null)}
          onChangeStatus={handleChangeStatus}
          onOpenPaintSheet={() => setPaintSheet(true)}
          onRemovePaint={handleRemovePaint}
          onSaveRecipe={() => { /* abrir flow "Guardar como receta" — fuera de scope */ }}
        />
      )}

      <QuickAddSheet
        open={!!sheet}
        step={sheet}
        onSetStep={setSheet}
        onClose={() => setSheet(null)}
        onSave={() => setSheet(null)}
        initialWishlist={initialWishlist}
      />

      <PaintLinkSheet
        open={paintSheet && !!openMini}
        onClose={() => setPaintSheet(false)}
        onAdd={(paintsToAdd) => handleAddPaints(paintsToAdd)}
        paints={PROTOTYPE_DATA.paints}
        recipes={PROTOTYPE_DATA.recipes}
        existingIds={(openMini?.paints || []).map(p => p.id)}
      />

      {ideasOpen && (
        <IdeasScreen
          ideas={ideas}
          onAddIdea={addIdea}
          onOpenIdea={(i) => setActiveIdeaId(i.id)}
          onClose={() => setIdeasOpen(false)}
        />
      )}

      <IdeaActionsSheet
        open={!!activeIdea && !linkSheetOpen}
        idea={activeIdea}
        onClose={() => setActiveIdeaId(null)}
        onUpdate={updateIdea}
        onLinkMini={() => setLinkSheetOpen(true)}
        onPromoteSession={() => { /* abriría QuickAdd con sesión prellenada */ setActiveIdeaId(null); }}
        onPromoteProject={() => { /* abriría flow proyecto */ setActiveIdeaId(null); }}
        onDelete={() => activeIdea && deleteIdea(activeIdea.id)}
      />

      <LinkMiniSheet
        open={linkSheetOpen}
        onClose={() => setLinkSheetOpen(false)}
        onLink={linkIdeaToMini}
        minis={linkableMinis}
        currentLinkedId={activeIdea?.linkedMini?.id || null}
      />
    </div>
  );
}

function PlaceholderScreen({ title, subtitle }) {
  return (
    <>
      <div className="r-topbar">
        <div className="r-topbar-title">{title}</div>
      </div>
      <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--fg3)', fontSize: 13 }}>
        {subtitle}<br/>
        <span style={{fontSize:11, opacity:0.7}}>(fuera del scope de este prototipo)</span>
      </div>
    </>
  );
}

function MasScreen() {
  const items = [
    { name: 'Estadísticas', desc: 'Tu progreso global y por juego', glyph: '◴' },
    { name: 'Wishlist', desc: 'Lo que quieres en algún momento', glyph: '✦' },
    { name: 'Listas de ejército', desc: 'Battlescribe + manual', glyph: '☰' },
    { name: 'Recetas de pintura', desc: 'Pasos y esquemas guardados', glyph: '⌘' },
    { name: 'Pareja', desc: 'Sugerencias de regalo', glyph: '♡' },
    { name: 'Ajustes', desc: 'Tema, cuenta, exportar', glyph: '⚙' },
  ];
  return (
    <>
      <div className="r-topbar">
        <div className="r-topbar-title">Más</div>
      </div>
      <div className="r-plan" style={{margin: '8px 18px 18px'}}>
        {items.map((it, i) => (
          <div className="r-plan-row" key={i}>
            <div className="r-plan-icon info" style={{fontSize: 18}}>{it.glyph}</div>
            <div className="r-plan-body">
              <div className="r-plan-title">{it.name}</div>
              <div className="r-plan-desc">{it.desc}</div>
            </div>
            <div className="r-plan-chev">›</div>
          </div>
        ))}
      </div>
    </>
  );
}

Object.assign(window, { PrototypeApp, PROTO_IDEAS });
