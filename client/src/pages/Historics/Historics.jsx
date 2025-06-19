import { useState, useEffect } from 'react';
import { fetchHistoricalData, downloadCSV } from './api/historicsAPI';
import './Historics.css';

const Historics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const loadData = async (startDate, endDate) => {
    setLoading(true);
    try {
      const result = await fetchHistoricalData(null, startDate, endDate);
      setData(result);
      setPage(1);
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    loadData(
      weekAgo.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    );
  }, []);

  return (
    <div className="historics-container">
      <div className="controls">
        <button 
          onClick={() => loadData(
            document.getElementById('startDate').value,
            document.getElementById('endDate').value
          )}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Actualizar Datos'}
        </button>
        <button 
          onClick={() => downloadCSV(
            document.getElementById('startDate').value,
            document.getElementById('endDate').value
          )}
        >
          Descargar CSV
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Posición</th>
            <th>Velocidad (km/h)</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {data
            .slice((page - 1) * itemsPerPage, page * itemsPerPage)
            .map((item, i) => (
              <tr key={i}>
                <td>{item.position}</td>
                <td>{item.velocidad} {item.unidad}</td>
                <td>{new Date(item.hora).toLocaleString()}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
};

export default Historics;