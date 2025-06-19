import { actualizarDatos, obtenerUltimosSegundos, calcularPromedio } from './dataStore';

export const fetchRealtimeData = async () => {
  await actualizarDatos('default');
  const datos = obtenerUltimosSegundos('default', 5);
  const promedio = calcularPromedio('default', datos);
  
  return {
    datos,
    promedio
  };
};