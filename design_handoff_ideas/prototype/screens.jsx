/* global React, IdeasWidget */
// =============================================================
// Redesigned screens. All mobile-first, designed to live inside
// an iOS frame (402×874).
// =============================================================
const { useState } = React;

// ─── Bottom Nav ──────────────────────────────────────────────
const BottomNav = ({ active, onChange, onAdd }) => {
  const tabs = [
    { id: 'hoy',       label: 'Hoy',       glyph: '◐' },
    { id: 'coleccion', label: 'Colección', glyph: '▣' },
    null, // FAB slot
    { id: 'pinturas',  label: 'Pinturas',  glyph: '◯' },
    { id: 'mas',       label: 'Más',       glyph: '⋯' },
  ];
  return (
    <div className="r-bottom-nav">
      {tabs.map((t, i) => t === null
        ? <button key="fab" className="r-bottom-nav-fab" onClick={onAdd}>+</button>
        : <button
            key={t.id}
            className={`r-bottom-nav-item ${active === t.id ? 'active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            <span className="r-bottom-nav-glyph">{t.glyph}</span>
            {t.label}
          </button>
      )}
    </div>
  );
};

// ─── Hoy (Today) screen ─────────────────────────────────────
const HoyScreen = ({ data, onOpenMini, onContinue, ideas = [], onOpenIdea, onAddIdea, onSeeAllIdeas }) => {
  const inProgress = data.minis.filter(m => ['pintando','imprimada','montada'].includes(m.status));
  const hero = inProgress.find(m => m.status === 'pintando') || inProgress[0];
  const queue = inProgress.filter(m => m.id !== hero?.id).slice(0, 4);

  const PROGRESS_FILL = {
    pintando:  'oklch(0.6 0.15 305)',
    imprimada: 'oklch(0.65 0.12 240)',
    montada:   'oklch(0.7 0.13 60)',
    pintada:   'oklch(0.55 0.15 145)',
    comprada:  '#c8c6c0',
  };
  const STATUS_LABEL = {
    pintando: 'Pintando', imprimada: 'Imprimada', montada: 'Montada',
    pintada: 'Pintada', comprada: 'Comprada'
  };

  return (
    <>
      <div className="r-topbar">
        <div className="r-topbar-title">Hoy</div>
        <div className="r-topbar-actions">
          <button className="r-icon-btn" title="Buscar">🔍</button>
          <button className="r-icon-btn" title="Tema">🌙</button>
        </div>
      </div>

      {/* Hero — single pick */}
      {hero && (
        <div className="r-pick" onClick={() => onOpenMini(hero)}>
          <div className="r-pick-eyebrow">
            <span className="r-pick-dot"></span>
            sigue donde lo dejaste
          </div>
          <div className="r-pick-name">{hero.name}</div>
          <div className="r-pick-meta">{hero.faction} · {hero.pts} pts · {STATUS_LABEL[hero.status]}</div>
          <button className="r-pick-cta" onClick={e => { e.stopPropagation(); onContinue(hero); }}>
            Continuar pintando →
          </button>
        </div>
      )}

      {/* In-progress carousel */}
      <div className="r-section-h">
        <div className="r-section-title">También en curso · {queue.length}</div>
        <div className="r-section-link">Ver todos</div>
      </div>
      <div className="r-hscroll">
        {queue.map(m => (
          <div className="r-mini-card" key={m.id} onClick={() => onOpenMini(m)}>
            <div className="r-mini-thumb">
              <span
                className="r-mini-thumb-status"
                style={{ color: PROGRESS_FILL[m.status] }}
              >
                {STATUS_LABEL[m.status]}
              </span>
            </div>
            <div className="r-mini-name">{m.name}</div>
            <div className="r-mini-meta">{m.faction}</div>
            <div className="r-mini-progress">
              <div className="r-mini-progress-fill"
                style={{ width: '60%', background: PROGRESS_FILL[m.status] }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions / week plan */}
      <div className="r-section-h">
        <div className="r-section-title">Acciones rápidas</div>
      </div>
      <div className="r-plan">
        <div className="r-plan-row">
          <div className="r-plan-icon ok">▶</div>
          <div className="r-plan-body">
            <div className="r-plan-title">Iniciar sesión de hobby</div>
            <div className="r-plan-desc">Cronómetro y registro de la sesión</div>
          </div>
          <div className="r-plan-chev">›</div>
        </div>
        <div className="r-plan-row">
          <div className="r-plan-icon warn">!</div>
          <div className="r-plan-body">
            <div className="r-plan-title">2 minis sin imprimar</div>
            <div className="r-plan-desc">Liberators · Plaguebearers</div>
          </div>
          <div className="r-plan-chev">›</div>
        </div>
        <div className="r-plan-row">
          <div className="r-plan-icon info">★</div>
          <div className="r-plan-body">
            <div className="r-plan-title">Te quedan 4 potes sin stock</div>
            <div className="r-plan-desc">Revisa el rack antes de pintar</div>
          </div>
          <div className="r-plan-chev">›</div>
        </div>
      </div>

      {/* Ideas — lo que en desktop ocupa la columna derecha */}
      <IdeasWidget
        ideas={ideas}
        onOpenIdea={onOpenIdea || (() => {})}
        onAddIdea={onAddIdea || (() => {})}
        onSeeAll={onSeeAllIdeas || (() => {})}
      />
    </>
  );
};

// ─── Mini Detail screen ─────────────────────────────────────
const MiniDetail = ({ mini, onClose, onChangeStatus, onOpenPaintSheet, onRemovePaint, onSaveRecipe }) => {
  if (!mini) return null;
  const paints = mini.paints || [];
  const STATUS_ORDER = ['comprada','montada','imprimada','pintando','pintada'];
  const currentIdx = STATUS_ORDER.indexOf(mini.status);
  const labels = ['Comprada','Montada','Imprimada','Pintando','Pintada'];
  const progressPct = currentIdx <= 0 ? 0 : (currentIdx / (STATUS_ORDER.length - 1)) * 100;

  return (
    <div style={{ position: 'absolute', top: 62, left: 0, right: 0, bottom: 0, background: 'var(--bg)', zIndex: 8, overflowY: 'auto', paddingBottom: 80 }}>
      <div className="r-detail-head">
        <button className="r-detail-back" onClick={onClose}>‹</button>
        <button className="r-detail-back" title="Más">⋯</button>
      </div>
      <div className="r-detail-hero">
        <div className="r-detail-overlay"></div>
        <div className="r-detail-hero-text">
          <div className="r-detail-name">{mini.name}</div>
          <div className="r-detail-fac">{mini.faction} · {mini.game}</div>
        </div>
      </div>

      <div className="r-status-switcher">
        <div className="r-status-switcher-h">Estado</div>
        <div className="r-step-rail">
          <div className="r-step-rail-line"></div>
          <div className="r-step-rail-line-fill" style={{ width: `calc(${progressPct}% - 0px)` }}></div>
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className={`r-step ${i < currentIdx ? 'done' : ''} ${i === currentIdx ? 'current' : ''}`}>
              <button className="r-step-circle" onClick={() => onChangeStatus(s)}>
                {i < currentIdx ? '✓' : i + 1}
              </button>
              <div className="r-step-label">{labels[i]}</div>
            </div>
          ))}
        </div>
        <div className="r-step-action">
          {currentIdx > 0 && (
            <button className="back" onClick={() => onChangeStatus(STATUS_ORDER[currentIdx - 1])}>← {labels[currentIdx - 1]}</button>
          )}
          {currentIdx < STATUS_ORDER.length - 1 && (
            <button className="next" onClick={() => onChangeStatus(STATUS_ORDER[currentIdx + 1])}>{labels[currentIdx + 1]} →</button>
          )}
        </div>
      </div>

      <div className="r-detail-stats">
        <div className="r-detail-stat"><div className="r-detail-stat-v">{mini.qty}</div><div className="r-detail-stat-l">cajas</div></div>
        <div className="r-detail-stat"><div className="r-detail-stat-v">{mini.models}</div><div className="r-detail-stat-l">modelos</div></div>
        <div className="r-detail-stat"><div className="r-detail-stat-v">{mini.pts}</div><div className="r-detail-stat-l">pts</div></div>
      </div>

      <div className="r-detail-section">
        <div className="r-detail-section-h-row">
          <div className="r-detail-section-h">Pinturas en uso</div>
          {paints.length > 0 && (
            <button className="r-detail-section-action" onClick={onSaveRecipe}>↗ Guardar como receta</button>
          )}
        </div>

        {paints.length === 0 ? (
          <button className="r-paint-empty" onClick={onOpenPaintSheet}>
            <span className="r-paint-empty-plus">＋</span>
            <span className="r-paint-empty-body">
              <span className="r-paint-empty-title">Añadir pinturas que estás usando</span>
              <span className="r-paint-empty-sub">Desde tu inventario o aplicando una receta</span>
            </span>
            <span className="r-paint-empty-chev">›</span>
          </button>
        ) : (
          <div className="r-paint-chip-row">
            {paints.map(p => (
              <div key={p.id} className="r-paint-chip">
                <span className="r-paint-chip-dot" style={{background: p.hex}}></span>
                {p.name}
                <button
                  className="r-paint-chip-x"
                  onClick={(e) => { e.stopPropagation(); onRemovePaint(p.id); }}
                  aria-label={`Quitar ${p.name}`}
                >×</button>
              </div>
            ))}
            <button className="r-paint-chip r-paint-chip-add" onClick={onOpenPaintSheet}>
              <span className="r-paint-chip-add-glyph">＋</span> Añadir
            </button>
          </div>
        )}
      </div>

      <div className="r-detail-section">
        <div className="r-detail-section-h">Notas</div>
        <div className="r-detail-notes">
          Probar fade en el armor para los hombros — referencia Squad Vex en recetas.
        </div>
      </div>
    </div>
  );
};

// ─── Quick-Add bottom sheet (3 steps) ───────────────────────
const QuickAddSheet = ({ open, step, onSetStep, onClose, onSave, initialWishlist = false }) => {
  if (!open) return null;
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState('comprada');
  const [wishlist, setWishlist] = useState(initialWishlist);

  const RESULTS = [
    { name: 'Intercessors', faction: 'Space Marines', game: '40K', pts: 80 },
    { name: 'Aggressors',   faction: 'Space Marines', game: '40K', pts: 120 },
    { name: 'Redemptor Dreadnought', faction: 'Space Marines', game: '40K', pts: 210 },
    { name: 'Inceptors',    faction: 'Space Marines', game: '40K', pts: 140 },
  ];

  return (
    <div className="r-sheet-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="r-sheet">
        <div className="r-sheet-grabber"></div>

        {step === 'pick' && (
          <>
            <div>
              <div className="r-sheet-title">Añadir</div>
              <div className="r-sheet-sub">¿Qué quieres registrar?</div>
            </div>
            <div className="r-add-option" onClick={() => { setWishlist(false); onSetStep('mini-search'); }}>
              <div className="r-add-option-icon">🛡</div>
              <div className="r-add-option-body">
                <div className="r-add-option-name">Mini</div>
                <div className="r-add-option-desc">Una unidad o caja a tu colección</div>
              </div>
              <span className="r-add-option-chev">›</span>
            </div>
            <div className="r-add-option" onClick={() => { setWishlist(true); onSetStep('mini-search'); }}>
              <div className="r-add-option-icon">✦</div>
              <div className="r-add-option-body">
                <div className="r-add-option-name">Mini en wishlist</div>
                <div className="r-add-option-desc">Algo que quieres pero todavía no tienes</div>
              </div>
              <span className="r-add-option-chev">›</span>
            </div>
            <div className="r-add-option" onClick={onClose}>
              <div className="r-add-option-icon">🎨</div>
              <div className="r-add-option-body">
                <div className="r-add-option-name">Pintura</div>
                <div className="r-add-option-desc">Un pote nuevo al rack</div>
              </div>
              <span className="r-add-option-chev">›</span>
            </div>
            <div className="r-add-option" onClick={onClose}>
              <div className="r-add-option-icon">⏱</div>
              <div className="r-add-option-body">
                <div className="r-add-option-name">Sesión de hobby</div>
                <div className="r-add-option-desc">Registra cuánto y qué pintaste</div>
              </div>
              <span className="r-add-option-chev">›</span>
            </div>
          </>
        )}

        {step === 'mini-search' && (
          <>
            <div>
              <div className="r-sheet-title">{wishlist ? 'Añadir a wishlist' : 'Añadir mini'}</div>
              <div className="r-sheet-sub">Paso 1 · Busca la unidad</div>
            </div>
            <div className="r-quick-search">
              <span style={{fontSize:17, color:'var(--fg3)'}}>🔍</span>
              <input autoFocus placeholder="Intercessors, Redemptor…" defaultValue="Inter" />
            </div>
            <div className="r-result-list">
              {RESULTS.map(r => (
                <div key={r.name} className="r-result" onClick={() => { setSelected(r); onSetStep('mini-confirm'); }}>
                  <div className="r-result-body">
                    <div className="r-result-name">{r.name}</div>
                    <div className="r-result-meta">{r.faction} · {r.game}</div>
                  </div>
                  <span className="r-result-pts">{r.pts} pt</span>
                </div>
              ))}
            </div>
            <button className="r-link-btn" onClick={onClose}>Cancelar</button>
          </>
        )}

        {step === 'mini-confirm' && (
          <>
            <div>
              <div className="r-sheet-title">{selected?.name || 'Intercessors'}</div>
              <div className="r-sheet-sub">Paso 2 · Confirma y guarda</div>
            </div>

            <button
              className={`r-wishlist-toggle ${wishlist ? 'on' : ''}`}
              onClick={() => setWishlist(w => !w)}
            >
              <span className="r-wishlist-toggle-glyph">✦</span>
              <span className="r-wishlist-toggle-body">
                <span className="r-wishlist-toggle-title">Para mi wishlist</span>
                <span className="r-wishlist-toggle-sub">
                  {wishlist ? 'No la tienes aún · sin cajas ni estado' : 'Marca si todavía no la tienes'}
                </span>
              </span>
              <span className={`r-wishlist-toggle-switch ${wishlist ? 'on' : ''}`}>
                <span className="r-wishlist-toggle-knob"></span>
              </span>
            </button>

            <div className="r-confirm-card">
              <div className="r-confirm-field">
                <span className="r-confirm-label">Facción</span>
                <span className="r-confirm-value">{selected?.faction || 'Space Marines'}</span>
              </div>
              {!wishlist && (
                <div className="r-confirm-field">
                  <span className="r-confirm-label">Cajas</span>
                  <div className="r-stepper">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                    <input value={qty} readOnly />
                    <button onClick={() => setQty(q => q + 1)}>+</button>
                  </div>
                </div>
              )}
              <div className="r-confirm-field">
                <span className="r-confirm-label">Puntos</span>
                <span className="r-confirm-value">{selected?.pts || 80} pt</span>
              </div>
            </div>

            {!wishlist && (
              <div>
                <div style={{fontSize:11, fontWeight:600, color:'var(--fg3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8}}>Estado inicial</div>
                <div className="r-status-row">
                  {['comprada','montada','imprimada','pintando','pintada'].map(s => (
                    <button key={s} className={`r-status-chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="r-primary-btn" onClick={() => onSave(selected, qty, status, wishlist)}>
              {wishlist ? 'Añadir a wishlist' : 'Guardar'}
            </button>
            <button className="r-link-btn" onClick={onClose}>Añadir más detalles después</button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Paint Link bottom sheet ────────────────────────────────
const PaintLinkSheet = ({ open, onClose, onAdd, paints = [], recipes = [], existingIds = [] }) => {
  if (!open) return null;
  const [tab, setTab] = useState('inv'); // 'inv' | 'rec'
  const [q, setQ] = useState('');
  const [pickedRecipe, setPickedRecipe] = useState(null);

  const filtered = paints.filter(p => {
    if (existingIds.includes(p.id)) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return p.name.toLowerCase().includes(s) || (p.brand || '').toLowerCase().includes(s);
  });

  return (
    <div className="r-sheet-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="r-sheet">
        <div className="r-sheet-grabber"></div>

        <div>
          <div className="r-sheet-title">Pinturas en uso</div>
          <div className="r-sheet-sub">Apunta los potes que tienes encima de la mesa</div>
        </div>

        <div className="r-paint-tabs">
          <button
            className={`r-paint-tab ${tab === 'inv' ? 'active' : ''}`}
            onClick={() => { setTab('inv'); setPickedRecipe(null); }}
          >Inventario</button>
          <button
            className={`r-paint-tab ${tab === 'rec' ? 'active' : ''}`}
            onClick={() => { setTab('rec'); setPickedRecipe(null); }}
          >Desde receta</button>
        </div>

        {tab === 'inv' && (
          <>
            <div className="r-quick-search">
              <span style={{fontSize:17, color:'var(--fg3)'}}>🔍</span>
              <input
                autoFocus
                placeholder="Macragge Blue, Agrax…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <div className="r-paint-result-list">
              {filtered.length === 0 && (
                <div className="r-paint-result-empty">
                  {paints.length === 0
                    ? 'Tu inventario está vacío. Añade pinturas desde la pestaña Pinturas.'
                    : 'No quedan pinturas sin añadir que coincidan.'}
                </div>
              )}
              {filtered.map(p => (
                <button
                  key={p.id}
                  className="r-paint-result"
                  onClick={() => onAdd([p])}
                >
                  <span className="r-paint-result-dot" style={{background: p.hex}}></span>
                  <span className="r-paint-result-body">
                    <span className="r-paint-result-name">{p.name}</span>
                    <span className="r-paint-result-meta">{p.brand}{p.type ? ` · ${p.type}` : ''}</span>
                  </span>
                  <span className="r-paint-result-plus">＋</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'rec' && !pickedRecipe && (
          <div className="r-recipe-list">
            {recipes.length === 0 && (
              <div className="r-paint-result-empty">No tienes recetas guardadas todavía.</div>
            )}
            {recipes.map(r => (
              <button key={r.id} className="r-recipe-card" onClick={() => setPickedRecipe(r)}>
                <div className="r-recipe-card-head">
                  <span className="r-recipe-card-name">{r.name}</span>
                  <span className="r-recipe-card-chev">›</span>
                </div>
                <div className="r-recipe-card-meta">
                  {r.subject ? `${r.subject} · ` : ''}{r.paints.length} pinturas
                </div>
                <div className="r-recipe-card-swatches">
                  {r.paints.slice(0, 8).map((p, i) => (
                    <span key={i} className="r-recipe-swatch" style={{background: p.hex}}></span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'rec' && pickedRecipe && (() => {
          const fresh = pickedRecipe.paints.filter(p => !existingIds.includes(p.id));
          return (
            <>
              <div className="r-recipe-preview">
                <div className="r-recipe-card-name">{pickedRecipe.name}</div>
                <div className="r-recipe-card-meta">
                  Se añadirán {fresh.length} de {pickedRecipe.paints.length} pinturas
                  {fresh.length < pickedRecipe.paints.length && ' (el resto ya están)'}
                </div>
                <div className="r-paint-chip-row" style={{marginTop: 10}}>
                  {pickedRecipe.paints.map(p => {
                    const already = existingIds.includes(p.id);
                    return (
                      <div key={p.id} className={`r-paint-chip ${already ? 'r-paint-chip-dim' : ''}`}>
                        <span className="r-paint-chip-dot" style={{background: p.hex}}></span>
                        {p.name}
                        {already && <span className="r-paint-chip-ok">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button
                className="r-primary-btn"
                disabled={fresh.length === 0}
                onClick={() => { onAdd(fresh); onClose(); }}
              >
                {fresh.length === 0 ? 'Ya las tienes todas' : `Añadir ${fresh.length} pinturas`}
              </button>
              <button className="r-link-btn" onClick={() => setPickedRecipe(null)}>← Otra receta</button>
            </>
          );
        })()}

        <button className="r-link-btn" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

Object.assign(window, { BottomNav, HoyScreen, MiniDetail, QuickAddSheet, PaintLinkSheet });
