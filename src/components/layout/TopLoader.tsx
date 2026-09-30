/** Barra de carga fina en el borde superior. Aparece con un pequeño retraso para no parpadear en cargas rápidas. */
export function TopLoader() {
  return (
    <div role="progressbar" aria-label="Cargando" className="top-loader pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden">
      <div className="top-loader-bar h-full w-2/5 rounded-full bg-brand" />
    </div>
  )
}
