/* global React */
// =============================================================
// Ideas — lista de cosas que el usuario quiere hacer "algún día"
// (no proyectos activos). Pensado para llenar la columna derecha
// vacía en desktop y vivir como sección plegada en mobile.
// =============================================================
const { useState, useRef } = React;

// ─── Categorías ──────────────────────────────────────────────
// Cada una con un color discreto que se usa en el "dot" del pill.
// El usuario puede dejar la categoría vacía; en ese caso no se
// muestra pill.
const IDEA_CATEGORIES = [
  { id: 'tecnica', label: 'Técnica',  hue: 220 }, // cyan
  { id: 'mini',    label: 'Mini',     hue: 305 }, // purple
  { id: 'compra',  label: 'Compra',   hue: 70  }, // amber
  { id: 'lista',   label: 'Lista',    hue: 15  }, // rose
  { id: 'otros',   label: 'Otros',    hue: 280 }, // neutral lavender
];

const catColor = (id, dark = true) => {
  const c = IDEA_CATEGORIES.find(x => x.id === id);
  if (!c) return null;
  return dark
    ? `oklch(0.70 0.13 ${c.hue})`
    : `oklch(0.50 0.14 ${c.hue})`;
};

const catLabel = (id) => IDEA_CATEGORIES.find(x => x.id === id)?.label || null;

// ─── Idea row (compartido entre widget y pantalla completa) ──
const IdeaRow = ({ idea, onClick, draggable = false }) => {
  const color = catColor(idea.category);
  return (
    <div className={`r-idea-row ${draggable ? 'r-idea-row-drag' : ''}`} onClick={onClick}>
      {draggable && <span className="r-idea-grip" aria-hidden="true">⋮⋮</span>}
      <div className="r-idea-body">
        <div className="r-idea-text">{idea.text}</div>
        {(idea.category || idea.linkedMini) && (
          <div className="r-idea-meta">
            {idea.category && (
              <span className="r-idea-cat">
                <span className="r-idea-cat-dot" style={{ background: color || 'var(--fg4)' }}></span>
                {catLabel(idea.category)}
              </span>
            )}
            {idea.linkedMini && (
              <span className="r-idea-link">
                <span className="r-idea-link-glyph">⚓</span>
                {idea.linkedMini.name}
              </span>
            )}
          </div>
        )}
      </div>
      <span className="r-idea-chev">›</span>
    </div>
  );
};

// ─── Composer ────────────────────────────────────────────────
const IdeaComposer = ({ onAdd, placeholder = 'Apunta una idea…', autoFocus = false }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText('');
    inputRef.current?.focus();
  };

  return (
    <div className="r-idea-composer">
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
      />
      <button
        className="r-idea-composer-add"
        disabled={!text.trim()}
        onClick={submit}
        aria-label="Añadir idea"
      >＋</button>
    </div>
  );
};

// ─── Widget compacto para la pantalla "Hoy" ──────────────────
const IdeasWidget = ({ ideas, onOpenIdea, onAddIdea, onSeeAll, max = 4 }) => {
  const visible = ideas.slice(0, max);
  const overflow = Math.max(0, ideas.length - max);

  return (
    <>
      <div className="r-section-h">
        <div className="r-section-title">Ideas</div>
        <div className="r-section-link" onClick={onSeeAll} style={{ cursor: 'pointer' }}>
          Ver todas{ideas.length > 0 ? ` · ${ideas.length}` : ''}
        </div>
      </div>

      <div className="r-ideas-card">
        {visible.length === 0 ? (
          <div className="r-ideas-empty">
            <div className="r-ideas-empty-title">Sin ideas todavía</div>
            <div className="r-ideas-empty-desc">
              Apunta cosas que quieres hacer en algún momento — técnicas, minis, compras.
            </div>
          </div>
        ) : (
          <div className="r-idea-list">
            {visible.map(i => (
              <IdeaRow key={i.id} idea={i} onClick={() => onOpenIdea(i)} />
            ))}
          </div>
        )}

        <IdeaComposer onAdd={onAddIdea} />

        {overflow > 0 && (
          <button className="r-ideas-overflow" onClick={onSeeAll}>
            Hay {overflow} idea{overflow !== 1 ? 's' : ''} más → ver todas
          </button>
        )}
      </div>
    </>
  );
};

