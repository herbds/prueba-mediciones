import { useState, useEffect, useRef } from 'react';
import { fetchRealtimeData } from './api/realtimeAPI';
import './Realtime.css';

const Realtime = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    velocidadPromedio: 0,
    position: '--',
    muestras: 0,
    instrumentModel: 'default'
  });
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { datos, promedio } = await fetchRealtimeData();
      setData(datos);
      setStats(promedio);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="realtime-container">
      <div className="header">
        <h1>Monitoreo en Tiempo Real</h1>
        <div className="status">
          {loading ? 'Actualizando...' : `Última actualización: ${new Date().toLocaleTimeString()}`}
        </div>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h3>Velocidad promedio</h3>
          <p>{stats.velocidadPromedio.toFixed(2)} m/s</p>
        </div>
        <div className="stat-card">
          <h3>Posición</h3>
          <p>{stats.position}</p>
        </div>
        <div className="stat-card">
          <h3>Muestras</h3>
          <p>{stats.muestras}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Velocidad</th>
            <th>Hora</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((item, i) => (
            <tr key={i}>
              <td>{item.instrumentModel}</td>
              <td>{item.velocidad} m/s</td>
              <td>{new Date(item.hora).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Realtime;