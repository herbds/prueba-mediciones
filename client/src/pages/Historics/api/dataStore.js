import { getModeloApi } from '../../../config/equipment';

const API_URL = 'https://x2rmn1ilde.execute-api.us-east-1.amazonaws.com/prod/all';

const cache = {
  data: [],
  lastFetch: null,
  lastError: null,
  initialized: false
};

const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const fetchFromAPI = async () => {
  try {
    const response = await fetchWithTimeout(API_URL);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    
    const apiData = await response.json();
    
    if (!apiData.readings || !Array.isArray(apiData.readings)) {
      throw new Error('Formato de respuesta inválido: readings no es un array');
    }

    const processedData = apiData.readings
      .filter(r => r.record_type === 'individual_reading')
      .map(r => {
        try {
          const readingData = JSON.parse(r.reading_data);
          
          return {
            instrumentModel: r.device_name || 'N/A',
            position: r.position || readingData.position || 'N/A',
            medicion: readingData.wind_speed || readingData.PPM || readingData.voltage || 0,
            unidad: readingData.unit || 'm/s',
            hora: new Date(readingData.timestamp || r.capture_timestamp).toISOString(),
            id: r.id || 'N/A',
            rawData: r
          };
        } catch (parseError) {
          console.error('Error parseando lectura:', r.reading_data, parseError);
          return null;
        }
      })
      .filter(Boolean);

    console.log(`Datos procesados:`, processedData);
    return processedData;
  } catch (error) {
    console.error('Error en fetchFromAPI:', error);
    cache.lastError = error.message;
    throw error;
  }
};

export const actualizarDatos = async (equipoId) => {
  const CACHE_DURATION = 300000; // 5 minutos
  const instrumentModel = equipoId ? getModeloApi(equipoId) : null;
  
  // Si tenemos datos frescos en caché
  if (cache.initialized && cache.lastFetch && Date.now() - cache.lastFetch < CACHE_DURATION) {
    console.log('Devolviendo datos de caché');
    const filteredData = instrumentModel 
      ? cache.data.filter(item => item.instrumentModel === instrumentModel)
      : cache.data;
      
    return {
      success: true,
      count: filteredData.length,
      fromCache: true
    };
  }

  try {
    // Obtener datos frescos de la API
    const freshData = await fetchFromAPI();
    
    // Actualizar caché
    cache.data = freshData;
    cache.lastFetch = Date.now();
    cache.lastError = null;
    cache.initialized = true;
    
    console.log(`Datos actualizados. Total registros: ${freshData.length}`);
    
    // Filtrar por modelo si es necesario
    const filteredData = instrumentModel
      ? freshData.filter(item => item.instrumentModel === instrumentModel)
      : freshData;
    
    return {
      success: true,
      count: filteredData.length,
      fromCache: false,
      filtered: !!instrumentModel
    };
  } catch (error) {
    console.error('Error en actualizarDatos:', error);
    
    // Si hay datos en caché, usarlos
    if (cache.data.length > 0) {
      console.warn('Usando datos de caché antiguos debido a error');
      const filteredData = instrumentModel
        ? cache.data.filter(item => item.instrumentModel === instrumentModel)
        : cache.data;
      
      return {
        success: false,
        count: filteredData.length,
        fromCache: true,
        error: error.message
      };
    }
    
    return {
      success: false,
      count: 0,
      fromCache: false,
      error: error.message
    };
  }
};

export const obtenerRango = (desde, hasta, equipoId, idBuscado = null) => {
  try {
    if (!cache.initialized) throw new Error('Datos no inicializados');

    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);
    
    if (isNaN(desdeDate.getTime())) throw new Error('Fecha "desde" inválida');
    if (isNaN(hastaDate.getTime())) throw new Error('Fecha "hasta" inválida');
    
    let filteredData = cache.data.filter(item => {
      const itemDate = new Date(item.hora);
      return itemDate >= desdeDate && itemDate <= hastaDate;
    });

    // Filtrado por equipo
    if (equipoId) {
      const instrumentModel = getModeloApi(equipoId);
      filteredData = filteredData.filter(item => item.instrumentModel === instrumentModel);
    }

    // Filtrado por ID si se especifica
    if (idBuscado) {
      filteredData = filteredData.filter(item => 
        item.id.toLowerCase().includes(idBuscado.toLowerCase())
      );
    }

    console.log(`Filtrado: ${filteredData.length} registros entre ${desde} y ${hasta}` + 
      (idBuscado ? `, ID: ${idBuscado}` : ''));
    return filteredData;
  } catch (error) {
    console.error('Error en obtenerRango:', error);
    return [];
  }
};