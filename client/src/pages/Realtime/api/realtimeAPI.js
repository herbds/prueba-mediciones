import { actualizarDatos, obtenerUltimosSegundos, calcularPromedio } from './dataStore';
import { getModeloApi } from '../../../config/equipment';

export const fetchRealtimeData = async (equipoId, intervaloSegundos = 5) => {
  try {
    const instrumentModel = equipoId ? getModeloApi(equipoId) : null;

    console.log(`Solicitando datos en tiempo real para equipo: ${equipoId} (${instrumentModel}), últimos ${intervaloSegundos} segundos`);

    const actualizado = await actualizarDatos(instrumentModel);
    
    if (!actualizado) {
      throw new Error('Error al actualizar los datos desde la fuente en tiempo real.');
    }

    const datos = obtenerUltimosSegundos(instrumentModel, intervaloSegundos);
    
    if (datos.length === 0) {
      throw new Error(
        `No se encontraron datos recientes para el equipo ${instrumentModel || 'desconocido'}`
      );
    }

    const promedio = calcularPromedio(instrumentModel, datos);

    return {
      datos,
      promedio
    };
  } catch (error) {
    console.error('Error en fetchRealtimeData:', error);
    throw error;
  }
};
