import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Historics from './pages/Historics/Historics';
import Realtime from './pages/Realtime/Realtime';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/historics" element={<Historics />} />
        <Route path="/realtime" element={<Realtime />} />
      </Routes>
    </Router>
  );
}

export default App;