import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchHistoricalData, downloadExcel } from './api/historicsAPI';
import './Historics.css';
import { getEquipoById } from '../../config/equipment';
import HomeButton from '../../components/HomeButton/homeButton'; 

const Historics = () => {
  const [datosTotales, setDatosTotales] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busquedaAvanzada, setBusquedaAvanzada] = useState(false);
  const [filtroId, setFiltroId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const porPagina = 12;
  
  const [searchParams] = useSearchParams();
  const equipoId = searchParams.get('equipo') || 'equipoA';
  const equipo = getEquipoById(equipoId);

  // Consultar datos
  const consultar = async () => {
    const desdeFecha = document.getElementById('desdeFecha').value;
    const hastaFecha = document.getElementById('hastaFecha').value;

    if (!desdeFecha || !hastaFecha) {
      setError("Por favor selecciona fechas de inicio y fin.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let desdeHora = busquedaAvanzada ? document.getElementById('desdeHora').value || "00:00" : "00:00";
      let hastaHora = busquedaAvanzada ? document.getElementById('hastaHora').value || "23:59" : "23:59";
      const idBuscado = busquedaAvanzada ? filtroId : null;

      const desde = `${desdeFecha}T${desdeHora}:00`;
      const hasta = `${hastaFecha}T${hastaHora}:59`;

      const datos = await fetchHistoricalData(equipoId, desde, hasta, idBuscado);
      setDatosTotales(datos);
      setPaginaActual(1);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("Error al cargar los datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Descargar datos
  const descargar = async () => {
    const desdeFecha = document.getElementById('desdeFecha').value;
    const hastaFecha = document.getElementById('hastaFecha').value;

    if (!desdeFecha || !hastaFecha) {
      setError("Debes seleccionar fechas para descargar.");
      return;
    }

    let desdeHora = busquedaAvanzada ? document.getElementById('desdeHora').value || "00:00" : "00:00";
    let hastaHora = busquedaAvanzada ? document.getElementById('hastaHora').value || "23:59" : "23:59";

    if (desdeFecha === hastaFecha && !busquedaAvanzada) {
      desdeHora = "00:00";
      hastaHora = "23:59";
    }

    const desde = `${desdeFecha}T${desdeHora}:00`;
    const hasta = `${hastaFecha}T${hastaHora}:59`;

    try {
      await downloadExcel(desde, hasta, equipoId);
    } catch (err) {
      console.error("Error al descargar:", err);
      setError("Error al generar el archivo de descarga");
    }
  };

  // Cambiar página
  const cambiarPagina = (delta) => {
    const totalPaginas = Math.ceil(datosTotales.length / porPagina);
    const nueva = paginaActual + delta;
    if (nueva >= 1 && nueva <= totalPaginas) {
      setPaginaActual(nueva);
    }
  };

  // Toggle búsqueda avanzada
  const toggleBusquedaAvanzada = () => {
    setBusquedaAvanzada(!busquedaAvanzada);
  };

  // Establecer fechas por defecto al cargar
  useEffect(() => {
    const hoy = new Date();
    const hace7dias = new Date(hoy);
    hace7dias.setDate(hoy.getDate() - 7);
    
    document.getElementById('desdeFecha').value = hace7dias.toISOString().split('T')[0];
    document.getElementById('hastaFecha').value = hoy.toISOString().split('T')[0];
  }, []);

  // Calcular datos para la página actual
  const inicio = (paginaActual - 1) * porPagina;
  const fin = inicio + porPagina;
  const paginaDatos = datosTotales.slice(inicio, fin);
  const totalPaginas = Math.ceil(datosTotales.length / porPagina);

  return (
    <div className="historics-container">
      <div className="equipo-info">
        <h2>Consultando datos para: {equipo.nombre}</h2>
      </div>

      {/* Controles de fecha */}
      <div className="date-controls">
        <div className="date-group">
          <label>Fecha Desde:</label>
          <input type="date" id="desdeFecha" />
        </div>

        <div className="date-group">
          <label>Fecha Hasta:</label>
          <input type="date" id="hastaFecha" />
        </div>
      </div>

      {/* Búsqueda avanzada */}
      {busquedaAvanzada && (
        <div className="advanced-controls">
          <div className="form-group">
            <label>Hora Desde:</label>
            <input type="time" id="desdeHora" />
          </div>
          <div className="form-group">
            <label>Hora Hasta:</label>
            <input type="time" id="hastaHora" />
          </div>
          <div className="form-group">
            <label>Filtrar por ID:</label>
            <input 
              type="text" 
              id="filtroId" 
              placeholder="Ingrese ID específico"
              value={filtroId}
              onChange={(e) => setFiltroId(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="controls">
        <HomeButton />
        <button 
          className="toggle-time" 
          onClick={toggleBusquedaAvanzada}
        >
          {busquedaAvanzada ? 'Ocultar Avanzado' : 'Búsqueda Avanzada'}
        </button>
        <button 
          className="primary" 
          onClick={consultar} 
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Actualizar Datos'}
        </button>
        <button 
          className="secondary" 
          onClick={descargar}
          disabled={loading || datosTotales.length === 0}
        >
          Descargar Excel
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tabla de resultados */}
      <div className="table-container">
        <div className="table-scroll-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID / Equipo</th>
                <th>Lugar / Grados </th>
                <th>Medición (m/s)</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {paginaDatos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">
                    {datosTotales.length === 0 
                      ? 'Selecciona un rango de fechas y presiona "Actualizar Datos"' 
                      : 'No hay datos para el rango seleccionado'}
                  </td>
                </tr>
              ) : (
                paginaDatos.map((item, i) => {
                  const fecha = new Date(item.hora);
                  const horaStr = fecha.toLocaleTimeString();
                  const fechaStr = fecha.toLocaleDateString();
                  
                  return (
                    <tr key={i}>
                      <td>
                        <div>{item.id}</div>
                        <div>{item.instrumentModel}</div>
                      </td>
                      <td>
                        <div>{item.lugar || 'N/A'}</div>
                        <div>{item.position}°</div>
                      </td>
                      <td>{item.medicion} {item.unidad}</td>
                      <td>
                        <div>{horaStr}</div>
                        <div>{fechaStr}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {datosTotales.length > 0 && (
        <div className="pagination">
          <button 
            onClick={() => cambiarPagina(-1)} 
            disabled={paginaActual <= 1}
          >
            « Anterior
          </button>
          <span className="page-info">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button 
            onClick={() => cambiarPagina(1)} 
            disabled={paginaActual >= totalPaginas}
          >
            Siguiente »
          </button>
        </div>
      )}
    </div>
  );
};

export default Historics;