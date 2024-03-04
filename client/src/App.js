import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './components/home';
import MainVideoPage from './videoComponents/MainVideoPage';
import ProDashboard from './siteComponents/proDashboard';
import ProMainVideoPage from './videoComponents/ProMainVideoPage';

function App() {
  return (
    <Routes>
      {/* Route for home */}
      <Route path="/" element={<Home />} />

      {/* Routes for video for the normal user */}
      <Route path="/join-video" element={<MainVideoPage />} />

      {/* Route of dashboard for the professional */}
      <Route path="/dashboard" element={<ProDashboard />} />
      
      {/* Route for video for the professional */}
      <Route path="/join-video-pro" element={<ProMainVideoPage />} />
    </Routes>
  );
}

export default App;
