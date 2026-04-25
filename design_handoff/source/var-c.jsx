// ===== VARIATION C — OSCURO ATMOSFÉRICO =====
// Space Grotesk + JetBrains Mono, fondo casi negro con tinte cálido, acento ámbar/brasa
// Datos en mono, sensación de terminal de operaciones / brief táctico

const VarC = (() => {
  const D = window.WT_DATA;
  const H = window.WT_HELPERS;

  const styles = `
    .vc { font-family: 'Space Grotesk', system-ui, sans-serif; color: #e8e4dc; background: #14110d; height: 100%; }
    .vc * { box-sizing: border-box; }
    .vc-frame { background: #14110d; height: 100%; overflow-y: auto; position: relative; }
    .vc-mono { font-family: 'JetBrains Mono', monospace; }

    /* Header */
    .vc-hdr { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #2a251c; background: linear-gradient(to bottom, #1a160f, #14110d); position: sticky; top: 0; z-index: 5; }
    .vc-logo { display: flex; align-items: center; gap: 8px; }
    .vc-logo-glyph { width: 18px; height: 18px; border-radius: 50%; background: oklch(0.65 0.15 60); box-shadow: 0 0 10px oklch(0.65 0.15 60 / 0.6); }
    .vc-logo-mark { font-weight: 600; font-size: 14px; letter-spacing: 0.04em; text-transform: uppercase; }
    .vc-hdr-status { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #7a7060; margin-left: 12px; }
    .vc-hdr-status .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: oklch(0.65 0.18 145); margin-right: 4px; vertical-align: middle; }
    .vc-hdr-actions { display: flex; gap: 12px; align-items: center; }
    .vc-hdr-icon { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7a7060; cursor: pointer; padding: 4px 8px; border: 1px solid #2a251c; border-radius: 3px; }
    .vc-hdr-icon:hover { color: #e8e4dc; border-color: #4a4030; }

    /* Tabs */
    .vc-tabs { display: flex; padding: 8px 18px; gap: 6px; border-bottom: 1px solid #2a251c; background: #14110d; }
    .vc-tab { padding: 6px 14px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 500; color: #a09684; cursor: pointer; border-radius: 999px; background: transparent; }
    .vc-tab.active { color: #14110d; background: oklch(0.65 0.15 60); }
    .vc-tab .vc-tab-c { color: #7a7060; margin-right: 5px; font-family: 'JetBrains Mono', monospace; font-size: 9px; }
    .vc-tab.active .vc-tab-c { color: oklch(0.3 0.05 60); }

    /* Filtros */
    .vc-filters { padding: 12px 18px; display: flex; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid #1f1c15; }
    .vc-chip { padding: 5px 13px; font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 500; color: #a09684; border: 1px solid #2a251c; background: #1a160f; cursor: pointer; border-radius: 999px; }
    .vc-chip.active { background: oklch(0.65 0.15 60); color: #14110d; border-color: oklch(0.65 0.15 60); }
    .vc-search { flex: 1; min-width: 140px; padding: 5px 13px; border: 1px solid #2a251c; background: #1a160f; font-size: 11px; border-radius: 999px; color: #e8e4dc; font-family: 'Space Grotesk', sans-serif; }

    /* Sort bar */
    .vc-sort-bar { display: flex; align-items: center; gap: 6px; padding: 8px 18px; flex-wrap: wrap; border-bottom: 1px solid #1f1c15; }
    .vc-sort-l { font-size: 11px; color: #7a7060; margin-right: 4px; }
    .vc-sort-pill { cursor: pointer; }

    /* Cards = registro táctico */
    .vc-list { padding: 0; }
    .vc-row { padding: 12px 18px; border-bottom: 1px solid #1f1c15; display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; align-items: center; cursor: pointer; transition: background 0.15s; }
    .vc-row:hover { background: #1a160f; }
    .vc-row-photo { width: 56px; height: 56px; border-radius: 4px; background: linear-gradient(135deg, #2a251c 25%, transparent 25%, transparent 75%, #2a251c 75%), linear-gradient(135deg, #2a251c 25%, transparent 25%, transparent 75%, #2a251c 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px; background-color: #1a160f; border: 1px solid #2a251c; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 8px; color: #4a4030; }
    .vc-row-mid { min-width: 0; }
    .vc-row-name { font-size: 14px; font-weight: 500; letter-spacing: -0.01em; }
    .vc-row-alt { font-size: 11px; color: #7a7060; font-style: italic; }
    .vc-row-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7a7060; margin-top: 4px; display: flex; gap: 8px; flex-wrap: wrap; }
    .vc-row-meta .sep { color: #4a4030; }
    .vc-row-meta .game-40k { color: oklch(0.7 0.15 30); }
    .vc-row-meta .game-aos { color: oklch(0.7 0.12 195); }
    .vc-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .vc-status { font-family: 'Space Grotesk', sans-serif; font-size: 10px; padding: 3px 10px; border-radius: 999px; font-weight: 600; letter-spacing: 0.01em; }
    .vc-status.comprada  { background: #2a251c; color: #a09684; }
    .vc-status.montada   { background: oklch(0.32 0.08 60);  color: oklch(0.82 0.13 60); }
    .vc-status.imprimada { background: oklch(0.3 0.08 240);  color: oklch(0.82 0.12 240); }
    .vc-status.pintando  { background: oklch(0.32 0.1 305);  color: oklch(0.84 0.13 305); }
    .vc-status.pintada   { background: oklch(0.42 0.15 145); color: oklch(0.96 0.08 145); box-shadow: 0 0 10px oklch(0.5 0.15 145 / 0.35); }
    .vc-pill { display: inline-block; padding: 2px 9px; border-radius: 999px; font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 500; white-space: nowrap; }
    .vc-pill.game-40k { background: oklch(0.28 0.08 30); color: oklch(0.82 0.14 30); }
    .vc-pill.game-aos { background: oklch(0.26 0.06 195); color: oklch(0.82 0.12 195); }
    .vc-pill.type     { background: #2a251c; color: #c8bfa8; }
    .vc-row-pts { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #c8bfa8; }
    .vc-row-pts strong { color: oklch(0.75 0.15 60); }

    /* Login */
    .vc-login { padding: 50px 28px; max-width: 380px; margin: 0 auto; }
    .vc-login-eye { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #7a7060; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 24px; }
    .vc-login-eye .blink { color: oklch(0.7 0.15 60); animation: vcblink 1.4s infinite; }
    @keyframes vcblink { 50% { opacity: 0.2; } }
    .vc-login h1 { font-size: 38px; font-weight: 500; letter-spacing: -0.03em; line-height: 1; margin-bottom: 8px; }
    .vc-login h1 .accent { color: oklch(0.7 0.15 60); }
    .vc-login .sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #7a7060; margin-bottom: 30px; }
    .vc-input { width: 100%; padding: 11px 13px; border: 1px solid #2a251c; background: #1a160f; font-size: 12px; margin-bottom: 10px; font-family: 'JetBrains Mono', monospace; color: #e8e4dc; border-radius: 3px; }
    .vc-input:focus { outline: none; border-color: oklch(0.65 0.15 60); }
    .vc-btn { width: 100%; padding: 12px; background: oklch(0.65 0.15 60); color: #14110d; border: none; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; cursor: pointer; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.1em; }

    /* Stats */
    .vc-stats { padding: 16px 18px 20px; display: flex; flex-direction: column; gap: 14px; }
    .vc-summary { background: #1a160f; border: 1px solid #2a251c; border-radius: 4px; padding: 16px; }
    .vc-summary-eye { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #7a7060; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
    .vc-summary-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .vc-summary-cell { }
    .vc-summary-val { font-size: 26px; font-weight: 500; letter-spacing: -0.02em; line-height: 1; }
    .vc-summary-val.accent { color: oklch(0.7 0.15 145); }
    .vc-summary-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #7a7060; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px; }
    .vc-game-card { background: #1a160f; border: 1px solid #2a251c; border-radius: 4px; padding: 14px; }
    .vc-game-h { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 10px; border-bottom: 1px solid #2a251c; margin-bottom: 10px; }
    .vc-game-h-name { font-size: 14px; font-weight: 500; letter-spacing: -0.01em; }
    .vc-game-h-pts { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7a7060; }
    .vc-fac-det { padding: 12px 0; border-top: 1px solid #1f1c15; }
    .vc-fac-det:first-of-type { border-top: none; padding-top: 4px; }
    .vc-fac-det summary { list-style: none; cursor: pointer; }
    .vc-fac-det summary::-webkit-details-marker { display: none; }
    .vc-fac-sum { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
    .vc-fac-sum-l { min-width: 0; }
    .vc-fac-sum-r { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .vc-fac-name { font-size: 13px; font-weight: 600; display: block; letter-spacing: -0.01em; }
    .vc-fac-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7a7060; display: block; margin-top: 2px; }
    .vc-fac-pts { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #c8bfa8; }
    .vc-fac-pts .accent { color: oklch(0.78 0.15 145); }
    .vc-chevron { color: #4a4030; font-size: 14px; transition: transform 0.2s; }
    .vc-fac-det[open] .vc-chevron { transform: rotate(180deg); }
    .vc-leyenda { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #a09684; }
    .vc-leyenda-i { display: inline-flex; align-items: center; gap: 5px; }
    .vc-leyenda-d { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
    .vc-leyenda-d.comprada  { background: #4a4030; }
    .vc-leyenda-d.montada   { background: oklch(0.6 0.13 60); }
    .vc-leyenda-d.imprimada { background: oklch(0.6 0.12 240); }
    .vc-leyenda-d.pintando  { background: oklch(0.6 0.15 305); }
    .vc-leyenda-d.pintada   { background: oklch(0.65 0.16 145); }
    .vc-mini-list { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #2a251c; display: flex; flex-direction: column; gap: 5px; }
    .vc-mini-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 4px 0; }
    .vc-mini-l { min-width: 0; flex: 1; }
    .vc-mini-n { font-size: 12px; color: #e8e4dc; }
    .vc-mini-mod { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7a7060; margin-left: 5px; }
    .vc-mini-r { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .vc-mini-pts { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #a09684; }
    .vc-bar { height: 4px; background: #14110d; border-radius: 2px; display: flex; gap: 1px; overflow: hidden; }
    .vc-bar-seg { height: 100%; }
    .vc-bar-seg.comprada  { background: #4a4030; }
    .vc-bar-seg.montada   { background: oklch(0.6 0.13 60); }
    .vc-bar-seg.imprimada { background: oklch(0.6 0.12 240); }
    .vc-bar-seg.pintando  { background: oklch(0.6 0.15 305); }
    .vc-bar-seg.pintada   { background: oklch(0.65 0.16 145); }

    /* Pinturas */
    .vc-paints { padding: 0; }
    .vc-paint { padding: 8px 18px; border-bottom: 1px solid #1f1c15; display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .vc-paint:hover { background: #1a160f; }
    .vc-swatch { width: 22px; height: 22px; border-radius: 50%; border: 1px solid #2a251c; flex-shrink: 0; }
    .vc-paint-info { flex: 1; min-width: 0; }
    .vc-paint-n { font-size: 12px; line-height: 1.2; }
    .vc-paint-b { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #7a7060; text-transform: uppercase; letter-spacing: 0.04em; }
    .vc-paint-t { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 500; color: oklch(0.78 0.13 60); padding: 2px 10px; background: oklch(0.28 0.08 60); border-radius: 999px; }
    .vc-paint .out { color: #4a4030; text-decoration: line-through; }

    /* Wishlist */
    .vc-wishlist { padding: 0; }
    .vc-wish { padding: 12px 18px; border-bottom: 1px solid #1f1c15; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .vc-wish-n { font-size: 13px; }
    .vc-wish-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #7a7060; margin-top: 3px; }
    .vc-wish-pts { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: oklch(0.7 0.15 60); }

    /* FAB */
    .vc-fab { position: absolute; bottom: 20px; right: 20px; width: 50px; height: 50px; border-radius: 50%; background: oklch(0.65 0.15 60); color: #14110d; border: none; font-size: 22px; font-weight: 500; cursor: pointer; box-shadow: 0 0 20px oklch(0.65 0.15 60 / 0.4), 0 4px 12px rgba(0,0,0,0.5); }

    /* Modal */
    .vc-modal-bg { position: absolute; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(2px); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
    .vc-modal-bg.center { align-items: center; }
    .vc-modal { background: #1a160f; padding: 22px; width: 100%; max-height: 90%; overflow-y: auto; border-top: 1px solid oklch(0.65 0.15 60 / 0.5); }
    .vc-modal.center { max-width: 480px; border: 1px solid #2a251c; border-top: 1px solid oklch(0.65 0.15 60 / 0.5); border-radius: 4px; }
    .vc-modal-h { font-size: 18px; font-weight: 500; margin-bottom: 4px; letter-spacing: -0.01em; }
    .vc-modal-eye { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: oklch(0.7 0.15 60); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 16px; }
    .vc-photo-slot { aspect-ratio: 4/3; background: #14110d; border: 1px dashed #2a251c; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #4a4030; margin-bottom: 14px; border-radius: 3px; }
    .vc-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #7a7060; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; margin-top: 8px; display: block; }
    .vc-modal-actions { display: flex; gap: 8px; margin-top: 18px; }
    .vc-modal-actions .secondary { padding: 11px 16px; background: transparent; color: #a09684; border: 1px solid #2a251c; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-size: 10px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.1em; }
  `;

  function Row({ m }) {
    const game = window.WT_DATA.games.find(g => g.slug === m.game);
    return (
      <div className="vc-row">
        <div className="vc-row-photo">img</div>
        <div className="vc-row-mid">
          <div className="vc-row-name">{m.name}{m.alt && <span className="vc-row-alt"> · "{m.alt}"</span>}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
            <span className={`vc-pill game-${m.game}`}>{game.short}</span>
            {m.type && <span className="vc-pill type">{m.type}</span>}
            <span style={{ fontSize: 11, color: '#7a7060' }}>{m.factions.join(' + ')}</span>
          </div>
        </div>
        <div className="vc-row-right">
          <span className={`vc-status ${m.status}`}>{H.statusLabel[m.status]}</span>
          <span className="vc-row-pts">{m.qty}× <strong>{m.points}pt</strong></span>
        </div>
      </div>
    );
  }

  function Coleccion() {
    const [sort, setSort] = React.useState('reciente');
    const [dir, setDir] = React.useState('desc');
    const sorts = [
      { key: 'reciente', label: 'Reciente' },
      { key: 'nombre',   label: 'Nombre' },
      { key: 'estado',   label: 'Estado' },
      { key: 'juego',    label: 'Juego' },
    ];
    const onSort = k => {
      if (k === sort) setDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSort(k); setDir(k === 'reciente' ? 'desc' : 'asc'); }
    };
    return (
      <>
        <div className="vc-filters">
          <span className="vc-chip active">All</span>
          <span className="vc-chip">40K</span>
          <span className="vc-chip">AoS</span>
          <span className="vc-chip">Pintada</span>
          <span className="vc-chip">Pendiente</span>
          <input className="vc-search" placeholder="// search…" />
        </div>
        <div className="vc-sort-bar">
          <span className="vc-sort-l">Ordenar:</span>
          {sorts.map(s => {
            const active = sort === s.key;
            return (
              <span
                key={s.key}
                className={`vc-chip vc-sort-pill ${active ? 'active' : ''}`}
                onClick={() => onSort(s.key)}
              >
                {s.label}{active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
              </span>
            );
          })}
        </div>
        <div className="vc-list">
          {window.WT_DATA.minis.map(m => <Row key={m.id} m={m} />)}
        </div>
      </>
    );
  }

  function Stats() {
    const allMinis = window.WT_DATA.minis;
    const stats = H.computeStats(allMinis);
    const pct = Math.round(stats.paintedPts / stats.totalPts * 100);
    let totalModels = 0, paintedModels = 0;
    for (const m of allMinis) {
      const mm = (m.models || 1) * (m.qty || 1);
      totalModels += mm;
      if (m.status === 'pintada') paintedModels += mm;
    }
    const statusLeyenda = { comprada: 'comprada', montada: 'montada', imprimada: 'imprimada', pintando: 'pintando', pintada: 'pintada' };
    return (
      <div className="vc-stats">
        <div className="vc-summary">
          <div className="vc-summary-row">
            <div className="vc-summary-cell">
              <div className="vc-summary-val">{totalModels}</div>
              <div className="vc-summary-lbl">modelos</div>
            </div>
            <div className="vc-summary-cell">
              <div className="vc-summary-val">{paintedModels}</div>
              <div className="vc-summary-lbl">pintados</div>
            </div>
            <div className="vc-summary-cell">
              <div className="vc-summary-val accent">{pct}%</div>
              <div className="vc-summary-lbl">pintado</div>
            </div>
          </div>
        </div>
        {Object.entries(stats.byGame).map(([slug, fobj]) => {
          const game = window.WT_DATA.games.find(g => g.slug === slug);
          const totalPts = Object.values(fobj).reduce((a, x) => a + x.pts, 0);
          const paintedPts = Object.values(fobj).reduce((a, x) => a + x.painted, 0);
          return (
            <div className="vc-game-card" key={slug}>
              <div className="vc-game-h">
                <span className={`vc-pill game-${slug}`} style={{ fontSize: 11, padding: '3px 12px' }}>{game.name}</span>
                <span className="vc-game-h-pts">{totalPts.toLocaleString()} pts totales · <span style={{ color: 'oklch(0.78 0.15 145)' }}>{paintedPts} pts pintados</span></span>
              </div>
              {Object.entries(fobj).map(([fname, f]) => {
                const facMinis = f.items;
                const facModels = facMinis.reduce((a, m) => a + (m.models || 1) * (m.qty || 1), 0);
                const facPainted = facMinis.filter(m => m.status === 'pintada').reduce((a, m) => a + (m.models || 1) * (m.qty || 1), 0);
                const counts = {};
                for (const m of facMinis) counts[m.status] = (counts[m.status] || 0) + (m.qty || 1);
                return (
                  <details className="vc-fac-det" key={fname} open={fname === Object.keys(fobj)[0]}>
                    <summary className="vc-fac-sum">
                      <div className="vc-fac-sum-l">
                        <span className="vc-fac-name">{fname}</span>
                        <span className="vc-fac-meta">{facMinis.length} entradas · {facModels} modelos · {facPainted} pintados</span>
                      </div>
                      <div className="vc-fac-sum-r">
                        <span className="vc-fac-pts">{f.pts} pts · <span className="accent">{f.painted} pintados</span></span>
                        <span className="vc-chevron">˅</span>
                      </div>
                    </summary>
                    <div className="vc-bar">
                      {H.statusOrder.map(s => {
                        const v = (f.byStatus[s] || 0) / f.pts * 100;
                        return v > 0 ? <div key={s} className={`vc-bar-seg ${s}`} style={{ width: `${v}%` }} /> : null;
                      })}
                    </div>
                    <div className="vc-leyenda">
                      {H.statusOrder.map(s => counts[s] ? (
                        <span key={s} className="vc-leyenda-i"><span className={`vc-leyenda-d ${s}`}></span>{counts[s]} {statusLeyenda[s]}</span>
                      ) : null)}
                    </div>
                    <div className="vc-mini-list">
                      {facMinis.map(m => (
                        <div className="vc-mini-row" key={m.id}>
                          <div className="vc-mini-l">
                            <span className="vc-mini-n">{m.name}</span>
                            <span className="vc-mini-mod">({(m.models || 1) * (m.qty || 1)} mod.)</span>
                          </div>
                          <div className="vc-mini-r">
                            <span className="vc-mini-pts">{(m.points || 0) * (m.qty || 1)} pts</span>
                            <span className={`vc-status ${m.status}`}>{H.statusLabel[m.status]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
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
      <div className="vc-wishlist">
        {window.WT_DATA.wishlist.map(w => {
          const g = window.WT_DATA.games.find(x => x.slug === w.game);
          return (
            <div className="vc-wish" key={w.id}>
              <div>
                <div className="vc-wish-n">{w.name}</div>
                <div className="vc-wish-meta">{g.short} · {w.factions[0]}{w.notes ? ` · ${w.notes}` : ""}</div>
              </div>
              <span className="vc-wish-pts">{w.points}pt</span>
            </div>
          );
        })}
      </div>
    );
  }

  function Pinturas() {
    return (
      <>
        <div className="vc-filters">
          <span className="vc-chip active">All</span>
          <span className="vc-chip">Base</span>
          <span className="vc-chip">Layer</span>
          <span className="vc-chip">Shade</span>
          <input className="vc-search" placeholder="// search paint…" />
        </div>
        <div className="vc-paints">
          {window.WT_DATA.pinturas.map(p => (
            <div className={`vc-paint ${!p.stock ? "out" : ""}`} key={p.id}>
              <div className="vc-swatch" style={{ background: p.color || "#1a160f" }} />
              <div className="vc-paint-info">
                <div className="vc-paint-n">{p.name}</div>
                <div className="vc-paint-b">{p.brand}{!p.stock ? " · agotada" : ""}</div>
              </div>
              <span className="vc-paint-t">{p.type}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  function Login() {
    return (
      <div className="vc-login">
        <div className="vc-login-eye">▸ wartracker.ops <span className="blink">_</span></div>
        <h1>War<span className="accent">Tracker</span></h1>
        <div className="sub">// acceso a tu armería personal</div>
        <input className="vc-input" placeholder="email" defaultValue="alex@wartracker.app" />
        <input className="vc-input" placeholder="password" type="password" defaultValue="••••••••" />
        <button className="vc-btn">▸ entrar</button>
      </div>
    );
  }

  function Modal({ centered }) {
    return (
      <div className={`vc-modal-bg ${centered ? "center" : ""}`}>
        <div className={`vc-modal ${centered ? "center" : ""}`}>
          <div className="vc-modal-eye">▸ nuevo registro</div>
          <div className="vc-modal-h">Añadir miniatura</div>
          <div className="vc-photo-slot">photo · 4:3</div>
          <label className="vc-label">// sistema</label>
          <select className="vc-input"><option>Warhammer 40K</option></select>
          <label className="vc-label">// facción</label>
          <select className="vc-input"><option>Space Marines</option></select>
          <label className="vc-label">// unidad</label>
          <select className="vc-input"><option>Intercessors</option></select>
          <label className="vc-label">// cantidad / modelos</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="vc-input" defaultValue="1" style={{ flex: 1, marginBottom: 0 }} />
            <input className="vc-input" defaultValue="10" style={{ flex: 1, marginBottom: 0 }} />
          </div>
          <label className="vc-label">// estado</label>
          <select className="vc-input"><option>Imprimada</option></select>
          <div className="vc-modal-actions">
            <button className="secondary">cancelar</button>
            <button className="vc-btn" style={{ flex: 1 }}>▸ guardar</button>
          </div>
        </div>
      </div>
    );
  }

  function Frame({ children, hideTabs, activeTab = "coleccion", showFab = true, showModal }) {
    return (
      <div className="vc vc-frame">
        <div className="vc-hdr">
          <div className="vc-logo">
            <div className="vc-logo-glyph" />
            <span className="vc-logo-mark">WarTracker</span>
            <span className="vc-hdr-status"><span className="dot"></span>online</span>
          </div>
          <div className="vc-hdr-actions">
            <span className="vc-hdr-icon">tema</span>
            <span className="vc-hdr-icon">salir</span>
          </div>
        </div>
        {!hideTabs && (
          <div className="vc-tabs">
            <span className={`vc-tab ${activeTab === "coleccion" ? "active" : ""}`}><span className="vc-tab-c">01</span>Colección</span>
            <span className={`vc-tab ${activeTab === "stats" ? "active" : ""}`}><span className="vc-tab-c">02</span>Stats</span>
            <span className={`vc-tab ${activeTab === "wishlist" ? "active" : ""}`}><span className="vc-tab-c">03</span>Wishlist</span>
            <span className={`vc-tab ${activeTab === "pinturas" ? "active" : ""}`}><span className="vc-tab-c">04</span>Pinturas</span>
          </div>
        )}
        {children}
        {showFab && <button className="vc-fab">+</button>}
        {showModal && <Modal centered={showModal === "center"} />}
      </div>
    );
  }

  return { Frame, Login, Coleccion, Stats, Wishlist, Pinturas, Modal, styles };
})();

window.VarC = VarC;
