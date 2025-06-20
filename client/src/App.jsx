import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Historics from './pages/Historics/Historics';
import Realtime from './pages/Realtime/Realtime';
import Configuration from './pages/Configuration/Configuration';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/historics" element={<Historics />} />
        <Route path="/realtime" element={<Realtime />} />
        <Route path="/configuration" element={<Configuration />} />
      </Routes>
    </Router>
  );
}

export default App;