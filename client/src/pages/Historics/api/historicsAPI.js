import { actualizarDatos, obtenerRango } from './dataStore';

export const fetchHistoricalData = async (_, start, end) => {
  const { success } = await actualizarDatos();
  if (!success) throw new Error('Error al actualizar datos');
  return obtenerRango(start, end);
};

export const downloadCSV = (start, end) => {
  // Implementación básica - puede mejorarse
  const data = obtenerRango(start, end);
  let csv = 'Equipo,Posición,Velocidad,Unidad,Fecha\n';
  data.forEach(d => {
    csv += `${d.instrumentModel},${d.position},${d.velocidad},${d.unidad},${d.hora}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `datos_${start}_a_${end}.csv`;
  a.click();
};