// ─── Pantalla completa "Ideas" ───────────────────────────────
const IdeasScreen = ({ ideas, onAddIdea, onOpenIdea, onClose }) => {
  // Filtros: 'todas' o id de categoría
  const [filter, setFilter] = useState('todas');
  const filtered = filter === 'todas' ? ideas : ideas.filter(i => i.category === filter);

  return (
    <div className="r-ideas-screen">
      <div className="r-detail-head">
        <button className="r-detail-back" onClick={onClose}>‹</button>
        <div className="r-ideas-screen-title">Ideas</div>
        <button className="r-detail-back" title="Más">⋯</button>
      </div>

      <div className="r-ideas-screen-composer">
        <IdeaComposer onAdd={onAddIdea} placeholder="Nueva idea…" autoFocus={false} />
      </div>

      <div className="r-ideas-filters">
        <button
          className={`r-ideas-filter ${filter === 'todas' ? 'active' : ''}`}
          onClick={() => setFilter('todas')}
        >Todas · {ideas.length}</button>
        {IDEA_CATEGORIES.map(c => {
          const n = ideas.filter(i => i.category === c.id).length;
          if (n === 0) return null;
          return (
            <button
              key={c.id}
              className={`r-ideas-filter ${filter === c.id ? 'active' : ''}`}
              onClick={() => setFilter(c.id)}
            >
              <span className="r-idea-cat-dot" style={{ background: catColor(c.id) }}></span>
              {c.label} · {n}
            </button>
          );
        })}
      </div>

      <div className="r-ideas-screen-list">
        {filtered.length === 0 ? (
          <div className="r-ideas-empty" style={{ padding: '40px 18px' }}>
            <div className="r-ideas-empty-title">Sin ideas en esta categoría</div>
            <div className="r-ideas-empty-desc">Apunta una arriba o cambia el filtro.</div>
          </div>
        ) : (
          filtered.map(i => (
            <IdeaRow key={i.id} idea={i} onClick={() => onOpenIdea(i)} draggable={true} />
          ))
        )}
      </div>

      <div className="r-ideas-screen-foot">
        Orden manual · arrastra <span style={{ color: 'var(--fg2)' }}>⋮⋮</span> para reordenar
      </div>
    </div>
  );
};

