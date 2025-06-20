import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchRealtimeData } from './api/realtimeAPI';
import { getEquipoById } from '../../config/equipment';
import './Realtime.css';
import HomeButton from '../../components/HomeButton/homeButton';
import { Chart } from "chart.js/auto";
import 'chartjs-adapter-date-fns';

const Realtime = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    velocidadPromedio: 0,
    position: '--',
    muestras: 0,
    instrumentModel: '--'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [searchParams] = useSearchParams();
  const equipoId = searchParams.get('equipo') || 'equipoA';
  const equipo = getEquipoById(equipoId);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { datos, promedio } = await fetchRealtimeData(equipoId);
      if (!datos || datos.length === 0) {
        setError(`No hay datos en tiempo real para ${equipo.nombre}`);
        setData([]);
      } else {
        setData(datos);
        setStats(promedio);
        updateChart(datos);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar datos en tiempo real");
    } finally {
      setLoading(false);
    }
  };

  const updateChart = (datos) => {
    if (!chartInstance.current || !Array.isArray(datos)) return;
    const tiempoLimite = new Date(Date.now() - 10 * 60 * 1000);
    const datosFiltrados = datos.filter(d => new Date(d.hora) >= tiempoLimite);

    const labels = datosFiltrados.map(d => new Date(d.hora));
    const values = datosFiltrados.map(d => d.velocidad);

    chartInstance.current.data.labels = labels;
    chartInstance.current.data.datasets[0].data = values;
    chartInstance.current.update('none');
  };

  const initChart = () => {
    if (chartRef.current && !chartInstance.current) {
      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Velocidad (m/s)',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            fill: true,
            tension: 0.2,
            pointRadius: 2,
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                tooltipFormat: 'HH:mm:ss',
                displayFormats: {
                  second: 'HH:mm:ss',
                  minute: 'HH:mm'
                }
              },
              title: {
                display: true,
                text: 'Hora'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Velocidad (m/s)'
              }
            }
          },
          plugins: {
            legend: {
              display: true
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    initChart();
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [equipoId]);

  // Solo mostrar las últimas 4
  const ultimas = data.slice(0, 4);

  return (
    <div className="realtime-container fade-in">
      <div className="particles">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="container">
        <div className="btn-container">
          <HomeButton />
        </div>

        <div className="header">
          <h1>Monitoreo en Tiempo Real</h1>
          <div className="timestamp">
            {loading ? 'Actualizando...' : `Última actualización: ${new Date().toLocaleTimeString()}`}
          </div>
        </div>

        {error && <div className="alert">{error}</div>}

        <div className="resumen">
          <strong>Promedio últimos 5 segundos:</strong><br />
          {stats.velocidadPromedio.toFixed(2)} m/s | Posición: {stats.position} | Muestras: {stats.muestras}
        </div>

        {/* Tabla identica a la de Historics, pero con solo 4 registros */}
        <div className="table-container">
          <div className="table-scroll-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID / Equipo</th>
                  <th>Lugar / Grados</th>
                  <th>Medición (m/s)</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {ultimas.length > 0 ? (
                  ultimas.map((d, i) => {
                    const horaStr = new Date(d.hora).toLocaleTimeString();
                    const fechaStr = new Date(d.hora).toLocaleDateString();
                    return (
                      <tr key={i}>
                        <td>
                          <div>{d.id || '—'}</div>
                          <div>{d.instrumentModel}</div>
                        </td>
                        <td>
                          <div>{d.lugar || '—'}</div>
                          <div>{d.position}°</div>
                        </td>
                        <td>{d.velocidad.toFixed(2)} m/s</td>
                        <td>
                          <div>{horaStr}</div>
                          <div>{fechaStr}</div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">
                      {loading ? 'Cargando datos...' : 'No hay datos disponibles'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico */}
        <div className="chart-wrapper">
          <div className="chart-container">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Realtime;
