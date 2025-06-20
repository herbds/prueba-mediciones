import { useState } from 'react';
import './DataTable.css';

const DataTable = ({ 
  data, 
  columns, 
  loading, 
  onRefresh,
  onFilter,
  onColumnToggle,
  pagination = true,
  itemsPerPage = 12
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    desde: '',
    hasta: ''
  });

  // Paginación
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = pagination 
    ? data.slice(startIdx, startIdx + itemsPerPage)
    : data;

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handlePageChange = (delta) => {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="data-table-container">
      {/* Controles */}
      <div className="table-controls">
        <button onClick={onRefresh} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar Datos'}
        </button>
        
        <div className="filter-controls">
          <input
            type="datetime-local"
            name="desde"
            value={filters.desde}
            onChange={handleFilterChange}
            placeholder="Desde"
          />
          <input
            type="datetime-local"
            name="hasta"
            value={filters.hasta}
            onChange={handleFilterChange}
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>
                  {col.label}
                  {col.optional && (
                    <button 
                      onClick={() => onColumnToggle(col.key)}
                      className="column-toggle"
                    >
                      {col.visible ? '⬇️' : '⬆️'}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={`${i}-${col.key}`}>
                      {row[col.key] || 'N/A'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  {loading ? 'Cargando...' : 'No hay datos disponibles'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination && data.length > 0 && (
        <div className="pagination-controls">
          <button 
            onClick={() => handlePageChange(-1)} 
            disabled={currentPage <= 1}
          >
            Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={currentPage >= totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;