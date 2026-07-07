import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TrailDetail from './pages/TrailDetail';
import AddTrail from './pages/AddTrail';
import SOS from './pages/SOS';
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trail/:id" element={<TrailDetail />} />
        <Route path="/add" element={<AddTrail />} />
        <Route path="/sos" element={<SOS />} />
      </Routes>
    </Router>
  );
}

export default App;