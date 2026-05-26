/* global React */
// =============================================================
// Diagnosis tiles + Sitemap diagram + Bottom-nav specimen
// =============================================================

const DIAGNOSIS = [
  {
    n: '01',
    title: '8 pestañas en scroll horizontal',
    desc: 'Inicio · Colección · Stats · Wishlist · Pinturas · Listas · Recetas · Pareja. En móvil, las últimas 3-4 quedan fuera de pantalla. El usuario no sabe que existen sin desplazar lateralmente.',
    cure: 'Reducir a 4 pestañas + FAB central. El resto va a "Más".',
  },
  {
    n: '02',
    title: 'El "Hero" sólo muestra UNA mini activa',
    desc: 'Si tienes 3-5 proyectos en curso, sólo ves el más prioritario y tienes que hacer scroll para encontrar los demás. El dashboard no responde a "¿qué puedo tocar ahora?".',
    cure: 'Mostrar 3-5 minis en curso como carrusel horizontal, con la pick destacada arriba.',
  },
  {
    n: '03',
    title: 'El cambio de estado está oculto',
    desc: 'Tocar el badge de estado en una card abre un menú flotante. No hay affordance: no parece tocable. La acción más común del flujo de hobby está escondida.',
    cure: 'Selector de estado visible como rail de 5 pasos en el detalle del mini.',
  },
  {
    n: '04',
    title: 'Añadir mini = 12 campos de golpe',
    desc: 'Juego, facción, unidad, nombre custom, qty, modelos, estado, notas, fotos, plan de hobby, etc. Tocar "+" debería ser de 5 segundos, no de 5 minutos.',
    cure: 'Quick-add en 2 pasos (buscar unidad → confirmar cantidad). Detalles opcionales.',
  },
  {
    n: '05',
    title: 'Voz "terminal" añade fricción de lectura',
    desc: 'Prefijos // en labels, ▸ en eyebrows, CTAs en MAYÚSCULAS MONO. Bonito pero se lee más lento. En modo oscuro la legibilidad sufre, no aporta función.',
    cure: 'Mantener el carácter visual del dark, pero usar Inter en cuerpo y reservar mono para números.',
  },
  {
    n: '06',
    title: 'FAB "+" sin contexto',
    desc: '¿Añade un mini? ¿Una pintura? ¿Una receta? Depende de la pestaña activa. El usuario tiene que adivinar o equivocarse.',
    cure: 'FAB siempre abre una hoja con las 2-3 acciones más comunes. Confirma intención antes de teclear.',
  },
];

const DiagnosisTile = ({ item }) => (
  <div className="diag-tile">
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="diag-num">{item.n}</span>
      <span className="diag-title">{item.title}</span>
    </div>
    <div className="diag-desc">{item.desc}</div>
    <div className="diag-cure">{item.cure}</div>
  </div>
);

const Sitemap = () => (
  <div className="sitemap">
    <div className="sitemap-row">
      <div className="sitemap-old">
        <div className="sitemap-h">Antes · 8 pestañas</div>
        <div className="sitemap-tab kept">Inicio</div>
        <div className="sitemap-tab kept">Colección</div>
        <div className="sitemap-tab demoted">Estadísticas</div>
        <div className="sitemap-tab demoted">Wishlist</div>
        <div className="sitemap-tab kept">Pinturas</div>
        <div className="sitemap-tab demoted">Listas</div>
        <div className="sitemap-tab demoted">Recetas</div>
        <div className="sitemap-tab demoted">Pareja</div>
      </div>
      <div className="sitemap-arrow">→</div>
      <div className="sitemap-new">
        <div className="sitemap-h">Después · 4 + FAB</div>
        <div className="sitemap-tab kept">Hoy <span style={{opacity:0.5, fontSize:11}}>(antes Inicio)</span></div>
        <div className="sitemap-tab kept">Colección</div>
        <div className="sitemap-tab new">＋ Añadir <span style={{opacity:0.7, fontSize:11}}>(FAB central)</span></div>
        <div className="sitemap-tab kept">Pinturas</div>
        <div className="sitemap-tab new">Más <span style={{opacity:0.5, fontSize:11}}>(stats, wishlist, listas, recetas, pareja)</span></div>
      </div>
    </div>
  </div>
);

Object.assign(window, { DIAGNOSIS, DiagnosisTile, Sitemap });
