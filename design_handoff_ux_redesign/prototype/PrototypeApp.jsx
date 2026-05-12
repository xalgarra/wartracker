/* global React, IOSDevice, BottomNav, HoyScreen, MiniDetail, QuickAddSheet */
// =============================================================
// PrototypeApp — the redesigned WarTracker app, running in iOS
// =============================================================
const { useState } = React;

const PROTOTYPE_DATA = {
  minis: [
    { id: 'm1', game: '40K', faction: 'Space Marines', name: 'Redemptor Dreadnought', type: 'élite', status: 'pintando', qty: 1, models: 1, pts: 210 },
    { id: 'm2', game: '40K', faction: 'Space Marines', name: 'Intercessors', name_custom: 'Squad Vex', type: 'infantería', status: 'pintada', qty: 2, models: 10, pts: 80 },
    { id: 'm3', game: '40K', faction: 'Necrons', name: 'Lokhust Destroyers', type: 'élite', status: 'montada', qty: 1, models: 3, pts: 165 },
    { id: 'm4', game: 'AoS', faction: 'Stormcast Eternals', name: 'Liberators', type: 'infantería', status: 'imprimada', qty: 2, models: 5, pts: 110 },
    { id: 'm5', game: 'AoS', faction: 'Maggotkin', name: 'Plaguebearers', type: 'infantería', status: 'comprada', qty: 1, models: 10, pts: 130 },
  ],
};

function PrototypeApp({ dark = true, initialScreen = 'hoy', initialMiniId = null, initialSheet = null }) {
  const [tab, setTab] = useState(initialScreen);
  const [openMini, setOpenMini] = useState(initialMiniId ? PROTOTYPE_DATA.minis.find(m => m.id === initialMiniId) : null);
  const [sheet, setSheet] = useState(initialSheet); // null | 'pick' | 'mini-search' | 'mini-confirm'
  const [minis, setMinis] = useState(PROTOTYPE_DATA.minis);

  React.useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  const handleChangeStatus = (status) => {
    setMinis(ms => ms.map(m => m.id === openMini.id ? { ...m, status } : m));
    setOpenMini(m => m ? { ...m, status } : m);
  };

  return (
    <div className="phone-canvas">
      <div className="phone-scroll">
        {tab === 'hoy' && (
          <HoyScreen
            data={{ ...PROTOTYPE_DATA, minis }}
            onOpenMini={(m) => setOpenMini(m)}
            onContinue={(m) => setOpenMini(m)}
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
          onClose={() => setOpenMini(null)}
          onChangeStatus={handleChangeStatus}
        />
      )}

      <QuickAddSheet
        open={!!sheet}
        step={sheet}
        onSetStep={setSheet}
        onClose={() => setSheet(null)}
        onSave={() => setSheet(null)}
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

Object.assign(window, { PrototypeApp });
