import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EQUIPOS } from '../../config/equipment';
import './Home.css';
import logo from '../../assets/Colaboracion_logo.jpg';

const Home = () => {
  const [equipo, setEquipo] = useState('Extech_45170');
  const navigate = useNavigate();

  useEffect(() => {
    const container = document.querySelector('.container');
    if (container) {
      container.style.opacity = '0';
      container.style.transform = 'translateY(30px)';
      setTimeout(() => {
        container.style.transition = 'all 0.8s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }, 100);
    }
  }, []);

  const handleNavigation = (path) => {
    navigate(`${path}?equipo=${equipo}`);
  };

  return (
    <div className="home-container">
      <div className="particles">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: `${[4, 6, 3, 5, 4, 7, 3, 5, 4][i]}px`,
              height: `${[4, 6, 3, 5, 4, 7, 3, 5, 4][i]}px`,
              left: `${10 + i * 10}%`,
              animationDelay: `${[0, 2, 4, 1, 3, 5, 2.5, 4.5, 1.5][i]}s`
            }}
          />
        ))}
      </div>

      <div className="container">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>

        <h1>Plataforma monitorización</h1>
        <p className="subtitle">Monitoreo avanzado condiciones ambientales</p>

        <div className="form-group">
          <label htmlFor="equipo" className="form-label">
            <i className="fas fa-satellite-dish"></i> Selecciona un equipo:
          </label>
          <div className="select-container">
            <select
              id="equipo"
              value={equipo}
              onChange={(e) => setEquipo(e.target.value)}
              className="form-select"
            >
              {Object.entries(EQUIPOS).map(([id, equipo]) => (
                <option key={id} value={id}>{equipo.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={() => handleNavigation('/historics')}>
            <i className="fas fa-chart-line"></i> Históricos
          </button>
          <button className="btn btn-secondary" onClick={() => handleNavigation('/realtime')}>
            <i className="fas fa-broadcast-tower"></i> Tiempo Real
          </button>
          <button className="btn btn-thirdary" onClick={() => handleNavigation('/configuration')}>
            <i className="fas fa-cog"></i> Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
