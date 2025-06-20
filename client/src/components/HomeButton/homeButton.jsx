import React from 'react';
import { useNavigate } from 'react-router-dom';
import './homeButton.css';

const HomeButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/'); // Navega a la ruta de inicio
  };

  return (
    <button 
      className="home-button" 
      onClick={handleClick}
    >
      Ir al Inicio
    </button>
  );
};

export default HomeButton;