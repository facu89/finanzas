'use server'

type DolarAPIResponse = {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export async function fetchDolarRates() {
  try {
    // Caché inteligente: revalidar la cotización cada hora (3600 seg)
    const response = await fetch('https://dolarapi.com/v1/dolares', {
      next: { revalidate: 3600 } 
    });
    
    if (!response.ok) throw new Error('Error al conectar con DolarAPI');
    
    const data: DolarAPIResponse[] = await response.json();
    
    const tarjeta = data.find(d => d.casa === 'tarjeta')?.venta || 0;
    const blue = data.find(d => d.casa === 'blue')?.venta || 0;
    const mep = data.find(d => d.casa === 'mep')?.venta || 0;
    const oficial = data.find(d => d.casa === 'oficial')?.venta || 0;

    return { tarjeta, blue, mep, oficial, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('[CRITICAL] DolarAPI no responde:', error);
    // Fallback de contingencia (Valores estáticos seguros para evitar caída transaccional)
    return { tarjeta: 1500, blue: 1200, mep: 1200, oficial: 1000, timestamp: new Date().toISOString() };
  }
}
