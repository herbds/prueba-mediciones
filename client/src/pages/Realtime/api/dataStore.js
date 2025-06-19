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
        const parsed = JSON.parse(r.reading_data);
        return {
          instrumentModel: instrumentModel || 'Extech 45170',
          position: parsed.position || 'N/A',
          velocidad: parseFloat(parsed.wind_speed) || 0,
          hora: new Date(parsed.timestamp || r.capture_timestamp).toISOString()
        };
      });

    cache.lastUpdated = new Date();
    return true;
  } catch (error) {
    console.error('Error updating data:', error);
    return false;
  }
};

export const obtenerUltimosSegundos = (instrumentModel, seconds) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - (seconds * 1000));
  
  return cache.data
    .filter(item => 
      item.instrumentModel === instrumentModel && 
      new Date(item.hora) >= cutoff
    )
    .sort((a, b) => new Date(b.hora) - new Date(a.hora));
};

export const calcularPromedio = (instrumentModel, datos = []) => {
  const filtered = datos.length > 0 ? datos : obtenerUltimosSegundos(instrumentModel, 5);
  const sum = filtered.reduce((acc, item) => acc + item.velocidad, 0);
  
  return {
    instrumentModel,
    velocidadPromedio: filtered.length > 0 ? sum / filtered.length : 0,
    position: filtered[0]?.position || '--',
    muestras: filtered.length
  };
};