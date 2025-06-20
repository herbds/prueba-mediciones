import React, { useState, useEffect } from 'react';
import HomeButton from '../../components/HomeButton/homeButton';


const Configuration = () => {
  const [buildingArea, setBuildingArea] = useState([]);
  const [areaStep, setAreaStep] = useState(1);
  const [isAreaDefined, setIsAreaDefined] = useState(false);
  const [points, setPoints] = useState([]);
  const [selectedPointId, setSelectedPointId] = useState('ID1');
  const [status, setStatus] = useState('idle');
  const [locationMethod, setLocationMethod] = useState('enhanced-gps');
  const [currentAccuracy, setCurrentAccuracy] = useState(null);
  const [ipLocation, setIpLocation] = useState(null);

  const pointIds = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5'];

  // Obtener ubicación por IP al cargar (como referencia)
  useEffect(() => {
    getIPLocation();
  }, []);

  // Método 1: GPS Mejorado con múltiples lecturas
  const getEnhancedGPSLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      setStatus('locating');
      const readings = [];
      let readingCount = 0;
      const maxReadings = 8; // Más lecturas para mejor precisión

      const options = {
        enableHighAccuracy: true,
        timeout: 45000, // Más tiempo para obtener señal precisa
        maximumAge: 0
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          readings.push({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          });
          
          readingCount++;
          setCurrentAccuracy(position.coords.accuracy);

          if (readingCount >= maxReadings) {
            navigator.geolocation.clearWatch(watchId);
            processReadings(readings, resolve);
          }
        },
        (error) => {
          setStatus('idle');
          reject(error);
        },
        options
      );

      // Timeout con lecturas parciales
      setTimeout(() => {
        if (readings.length > 0) {
          navigator.geolocation.clearWatch(watchId);
          processReadings(readings, resolve);
        } else {
          setStatus('idle');
          reject(new Error('No se pudieron obtener lecturas GPS'));
        }
      }, 40000);
    });
  };

  const processReadings = (readings, resolve) => {
    // Filtrar lecturas más precisas
    const preciseReadings = readings
      .filter(r => r.accuracy <= 15) // Solo lecturas con precisión <= 15m
      .sort((a, b) => a.accuracy - b.accuracy);

    const readingsToUse = preciseReadings.length >= 3 ? 
      preciseReadings.slice(0, 5) : 
      readings.sort((a, b) => a.accuracy - b.accuracy).slice(0, Math.min(5, readings.length));

    // Calcular promedio ponderado por precisión
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    readingsToUse.forEach(reading => {
      const weight = 1 / (reading.accuracy + 1); // Más peso a lecturas más precisas
      weightedLat += reading.lat * weight;
      weightedLng += reading.lng * weight;
      totalWeight += weight;
    });

    const avgLat = weightedLat / totalWeight;
    const avgLng = weightedLng / totalWeight;
    const bestAccuracy = Math.min(...readingsToUse.map(r => r.accuracy));

    setStatus('idle');
    resolve({
      lat: avgLat,
      lng: avgLng,
      accuracy: bestAccuracy,
      method: 'enhanced-gps',
      readingsUsed: readingsToUse.length,
      totalReadings: readings.length
    });
  };

  // Método 2: Coordenadas manuales con validación
  const getManualLocation = () => {
    return new Promise((resolve, reject) => {
      const latStr = prompt('Ingrese la latitud (formato: -12.123456):');
      const lngStr = prompt('Ingrese la longitud (formato: -77.123456):');
      
      if (!latStr || !lngStr) {
        reject(new Error('Coordenadas no proporcionadas'));
        return;
      }

      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      
      // Validar rangos de coordenadas
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        reject(new Error('Coordenadas inválidas'));
        return;
      }

      resolve({
        lat: lat,
        lng: lng,
        accuracy: 0.1, // Asumimos alta precisión manual
        method: 'manual'
      });
    });
  };

  // Método 3: Ubicación por IP (como referencia, no para mediciones precisas)
  const getIPLocation = async () => {
    try {
      const response = await fetch('https://ip-api.com/json/?fields=status,lat,lon,city,country,query');
      const data = await response.json();
      
      if (data.status === 'success') {
        setIpLocation({
          lat: data.lat,
          lng: data.lon,
          city: data.city,
          country: data.country,
          ip: data.query
        });
      }
    } catch (error) {
      console.log('Error obteniendo ubicación por IP:', error);
    }
  };

  const getIPLocationAsCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!ipLocation) {
        reject(new Error('Ubicación por IP no disponible'));
        return;
      }

      const useIP = window.confirm(`¿Usar ubicación aproximada por IP?\n${ipLocation.city}, ${ipLocation.country}\nLat: ${ipLocation.lat}, Lng: ${ipLocation.lng}\n\nNOTA: Esta ubicación es aproximada (precisión: ~1-10km)`);
      
      if (useIP) {
        resolve({
          lat: ipLocation.lat,
          lng: ipLocation.lng,
          accuracy: 5000, // 5km de precisión aproximada
          method: 'ip-location',
          city: ipLocation.city,
          country: ipLocation.country
        });
      } else {
        reject(new Error('Ubicación por IP rechazada'));
      }
    });
  };

  // Método 4: Geocodificación inversa gratuita
  const getReverseGeocodeLocation = async () => {
    return new Promise(async (resolve, reject) => {
      const address = prompt('Ingrese la dirección exacta:');
      if (!address) {
        reject(new Error('Dirección no proporcionada'));
        return;
      }

      try {
        setStatus('locating');
        // Usando geocode.maps.co (gratuito)
        const response = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(address)}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          resolve({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            accuracy: 10, // Precisión típica de geocodificación
            method: 'geocoding',
            address: result.display_name
          });
        } else {
          reject(new Error('Dirección no encontrada'));
        }
      } catch (error) {
        reject(new Error('Error en geocodificación: ' + error.message));
      } finally {
        setStatus('idle');
      }
    });
  };

  // Función principal para obtener ubicación
  const getCurrentLocation = async () => {
    try {
      switch (locationMethod) {
        case 'enhanced-gps':
          return await getEnhancedGPSLocation();
        case 'manual':
          return await getManualLocation();
        case 'ip-location':
          return await getIPLocationAsCoordinates();
        case 'geocoding':
          return await getReverseGeocodeLocation();
        default:
          return await getEnhancedGPSLocation();
      }
    } catch (error) {
      throw error;
    }
  };

  // Registrar punto del área
  const registerAreaPoint = async () => {
    try {
      const location = await getCurrentLocation();
      const newArea = [...buildingArea, location];
      setBuildingArea(newArea);
      
      if (areaStep < 4) {
        setAreaStep(areaStep + 1);
        alert(`Punto ${areaStep} registrado con precisión ±${location.accuracy}m.\nRegistre el punto ${areaStep + 1}`);
      } else {
        setIsAreaDefined(true);
        alert('Área del edificio definida con éxito');
      }
    } catch (error) {
      alert(`Error al obtener ubicación: ${error.message}`);
    }
  };

  // Registrar punto específico
  const registerPoint = async () => {
    if (!isAreaDefined) {
      alert('Primero debe definir el área del edificio');
      return;
    }
    
    try {
      const location = await getCurrentLocation();
      const isInside = isPointInPolygon(location, buildingArea);
      
      // Calcular distancias a vértices
      const vertexDistances = buildingArea.map((point, index) => ({
        vertex: index + 1,
        distance: calculateDistance(location, point)
      }));
      
      // Calcular distancias a lados
      const sideDistances = buildingArea.map((point, index) => {
        const nextPoint = buildingArea[(index + 1) % buildingArea.length];
        return {
          side: index + 1,
          distance: distanceToLineSegment(location, point, nextPoint)
        };
      });
      
      const newPoint = {
        id: selectedPointId,
        location,
        isInside,
        accuracy: location.accuracy,
        method: location.method,
        vertexDistances,
        sideDistances,
        additionalInfo: {
          readingsUsed: location.readingsUsed,
          totalReadings: location.totalReadings,
          address: location.address,
          city: location.city,
          country: location.country
        },
        timestamp: new Date().toISOString()
      };
      
      setPoints([
        ...points.filter(p => p.id !== selectedPointId),
        newPoint
      ]);
      
      alert(`Punto ${selectedPointId} registrado: ${isInside ? 'DENTRO' : 'FUERA'}\nPrecisión: ±${location.accuracy}m`);
    } catch (error) {
      alert(`Error al registrar punto: ${error.message}`);
    }
  };

  // Algoritmo ray casting para punto en polígono
  const isPointInPolygon = (point, polygon) => {
    const x = point.lat, y = point.lng;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Fórmula de Haversine
  const calculateDistance = (point1, point2) => {
    const R = 6371e3;
    const φ1 = point1.lat * Math.PI/180;
    const φ2 = point2.lat * Math.PI/180;
    const Δφ = (point2.lat - point1.lat) * Math.PI/180;
    const Δλ = (point2.lng - point1.lng) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 100) / 100;
  };

  // Distancia de punto a segmento de línea
  const distanceToLineSegment = (point, lineStart, lineEnd) => {
    const A = point.lat - lineStart.lat;
    const B = point.lng - lineStart.lng;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lng - lineStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.lat;
      yy = lineStart.lng;
    } else if (param > 1) {
      xx = lineEnd.lat;
      yy = lineEnd.lng;
    } else {
      xx = lineStart.lat + param * C;
      yy = lineStart.lng + param * D;
    }

    return calculateDistance(point, { lat: xx, lng: yy });
  };

  const resetArea = () => {
    setBuildingArea([]);
    setAreaStep(1);
    setIsAreaDefined(false);
  };

  return (
    <div className="configuration-container" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: '30px'
      }}>Configuración de Ubicación de Alta Precisión</h2>
      
      {/* Selector de método */}
      <div className="section" style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h3>Método de Localización</h3>
        <div className="method-selector">
          <select 
            value={locationMethod}
            onChange={(e) => setLocationMethod(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              width: '100%',
              marginBottom: '10px'
            }}
          >
            <option value="enhanced-gps">GPS Mejorado (múltiples lecturas)</option>
            <option value="manual">Coordenadas Manuales</option>
            <option value="geocoding">Geocodificación por Dirección</option>
            <option value="ip-location">Ubicación por IP (aproximada)</option>
          </select>
          
          {currentAccuracy && (
            <div className="accuracy-display" style={{
              backgroundColor: '#e8f5e8',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#2d5a2d',
              marginBottom: '10px'
            }}>
              Precisión actual: ±{currentAccuracy.toFixed(1)}m
            </div>
          )}
          
          {ipLocation && (
            <div className="ip-info" style={{
              backgroundColor: '#e8f4f8',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#2d4a5a',
              marginBottom: '10px'
            }}>
              Ubicación por IP: {ipLocation.city}, {ipLocation.country}
            </div>
          )}
        </div>
        
        <div className="method-description" style={{
          backgroundColor: '#fff',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          fontSize: '14px',
          marginTop: '10px'
        }}>
          {locationMethod === 'enhanced-gps' && (
            <p><strong>GPS Mejorado:</strong> Toma múltiples lecturas GPS y calcula un promedio ponderado por precisión. Ideal para exteriores.</p>
          )}
          {locationMethod === 'manual' && (
            <p><strong>Coordenadas Manuales:</strong> Para usar coordenadas obtenidas con instrumentos de topografía profesional.</p>
          )}
          {locationMethod === 'geocoding' && (
            <p><strong>Geocodificación:</strong> Convierte direcciones en coordenadas usando API gratuita. Precisión típica: ±10m.</p>
          )}
          {locationMethod === 'ip-location' && (
            <p><strong>Ubicación por IP:</strong> Solo para referencia aproximada. Precisión: 1-10km. No usar para mediciones precisas.</p>
          )}
        </div>
      </div>
      
      {/* Área del edificio */}
      <div className="section" style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h3>Definir Área del Edificio</h3>
        
        {!isAreaDefined ? (
          <div>
            <p>Registre los 4 vértices del área (Punto {areaStep}/4)</p>
            <button 
              onClick={registerAreaPoint}
              disabled={status !== 'idle'}
              style={{
                backgroundColor: status !== 'idle' ? '#95a5a6' : '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: status !== 'idle' ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.3s',
                margin: '5px 0'
              }}
            >
              {status === 'locating' ? 'Obteniendo ubicación precisa...' : `Registrar Vértice ${areaStep}`}
            </button>
          </div>
        ) : (
          <div>
            <p className="success-message" style={{
              color: '#27ae60',
              fontWeight: 'bold'
            }}>✓ Área definida correctamente</p>
            <button 
              onClick={resetArea} 
              className="secondary-btn"
              style={{
                backgroundColor: '#7f8c8d',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.3s',
                margin: '5px 0'
              }}
            >
              Redefinir Área
            </button>
            <div className="area-points">
              <h4>Vértices del área:</h4>
              <ul>
                {buildingArea.map((point, index) => (
                  <li key={index}>
                    <strong>V{index + 1}:</strong> {point.lat.toFixed(8)}, {point.lng.toFixed(8)} 
                    <span className="accuracy">(±{point.accuracy}m - {point.method})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Puntos específicos */}
      <div className="section">
        <h3>Registrar Puntos Específicos</h3>
        
        <div className="point-controls">
          <select 
            value={selectedPointId}
            onChange={(e) => setSelectedPointId(e.target.value)}
            disabled={!isAreaDefined}
          >
            {pointIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          
          <button
            onClick={registerPoint}
            disabled={status !== 'idle' || !isAreaDefined}
          >
            {status === 'locating' ? 'Ubicando con precisión...' : 'Registrar Punto Actual'}
          </button>
        </div>
        
        {points.length > 0 && (
          <div className="points-list">
            <h4>Puntos registrados:</h4>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Coordenadas</th>
                  <th>Estado</th>
                  <th>Precisión</th>
                  <th>Método</th>
                  <th>Dist. a lados (m)</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point, index) => (
                  <tr key={index}>
                    <td>{point.id}</td>
                    <td className="coordinates">
                      {point.location.lat.toFixed(8)}<br/>
                      {point.location.lng.toFixed(8)}
                    </td>
                    <td className={point.isInside ? 'inside' : 'outside'}>
                      {point.isInside ? 'DENTRO' : 'FUERA'}
                    </td>
                    <td>±{point.accuracy}m</td>
                    <td className="method-cell">
                      {point.method}
                      {point.additionalInfo.readingsUsed && (
                        <small>({point.additionalInfo.readingsUsed}/{point.additionalInfo.totalReadings} lecturas)</small>
                      )}
                    </td>
                    <td className="distances">
                      {point.sideDistances.map(d => 
                        `L${d.side}:${d.distance.toFixed(2)}m`
                      ).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Información de ayuda */}
      <div className="section info-section">
        <h4>Recomendaciones para Mayor Precisión:</h4>
        <ul>
          <li><strong>GPS Mejorado:</strong> Use en exteriores con cielo despejado. Espere a que la precisión sea ≤ 5m.</li>
          <li><strong>Coordenadas Manuales:</strong> Ideal para usar con estación total, GPS RTK o aplicaciones de topografía.</li>
          <li><strong>Geocodificación:</strong> Útil cuando tiene direcciones exactas pero no coordenadas precisas.</li>
          <li><strong>Evite usar cerca de:</strong> Edificios altos, túneles, bosques densos o en días de tormenta.</li>
        </ul>
      </div>

      {/* Botón de inicio */}
      <div style={{
        marginTop: '40px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <HomeButton />
      </div>
    </div>
  );
};

export default Configuration;