// ─── Sheet de acciones sobre una idea ────────────────────────
const IdeaActionsSheet = ({ open, idea, onClose, onUpdate, onPromoteSession, onPromoteProject, onLinkMini, onDelete }) => {
  if (!open || !idea) return null;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(idea.text);
  const [category, setCategory] = useState(idea.category || '');

  React.useEffect(() => {
    if (open) {
      setEditing(false);
      setText(idea.text);
      setCategory(idea.category || '');
    }
  }, [open, idea]);

  const saveEdit = () => {
    onUpdate({ ...idea, text: text.trim() || idea.text, category: category || null });
    setEditing(false);
  };

  return (
    <div className="r-sheet-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="r-sheet">
        <div className="r-sheet-grabber"></div>

        {!editing ? (
          <>
            <div>
              <div className="r-sheet-title">{idea.text}</div>
              <div className="r-sheet-sub">
                {idea.category ? catLabel(idea.category) : 'Sin categoría'}
                {idea.linkedMini ? ` · vinculada a ${idea.linkedMini.name}` : ''}
              </div>
            </div>

            <button className="r-idea-action" onClick={() => setEditing(true)}>
              <span className="r-idea-action-glyph">✎</span>
              <span className="r-idea-action-body">
                <span className="r-idea-action-name">Editar</span>
                <span className="r-idea-action-desc">Cambiar texto o categoría</span>
              </span>
              <span className="r-idea-action-chev">›</span>
            </button>

            <button className="r-idea-action" onClick={onLinkMini}>
              <span className="r-idea-action-glyph">⚓</span>
              <span className="r-idea-action-body">
                <span className="r-idea-action-name">
                  {idea.linkedMini ? 'Cambiar mini vinculada' : 'Vincular a una mini'}
                </span>
                <span className="r-idea-action-desc">
                  {idea.linkedMini ? idea.linkedMini.name : 'Conecta con colección o wishlist'}
                </span>
              </span>
              <span className="r-idea-action-chev">›</span>
            </button>

            <div className="r-idea-action-divider">Convertir en…</div>

            <button className="r-idea-action" onClick={onPromoteSession}>
              <span className="r-idea-action-glyph promote">▶</span>
              <span className="r-idea-action-body">
                <span className="r-idea-action-name">Sesión de hobby</span>
                <span className="r-idea-action-desc">Empezar a cronometrar ahora</span>
              </span>
              <span className="r-idea-action-chev">›</span>
            </button>

            <button className="r-idea-action" onClick={onPromoteProject}>
              <span className="r-idea-action-glyph promote">☰</span>
              <span className="r-idea-action-body">
                <span className="r-idea-action-name">Proyecto activo</span>
                <span className="r-idea-action-desc">Mover a "lo que estoy haciendo"</span>
              </span>
              <span className="r-idea-action-chev">›</span>
            </button>

            <button className="r-idea-action danger" onClick={onDelete}>
              <span className="r-idea-action-glyph">🗑</span>
              <span className="r-idea-action-body">
                <span className="r-idea-action-name">Eliminar</span>
                <span className="r-idea-action-desc">La idea se borra de la lista</span>
              </span>
            </button>

            <button className="r-link-btn" onClick={onClose}>Cerrar</button>
          </>
        ) : (
          <>
            <div>
              <div className="r-sheet-title">Editar idea</div>
              <div className="r-sheet-sub">Texto libre y categoría opcional</div>
            </div>

            <textarea
              className="r-idea-edit-input"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              autoFocus
            />

            <div>
              <div style={{fontSize:11, fontWeight:600, color:'var(--fg3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8}}>
                Categoría
              </div>
              <div className="r-idea-cat-row">
                <button
                  className={`r-idea-cat-pick ${!category ? 'active' : ''}`}
                  onClick={() => setCategory('')}
                >Ninguna</button>
                {IDEA_CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    className={`r-idea-cat-pick ${category === c.id ? 'active' : ''}`}
                    onClick={() => setCategory(c.id)}
                  >
                    <span className="r-idea-cat-dot" style={{ background: catColor(c.id) }}></span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="r-primary-btn" onClick={saveEdit}>Guardar cambios</button>
            <button className="r-link-btn" onClick={() => setEditing(false)}>Cancelar</button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Sheet para vincular a una mini ──────────────────────────
const LinkMiniSheet = ({ open, onClose, onLink, minis = [], currentLinkedId = null }) => {
  if (!open) return null;
  const [q, setQ] = useState('');

  const filtered = minis.filter(m => {
    if (!q) return true;
    const s = q.toLowerCase();
    return m.name.toLowerCase().includes(s)
      || (m.faction || '').toLowerCase().includes(s);
  });

  return (
    <div className="r-sheet-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="r-sheet">
        <div className="r-sheet-grabber"></div>

        <div>
          <div className="r-sheet-title">Vincular a mini</div>
          <div className="r-sheet-sub">Conecta la idea con algo de tu colección o wishlist</div>
        </div>

        <div className="r-quick-search">
          <span style={{fontSize:17, color:'var(--fg3)'}}>🔍</span>
          <input
            autoFocus
            placeholder="Be'lakor, Intercessors…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {currentLinkedId && (
          <button
            className="r-link-btn"
            style={{ textAlign: 'left', color: 'var(--accent)' }}
            onClick={() => { onLink(null); onClose(); }}
          >× Quitar vínculo actual</button>
        )}

        <div className="r-result-list">
          {filtered.length === 0 && (
            <div className="r-paint-result-empty">Sin resultados.</div>
          )}
          {filtered.map(m => (
            <button
              key={m.id}
              className="r-result"
              onClick={() => { onLink(m); onClose(); }}
            >
              <div className="r-result-body">
                <div className="r-result-name">
                  {m.name}
                  {currentLinkedId === m.id && <span style={{marginLeft:6, color:'var(--accent)', fontSize:11}}>✓ vinculada</span>}
                </div>
                <div className="r-result-meta">
                  {m.faction}{m.wishlist ? ' · wishlist' : ' · colección'}
                </div>
              </div>
              <span className="r-result-pts">{m.pts} pt</span>
            </button>
          ))}
        </div>

        <button className="r-link-btn" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
};

// ─── Maqueta desktop estática (wireframe del layout final) ────
// No es interactiva — es un "mockup de referencia" para mostrar
// cómo encaja Ideas en la columna derecha que ahora está vacía.
const IdeasDesktopMockup = ({ ideas }) => {
  return (
    <div className="r-desktop-mock">
      <div className="r-desktop-mock-chrome">
        <span className="r-desktop-mock-dot" style={{ background: '#ff5f57' }}></span>
        <span className="r-desktop-mock-dot" style={{ background: '#febc2e' }}></span>
        <span className="r-desktop-mock-dot" style={{ background: '#28c840' }}></span>
        <span className="r-desktop-mock-title">WarTracker</span>
      </div>
      <div className="r-desktop-mock-body">
        {/* Izquierda — lo que ya hay */}
        <div className="r-desktop-mock-col r-desktop-mock-col-left">
          <div className="r-desktop-mock-hero">
            <div className="r-desktop-mock-hero-eyebrow">sigue donde lo dejaste</div>
            <div className="r-desktop-mock-hero-name">Manifestations</div>
            <div className="r-desktop-mock-hero-cta">Continuar pintando →</div>
          </div>
          <div className="r-desktop-mock-quickrow">
            <div className="r-desktop-mock-quick">▶ Iniciar sesión</div>
            <div className="r-desktop-mock-quick">! Sin imprimar</div>
            <div className="r-desktop-mock-quick">★ Sin stock</div>
          </div>
          <div className="r-desktop-mock-stats">
            <div className="r-desktop-mock-stat"><b>1</b><span>modelos</span></div>
            <div className="r-desktop-mock-stat"><b>0</b><span>pintados</span></div>
            <div className="r-desktop-mock-stat"><b>0%</b><span>completado</span></div>
            <div className="r-desktop-mock-stat"><b>0</b><span>pts</span></div>
          </div>
        </div>
        {/* Derecha — la nueva columna IDEAS */}
        <div className="r-desktop-mock-col r-desktop-mock-col-right">
          <div className="r-desktop-mock-col-head">
            <span className="r-desktop-mock-col-eyebrow">IDEAS</span>
            <span className="r-desktop-mock-col-action">+ nueva</span>
          </div>
          <div className="r-desktop-mock-ideas">
            {ideas.slice(0, 6).map(i => (
              <div key={i.id} className="r-desktop-mock-idea">
                <div className="r-desktop-mock-idea-text">{i.text}</div>
                <div className="r-desktop-mock-idea-meta">
                  {i.category && (
                    <span className="r-idea-cat" style={{ fontSize: 10 }}>
                      <span className="r-idea-cat-dot" style={{ background: catColor(i.category) }}></span>
                      {catLabel(i.category)}
                    </span>
                  )}
                  {i.linkedMini && (
                    <span className="r-idea-link" style={{ fontSize: 10 }}>
                      <span className="r-idea-link-glyph">⚓</span>
                      {i.linkedMini.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="r-desktop-mock-composer">
            <span style={{ color: 'var(--fg4)' }}>Apunta una idea…</span>
            <span className="r-desktop-mock-composer-add">＋</span>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  IDEA_CATEGORIES,
  IdeaRow,
  IdeaComposer,
  IdeasWidget,
  IdeasScreen,
  IdeaActionsSheet,
  LinkMiniSheet,
  IdeasDesktopMockup,
});
