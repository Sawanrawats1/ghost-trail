import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
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
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Home />} />
        <Route path="/trail/:id" element={<TrailDetail />} />
        <Route path="/add" element={<AddTrail />} />
        <Route path="/sos" element={<SOS />} />
      </Routes>
    </Router>
  );
}

export default App;