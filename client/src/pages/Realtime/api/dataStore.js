import { getModeloApi } from '../../../config/equipment';

const API_URL = 'https://x2rmn1ilde.execute-api.us-east-1.amazonaws.com/prod/date';

let cache = {
  data: [],
  lastUpdated: null
};

export const actualizarDatos = async (instrumentModel) => {
  try {
    const response = await fetch(API_URL);
    const { readings } = await response.json();

    cache.data = readings
      .filter(r => r.record_type === 'individual_reading')
      .map(r => {
        try {
          const parsed = JSON.parse(r.reading_data);

          // Si se especifica un modelo y no coincide, se ignora
          if (instrumentModel && parsed.instrumentModel !== instrumentModel) {
            return null;
          }

          return {
            instrumentModel: r.device_name || parsed.instrumentModel || 'Extech 45170',
            position: r.position || parsed.position || 'N/A',
            medicion: parsed.wind_speed || parsed.PPM || parsed.voltage || 0,
            unidad: parsed.unit || 'm/s',
            hora: new Date(parsed.timestamp || r.capture_timestamp).toISOString(),
            id: r.id || 'N/A',
            rawData: r
          };
        } catch (error) {
          console.warn('Error parseando lectura:', r.reading_data, error);
          return null;
        }
      })
      .filter(Boolean); // Elimina nulls

    cache.lastUpdated = new Date();
    return true;
  } catch (error) {
    console.error('Error actualizando datos desde /prod/date:', error);
    return false;
  }
};

export const obtenerUltimosSegundos = (instrumentModel, seconds) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - seconds * 1000);

  return cache.data
    .filter(item =>
      (!instrumentModel || item.instrumentModel === instrumentModel) &&
      new Date(item.hora) >= cutoff
    )
    .sort((a, b) => new Date(b.hora) - new Date(a.hora));
};

export const calcularPromedio = (instrumentModel, datos = []) => {
  const filtered = datos.length > 0 ? datos : obtenerUltimosSegundos(instrumentModel, 5);
  const sum = filtered.reduce((acc, item) => acc + parseFloat(item.medicion), 0);

  return {
    instrumentModel,
    velocidadPromedio: filtered.length > 0 ? sum / filtered.length : 0,
    position: filtered[0]?.position || '--',
    muestras: filtered.length
  };
};
