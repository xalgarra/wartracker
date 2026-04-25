// ===== VARIATION A — MINIMAL REFINADO =====
// Inter, paleta gris cálida casi blanca, badges sutiles, jerarquía limpia
// Acento monocromo + diferenciación 40K/AoS por color de etiqueta

const VarA = (() => {
  const { useState } = React;
  const D = window.WT_DATA;
  const H = window.WT_HELPERS;

  const styles = `
    .va { font-family: 'Inter', system-ui, sans-serif; color: #1a1a1c; background: #fafaf8; height: 100%; --accent: oklch(0.55 0.02 80); }
    .va * { box-sizing: border-box; }
    .va-frame { background: #fafaf8; height: 100%; overflow-y: auto; }

    /* Header */
    .va-hdr { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #ececea; background: #fafaf8; position: sticky; top: 0; z-index: 5; }
    .va-logo { display: flex; align-items: baseline; gap: 6px; }
    .va-logo-mark { font-weight: 700; font-size: 17px; letter-spacing: -0.02em; }
    .va-logo-dot { width: 6px; height: 6px; background: oklch(0.55 0.14 30); border-radius: 50%; display: inline-block; }
    .va-hdr-actions { display: flex; gap: 12px; align-items: center; }
    .va-hdr-icon { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #ececea; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; }

    /* Tabs */
    .va-tabs { display: flex; padding: 0 16px; gap: 4px; border-bottom: 1px solid #ececea; background: #fafaf8; }
    .va-tab { padding: 10px 14px; font-size: 13px; color: #888884; border-bottom: 2px solid transparent; cursor: pointer; font-weight: 500; }
    .va-tab.active { color: #1a1a1c; border-bottom-color: #1a1a1c; }

    /* Filtros */
    .va-filters { padding: 12px 16px; display: flex; gap: 8px; flex-wrap: wrap; border-bottom: 1px solid #ececea; }
    .va-chip { padding: 5px 11px; border-radius: 999px; border: 1px solid #ececea; background: white; font-size: 12px; color: #555550; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
    .va-chip.active { background: #1a1a1c; color: white; border-color: #1a1a1c; }
    .va-search { flex: 1; min-width: 140px; padding: 6px 11px; border-radius: 999px; border: 1px solid #ececea; background: white; font-size: 12px; color: #1a1a1c; }
    .va-sort { display: flex; align-items: center; gap: 6px; padding: 0 16px 10px; font-size: 11px; color: #888884; }
    .va-sort-pill { padding: 3px 9px; border-radius: 999px; cursor: pointer; }
    .va-sort-pill.active { background: #1a1a1c; color: white; }

    /* Cards de minis */
    .va-list { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .va-card { background: white; border: 1px solid #ececea; border-radius: 12px; padding: 12px; display: flex; gap: 12px; cursor: pointer; transition: border-color 0.15s; }
    .va-card:hover { border-color: #d8d8d4; }
    .va-thumb { width: 64px; height: 64px; border-radius: 8px; flex-shrink: 0; background: repeating-linear-gradient(45deg, #f0efeb, #f0efeb 6px, #e8e7e3 6px, #e8e7e3 12px); display: flex; align-items: center; justify-content: center; font-size: 9px; color: #aaa8a3; font-family: 'JetBrains Mono', monospace; }
    .va-card-body { flex: 1; min-width: 0; }
    .va-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
    .va-card-name { font-size: 14px; font-weight: 600; line-height: 1.3; }
    .va-card-alt { font-size: 11px; color: #888884; margin-top: 2px; font-style: italic; }
    .va-card-fact { font-size: 11px; color: #888884; margin-bottom: 8px; }
    .va-card-bottom { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
    .va-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .va-tag { font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 500; letter-spacing: 0.01em; }
    .va-tag.game-40k { background: oklch(0.95 0.03 30); color: oklch(0.4 0.1 30); }
    .va-tag.game-aos { background: oklch(0.95 0.03 195); color: oklch(0.4 0.08 195); }
    .va-tag.type { background: #f3f2ee; color: #6a6a64; }
    .va-tag.status-comprada  { background: #f3f2ee; color: #6a6a64; }
    .va-tag.status-montada   { background: oklch(0.95 0.04 60);  color: oklch(0.45 0.1 60); }
    .va-tag.status-imprimada { background: oklch(0.95 0.03 240); color: oklch(0.45 0.1 240); }
    .va-tag.status-pintando  { background: oklch(0.94 0.04 305); color: oklch(0.45 0.12 305); }
    .va-tag.status-pintada   { background: oklch(0.94 0.05 145); color: oklch(0.4 0.13 145); }
    .va-card-pts { font-size: 11px; color: #888884; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }

    /* FAB */
    .va-fab { position: absolute; bottom: 20px; right: 20px; width: 48px; height: 48px; border-radius: 50%; background: #1a1a1c; color: white; border: none; font-size: 22px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; }

    /* Login */
    .va-login { padding: 48px 24px; max-width: 360px; margin: 0 auto; }
    .va-login h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
    .va-login .sub { font-size: 13px; color: #888884; margin-bottom: 28px; }
    .va-input { width: 100%; padding: 11px 13px; border: 1px solid #ececea; border-radius: 10px; font-size: 13px; background: white; margin-bottom: 10px; font-family: inherit; color: #1a1a1c; }
    .va-input:focus { outline: none; border-color: #1a1a1c; }
    .va-btn { width: 100%; padding: 11px; background: #1a1a1c; color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }

    /* Stats */
    .va-stats { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .va-summary { background: white; border: 1px solid #ececea; border-radius: 14px; padding: 18px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; }
    .va-summary-val { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .va-summary-pct { color: oklch(0.5 0.15 145); }
    .va-summary-lbl { font-size: 10px; color: #888884; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
    .va-game-card { background: white; border: 1px solid #ececea; border-radius: 14px; padding: 16px; }
    .va-game-card h3 { font-size: 13px; font-weight: 600; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: baseline; }
    .va-game-card h3 .total { font-size: 11px; color: #888884; font-weight: 400; font-family: 'JetBrains Mono', monospace; }
    .va-faction-row { padding: 10px 0; border-top: 1px solid #f3f2ee; }
    .va-faction-row:first-child { border-top: none; padding-top: 0; }
    .va-faction-line { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
    .va-faction-name { font-size: 12px; font-weight: 500; }
    .va-faction-pts { font-size: 11px; color: #888884; font-family: 'JetBrains Mono', monospace; }
    .va-faction-pts strong { color: oklch(0.5 0.15 145); font-weight: 600; }
    .va-progress { height: 5px; background: #f3f2ee; border-radius: 3px; overflow: hidden; display: flex; gap: 1px; }
    .va-progress-seg { height: 100%; }
    .va-progress-seg.comprada  { background: #c8c6c0; }
    .va-progress-seg.montada   { background: oklch(0.7 0.13 60); }
    .va-progress-seg.imprimada { background: oklch(0.65 0.12 240); }
    .va-progress-seg.pintando  { background: oklch(0.6 0.15 305); }
    .va-progress-seg.pintada   { background: oklch(0.55 0.15 145); }

    /* Pinturas */
    .va-paints { padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; }
    .va-paint { background: white; border: 1px solid #ececea; border-radius: 8px; padding: 8px 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .va-paint:hover { border-color: #d8d8d4; }
    .va-swatch { width: 22px; height: 22px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.08); flex-shrink: 0; }
    .va-paint-info { flex: 1; min-width: 0; }
    .va-paint-name { font-size: 12px; font-weight: 600; line-height: 1.2; }
    .va-paint-brand { font-size: 10px; color: #888884; }
    .va-paint-tag { font-size: 9px; padding: 2px 6px; border-radius: 3px; background: #f3f2ee; color: #6a6a64; text-transform: uppercase; letter-spacing: 0.04em; }

    /* Modal */
    .va-modal-bg { position: absolute; inset: 0; background: rgba(20,20,20,0.4); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
    .va-modal-bg.center { align-items: center; }
    .va-modal { background: white; border-radius: 18px 18px 0 0; padding: 20px; width: 100%; max-height: 88%; overflow-y: auto; }
    .va-modal.center { border-radius: 18px; max-width: 480px; }
    .va-modal h2 { font-size: 17px; font-weight: 700; margin-bottom: 14px; letter-spacing: -0.01em; }
    .va-photo-slot { aspect-ratio: 4/3; border-radius: 10px; background: repeating-linear-gradient(45deg, #f3f2ee, #f3f2ee 8px, #ececea 8px, #ececea 16px); display: flex; align-items: center; justify-content: center; font-size: 10px; color: #aaa8a3; font-family: 'JetBrains Mono', monospace; margin-bottom: 12px; }
    .va-label { font-size: 10px; color: #888884; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; margin-top: 8px; display: block; }
    .va-modal-actions { display: flex; gap: 8px; margin-top: 14px; }
    .va-modal-actions .secondary { flex: 0; padding: 11px 16px; background: #f3f2ee; color: #1a1a1c; border-radius: 10px; border: none; font-size: 13px; cursor: pointer; }

    /* Wishlist */
    .va-wishlist { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .va-wish-item { background: white; border: 1px solid #ececea; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .va-wish-name { font-size: 13px; font-weight: 600; }
    .va-wish-meta { font-size: 11px; color: #888884; margin-top: 2px; }
    .va-wish-pts { font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #555550; }

    /* Section heading */
    .va-section-h { font-size: 11px; color: #888884; text-transform: uppercase; letter-spacing: 0.08em; padding: 14px 16px 4px; }
  `;

  function Tag({ kind, children }) {
    return <span className={`va-tag ${kind}`}>{children}</span>;
  }

  function Card({ m }) {
    const game = D.games.find(g => g.slug === m.game);
    return (
      <div className="va-card">
        <div className="va-thumb">photo</div>
        <div className="va-card-body">
          <div className="va-card-top">
            <div>
              <div className="va-card-name">{m.name}</div>
              {m.alt && <div className="va-card-alt">"{m.alt}"</div>}
            </div>
            <Tag kind={`status-${m.status}`}>{H.statusLabel[m.status]}</Tag>
          </div>
          <div className="va-card-fact">{m.factions.join(" · ")}</div>
          <div className="va-card-bottom">
            <div className="va-tags">
              <Tag kind={`game-${m.game}`}>{game.short}</Tag>
              {m.type && <Tag kind="type">{m.type}</Tag>}
            </div>
            <span className="va-card-pts">{m.qty} × {m.points}pt</span>
          </div>
        </div>
      </div>
    );
  }

  function StatusBadge({ status }) {
    return <Tag kind={`status-${status}`}>{H.statusLabel[status]}</Tag>;
  }

  function Coleccion() {
    return (
      <>
        <div className="va-filters">
          <span className="va-chip active">Todos los juegos</span>
          <span className="va-chip">Todas facciones</span>
          <span className="va-chip">Todos estados</span>
          <input className="va-search" placeholder="Buscar…" />
        </div>
        <div className="va-sort">
          <span>Ordenar</span>
          <span className="va-sort-pill active">Reciente ↓</span>
          <span className="va-sort-pill">Nombre</span>
          <span className="va-sort-pill">Estado</span>
        </div>
        <div className="va-list">
          {D.minis.map(m => <Card key={m.id} m={m} />)}
        </div>
      </>
    );
  }

  function Stats() {
    const stats = H.computeStats(D.minis);
    return (
      <div className="va-stats">
        <div className="va-summary">
          <div>
            <div className="va-summary-val">{stats.totalUnits}</div>
            <div className="va-summary-lbl">Unidades</div>
          </div>
          <div>
            <div className="va-summary-val">{stats.totalPts}</div>
            <div className="va-summary-lbl">Puntos totales</div>
          </div>
          <div>
            <div className="va-summary-val va-summary-pct">{Math.round(stats.paintedPts / stats.totalPts * 100)}%</div>
            <div className="va-summary-lbl">Pintado</div>
          </div>
        </div>
        {Object.entries(stats.byGame).map(([gameSlug, factionsObj]) => {
          const game = D.games.find(g => g.slug === gameSlug);
          const totalGame = Object.values(factionsObj).reduce((a, x) => a + x.pts, 0);
          return (
            <div className="va-game-card" key={gameSlug}>
              <h3>
                {game.name}
                <span className="total">{totalGame}pt</span>
              </h3>
              {Object.entries(factionsObj).map(([fname, f]) => {
                const pct = Math.round(f.painted / f.pts * 100);
                return (
                  <div className="va-faction-row" key={fname}>
                    <div className="va-faction-line">
                      <span className="va-faction-name">{fname}</span>
                      <span className="va-faction-pts"><strong>{f.painted}</strong>/{f.pts}pt · {pct}%</span>
                    </div>
                    <div className="va-progress">
                      {H.statusOrder.map(s => {
                        const v = (f.byStatus[s] || 0) / f.pts * 100;
                        return v > 0 ? <div key={s} className={`va-progress-seg ${s}`} style={{ width: `${v}%` }} /> : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  function Wishlist() {
    return (
      <div className="va-wishlist">
        {D.wishlist.map(w => {
          const g = D.games.find(x => x.slug === w.game);
          return (
            <div className="va-wish-item" key={w.id}>
              <div>
                <div className="va-wish-name">{w.name}</div>
                <div className="va-wish-meta">{w.factions.join(", ")} · {g.short}</div>
                {w.notes && <div className="va-wish-meta" style={{ marginTop: 4, fontStyle: "italic" }}>{w.notes}</div>}
              </div>
              <span className="va-wish-pts">{w.points}pt</span>
            </div>
          );
        })}
      </div>
    );
  }

  function Pinturas() {
    return (
      <>
        <div className="va-filters">
          <span className="va-chip active">Todos los tipos</span>
          <span className="va-chip">Todas</span>
          <input className="va-search" placeholder="Buscar pintura…" />
        </div>
        <div className="va-paints">
          {D.pinturas.map(p => (
            <div className="va-paint" key={p.id}>
              <div className="va-swatch" style={{ background: p.color || "#f3f2ee" }} />
              <div className="va-paint-info">
                <div className="va-paint-name">{p.name}</div>
                <div className="va-paint-brand">{p.brand}{!p.stock ? " · sin stock" : ""}</div>
              </div>
              <span className="va-paint-tag">{p.type}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  function Login() {
    return (
      <div className="va-login">
        <h1>WarTracker</h1>
        <div className="sub">Tu colección, en orden.</div>
        <input className="va-input" placeholder="Email" defaultValue="alex@wartracker.app" />
        <input className="va-input" placeholder="Contraseña" type="password" defaultValue="••••••••" />
        <button className="va-btn">Entrar</button>
      </div>
    );
  }

  function Modal({ centered }) {
    return (
      <div className={`va-modal-bg ${centered ? "center" : ""}`}>
        <div className={`va-modal ${centered ? "center" : ""}`}>
          <h2>Añadir miniatura</h2>
          <div className="va-photo-slot">photo · 4:3</div>
          <label className="va-label">Juego</label>
          <select className="va-input"><option>Warhammer 40K</option></select>
          <label className="va-label">Facción</label>
          <select className="va-input"><option>Space Marines</option></select>
          <label className="va-label">Unidad</label>
          <select className="va-input"><option>Intercessors</option></select>
          <label className="va-label">Cantidad / Modelos</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="va-input" defaultValue="1" style={{ flex: 1, marginBottom: 0 }} />
            <input className="va-input" defaultValue="10" style={{ flex: 1, marginBottom: 0 }} />
          </div>
          <label className="va-label">Estado</label>
          <select className="va-input"><option>Imprimada</option></select>
          <div className="va-modal-actions">
            <button className="secondary">Cancelar</button>
            <button className="va-btn">Guardar</button>
          </div>
        </div>
      </div>
    );
  }

  function Frame({ children, hideTabs, activeTab = "coleccion", showFab = true, showModal }) {
    return (
      <div className="va va-frame" style={{ position: "relative" }}>
        <div className="va-hdr">
          <div className="va-logo">
            <span className="va-logo-dot" />
            <span className="va-logo-mark">WarTracker</span>
          </div>
          <div className="va-hdr-actions">
            <div className="va-hdr-icon">☾</div>
            <div className="va-hdr-icon" style={{ width: "auto", padding: "0 10px", fontSize: 11 }}>Salir</div>
          </div>
        </div>
        {!hideTabs && (
          <div className="va-tabs">
            <span className={`va-tab ${activeTab === "coleccion" ? "active" : ""}`}>Colección</span>
            <span className={`va-tab ${activeTab === "stats" ? "active" : ""}`}>Estadísticas</span>
            <span className={`va-tab ${activeTab === "wishlist" ? "active" : ""}`}>Wishlist</span>
            <span className={`va-tab ${activeTab === "pinturas" ? "active" : ""}`}>Pinturas</span>
          </div>
        )}
        {children}
        {showFab && <button className="va-fab">+</button>}
        {showModal && <Modal centered={showModal === "center"} />}
      </div>
    );
  }

  return { Frame, Login, Coleccion, Stats, Wishlist, Pinturas, Modal, styles };
})();

window.VarA = VarA;
