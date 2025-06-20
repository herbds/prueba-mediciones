import { actualizarDatos, obtenerRango } from './dataStore';
import { getModeloApi } from '../../../config/equipment';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


export const fetchHistoricalData = async (equipoId, start, end, idBuscado = null) => {
  try {
    const instrumentModel = equipoId ? getModeloApi(equipoId) : null;
    console.log(`Solicitando datos para equipo: ${equipoId} (${instrumentModel}), rango: ${start} a ${end}, ID: ${idBuscado || 'todos'}`);
    
    const { success, count, error } = await actualizarDatos(equipoId);
    
    if (!success) throw new Error(error || 'Error al actualizar datos del servidor');
    if (count === 0) throw new Error(equipoId ? `No hay datos disponibles para el equipo ${instrumentModel}` : 'No hay datos disponibles en el servidor');
    
    let datos = obtenerRango(start, end, equipoId, idBuscado);
    
    if (datos.length === 0) {
      throw new Error('No hay datos en el rango de fechas seleccionado' + 
        (equipoId ? ` para el equipo ${instrumentModel}` : '') +
        (idBuscado ? ` con ID ${idBuscado}` : ''));
    }
    
    return datos;
  } catch (error) {
    console.error('Error en fetchHistoricalData:', error);
    throw error;
  }
};

export const downloadExcel = async (start, end, equipoId) => {
  try {
    const instrumentModel = equipoId ? getModeloApi(equipoId) : null;
    console.log(`Preparando descarga Excel para equipo: ${equipoId} (${instrumentModel}), rango: ${start} a ${end}`);
    
    const data = obtenerRango(start, end, equipoId);
    
    if (data.length === 0) {
      throw new Error('No hay datos para el rango seleccionado' + 
        (equipoId ? ` del equipo ${instrumentModel}` : ''));
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Monitoreo';
    workbook.created = new Date();

    // Hoja principal de datos
    const worksheet = workbook.addWorksheet('Datos Meteorológicos');

    // Definir columnas
    worksheet.columns = [
      { header: 'Equipo', key: 'equipo', width: 20 },
      { header: 'Posición', key: 'posicion', width: 15 },
      { header: 'Medición', key: 'medicion', width: 15 },
      { header: 'Unidad', key: 'unidad', width: 10 },
      { header: 'Fecha y Hora', key: 'hora', width: 25 }
    ];

    // Estilo del encabezado
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }  // Azul corporativo
      };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
    });

    // Agregar datos
    data.forEach(item => {
      worksheet.addRow({
        equipo: item.instrumentModel || 'N/A',
        posicion: item.position || 'N/A',
        medicion: item.medicion ?? '',
        unidad: item.unidad || 'm/s',
        hora: item.hora ? new Date(item.hora).toLocaleString('es-CO') : ''
      });
    });

    // Aplicar estilos a las filas de datos
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'DDDDDD' } },
            left: { style: 'thin', color: { argb: 'DDDDDD' } },
            bottom: { style: 'thin', color: { argb: 'DDDDDD' } },
            right: { style: 'thin', color: { argb: 'DDDDDD' } }
          };
          cell.alignment = { horizontal: 'center' };
        });

        // Alternar colores de fila para mejor legibilidad
        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F5F5F5' }
            };
          });
        }
      }
    });

    // Hoja de metadatos
    const metaSheet = workbook.addWorksheet('Información');
    
    // Información del reporte
    metaSheet.addRow(['Informe de Datos Meteorológicos']);
    metaSheet.addRow([]);
    metaSheet.addRow(['Equipo:', instrumentModel || 'Todos los equipos']);
    metaSheet.addRow(['Fecha Inicio:', new Date(start).toLocaleString('es-CO')]);
    metaSheet.addRow(['Fecha Fin:', new Date(end).toLocaleString('es-CO')]);
    metaSheet.addRow(['Total Registros:', data.length]);
    metaSheet.addRow(['Generado el:', new Date().toLocaleString('es-CO')]);
    
    // Formatear hoja de metadatos
    metaSheet.getCell('A1').font = { size: 16, bold: true, color: { argb: '4472C4' } };
    metaSheet.getColumn(1).width = 20;
    metaSheet.getColumn(2).width = 30;
    
    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Nombre del archivo
    const startFormatted = new Date(start).toISOString().split('T')[0];
    const endFormatted = new Date(end).toISOString().split('T')[0];
    const fileName = `Datos_Meteorologicos_${equipoId || 'todos'}_${startFormatted}_a_${endFormatted}.xlsx`;
    
    // Descargar
    saveAs(blob, fileName);
    
    console.log('Archivo Excel generado con éxito');
    
  } catch (error) {
    console.error('Error en downloadExcel:', error);
    throw error;
  }
};