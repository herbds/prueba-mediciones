import axios from 'axios';

const API_URL_Historical = 'https://x2rmn1ilde.execute-api.us-east-1.amazonaws.com/prod/all';

/**
 * Obtiene datos de las APIs de mediciones
 * @param {'historical'|'date'} timeConfig - Tipo de consulta
 * @param {string} instrumentModel - Modelo del instrumento
 * @returns {Promise<Array>} Datos procesados
 */
export const fetchData = async (timeConfig, instrumentModel = 'Extech 45170') => {
  try {
    const baseUrl = timeConfig === 'historical' ? API_URL_Historical : API_URL_Lastest;
    const response = await axios.get(baseUrl, { timeout: 8000 });

    if (!response?.data?.readings) {
      console.warn('Estructura de respuesta inesperada');
      return [];
    }

    return response.data.readings
      .filter(reading => reading.record_type === 'individual_reading')
      .map(reading => {
        try {
          const parsed = JSON.parse(reading.reading_data);
          return {
            instrumentModel,
            position: parsed.position?.toString() || 'N/A',
            velocidad: parseFloat(parsed.wind_speed) || 0,
            unidad: parsed.unit?.toString() || 'm/s',
            hora: new Date(parsed.timestamp || reading.capture_timestamp).toISOString()
          };
        } catch (e) {
          console.warn('Error parseando lectura:', reading.id);
          return null;
        }
      })
      .filter(Boolean);

  } catch (error) {
    console.error('Error en fetchData:', error.message);
    return [];
  }
};