const API_URL = 'https://x2rmn1ilde.execute-api.us-east-1.amazonaws.com/prod/all';

const cache = {
  data: [],
  lastFetch: null
};

/**
 * Obtiene datos directamente de la API histórica
 * @returns {Promise<Array>}
 */
const fetchFromAPI = async () => {
  try {
    const response = await fetch(API_URL, { timeout: 8000 });
    if (!response.ok) throw new Error('Error en la respuesta');
    
    const { readings } = await response.json();
    return readings
      .filter(r => r.record_type === 'individual_reading')
      .map(r => {
        const parsed = JSON.parse(r.reading_data);
        return {
          instrumentModel: 'Extech 45170',
          position: parsed.position || 'N/A',
          velocidad: parsed.wind_speed || 0,
          unidad: parsed.unit || 'm/s',
          hora: new Date(parsed.timestamp || r.capture_timestamp).toISOString()
        };
      });
  } catch (error) {
    console.error('Error fetchFromAPI:', error);
    return [];
  }
};

export const actualizarDatos = async () => {
  // Cache de 5 minutos
  if (cache.lastFetch && Date.now() - cache.lastFetch < 300000) {
    return { success: true, count: cache.data.length };
  }

  try {
    cache.data = await fetchFromAPI();
    cache.lastFetch = Date.now();
    return { success: true, count: cache.data.length };
  } catch (error) {
    return { success: false, count: 0 };
  }
};

export const obtenerRango = (desde, hasta) => {
  return cache.data.filter(item => {
    const itemDate = new Date(item.hora);
    return itemDate >= new Date(desde) && itemDate <= new Date(hasta);
  });
};