import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finanzas',
    short_name: 'Finanzas',
    description: 'Control de ingresos, gastos y presupuesto personal.',
    lang: 'es-AR',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    // Colores de la paleta (--background y --primary): la pantalla de apertura usa el mismo fondo que la app.
    background_color: '#faf9f7',
    theme_color: '#faf9f7',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
