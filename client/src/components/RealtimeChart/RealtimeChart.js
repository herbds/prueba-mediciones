import { useRef, useEffect } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend, Filler);

const RealtimeChart = ({ data }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');

    if (!chartRef.current) {
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Velocidad del Viento (m/s)',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              time: {
                tooltipFormat: 'HH:mm:ss',
                displayFormats: {
                  second: 'HH:mm:ss'
                }
              },
              title: { display: true, text: 'Hora' },
              min: new Date(Date.now() - 10 * 60 * 1000),
              max: new Date()
            },
            y: {
              title: { display: true, text: 'Velocidad (m/s)' },
              min: 0
            }
          },
          plugins: {
            legend: { display: true },
            tooltip: {
              callbacks: {
                label: context => `${context.dataset.label}: ${context.parsed.y.toFixed(2)} m/s`
              }
            }
          }
        }
      });
    }

    if (data && data.length > 0) {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      const filtered = data.filter(d => new Date(d.hora) >= tenMinutesAgo);

      const sampled = filtered.filter((_, i) => i % Math.ceil(filtered.length / 30) === 0);

      chartRef.current.data.labels = sampled.map(d => new Date(d.hora));
      chartRef.current.data.datasets[0].data = sampled.map(d => ({ x: new Date(d.hora), y: d.velocidad }));

      chartRef.current.options.scales.x.min = tenMinutesAgo;
      chartRef.current.options.scales.x.max = now;

      chartRef.current.update('none');
    }

  }, [data]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '300px' }} />;
};

export default RealtimeChart;
