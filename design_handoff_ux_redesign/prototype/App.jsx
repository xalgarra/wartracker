/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, IOSDevice, DIAGNOSIS, DiagnosisTile, Sitemap, PrototypeApp */

// =============================================================
// Main App — the redesign brief as a design canvas
// =============================================================

function PhoneFrame({ children, dark = true, height = 720 }) {
  return (
    <IOSDevice width={360} height={height} dark={dark}>
      {children}
    </IOSDevice>
  );
}

function App() {
  return (
    <DesignCanvas
      title="WarTracker · Redesign UX"
      subtitle="Diagnóstico de los puntos de fricción más altos y propuesta de rediseño centrada en cómo se usa la app, no sólo cómo se ve. Toca cualquier tarjeta para abrirla en pantalla completa."
    >
      <DCSection
        id="diagnosis"
        title="01 · Diagnóstico"
        description="Seis cosas que no funcionan en la versión actual. Cada tarjeta explica el problema y la cura que aplico abajo."
      >
        {DIAGNOSIS.map((d, i) => (
          <DCArtboard
            key={d.n}
            id={`diag-${i}`}
            label={`${d.n} · ${d.title}`}
            width={520}
            height={300}
          >
            <DiagnosisTile item={d} />
          </DCArtboard>
        ))}
      </DCSection>

      <DCSection
        id="ia"
        title="02 · Nueva IA"
        description="Pasa de 8 pestañas en scroll horizontal a 4 pestañas + FAB central. Los flujos secundarios viven en 'Más', donde tienen espacio para respirar sin competir por atención."
      >
        <DCArtboard id="sitemap" label="Sitemap · antes vs después" width={840} height={460}>
          <Sitemap />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="hoy"
        title="03 · Hoy · Dashboard rediseñado"
        description={`El "Inicio" cambia de nombre a "Hoy" porque cambia de propósito: no es un resumen, es una bandeja de acciones. Lo principal —tu mini en curso— sigue siendo el foco, pero ahora ves de un vistazo el resto de la cola y el plan de la semana.`}
      >
        <DCArtboard id="hoy-dark" label="Hoy · dark" width={400} height={820}>
          <PhoneFrame dark={true} height={820}>
            <PrototypeApp dark={true} initialScreen="hoy" />
          </PhoneFrame>
        </DCArtboard>
        <DCArtboard id="hoy-light" label="Hoy · light" width={400} height={820}>
          <PhoneFrame dark={false} height={820}>
            <PrototypeApp dark={false} initialScreen="hoy" />
          </PhoneFrame>
        </DCArtboard>
        <DCArtboard id="mas-dark" label="Más · resto de funciones" width={400} height={820}>
          <PhoneFrame dark={true} height={820}>
            <PrototypeApp dark={true} initialScreen="mas" />
          </PhoneFrame>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="quickadd"
        title="04 · Quick Add · añadir mini en 2 pasos"
        description="La pestaña '+' antes abría un modal con 12 campos. Ahora abre una hoja que pregunta primero qué quieres añadir, luego una búsqueda con autocompletado, luego confirma cantidad y estado. Detalles opcionales después."
      >
        <DCArtboard id="qa-1" label="① Elige qué añadir" width={400} height={820}>
          <PhoneFrame dark={true} height={820}>
            <PrototypeApp dark={true} initialScreen="hoy" initialSheet="pick" />
          </PhoneFrame>
        </DCArtboard>
        <DCArtboard id="qa-2" label="② Busca la unidad" width={400} height={820}>
          <PhoneFrame dark={true} height={820}>
            <PrototypeApp dark={true} initialScreen="hoy" initialSheet="mini-search" />
          </PhoneFrame>
        </DCArtboard>
        <DCArtboard id="qa-3" label="③ Confirma y guarda" width={400} height={820}>
          <PhoneFrame dark={true} height={820}>
            <PrototypeApp dark={true} initialScreen="hoy" initialSheet="mini-confirm" />
          </PhoneFrame>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="detail"
        title="05 · Detalle de mini · selector de estado visible"
        description="El cambio de estado era invisible (badge tocable). Ahora es lo primero que ves: un rail de 5 pasos con la fase actual destacada y un CTA grande para avanzar o retroceder. Es la acción más frecuente, merece ser la más visible."
      >
        <DCArtboard id="detail-dark" label="Detalle · dark" width={400} height={820}>
          <PhoneFrame dark={true} height={820}>
            <PrototypeApp dark={true} initialScreen="hoy" initialMiniId="m1" />
          </PhoneFrame>
        </DCArtboard>
        <DCArtboard id="detail-light" label="Detalle · light" width={400} height={820}>
          <PhoneFrame dark={false} height={820}>
            <PrototypeApp dark={false} initialScreen="hoy" initialMiniId="m1" />
          </PhoneFrame>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
