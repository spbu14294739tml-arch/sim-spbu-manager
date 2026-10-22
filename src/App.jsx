// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 1. Import Layout
import LayoutUtama from './layouts/LayoutUtama';

// 2. Import Halaman-halaman
import DashboardManager from './pages/DashboardManager';
import DatabaseKaryawan from './pages/DatabaseKaryawan';
import MasterTugas from './pages/MasterTugas'; 
import LaporanKerusakan from './pages/LaporanKerusakan';
import PengaturanSistem from './pages/PengaturanSistem';

function App() {
  return (
    <Router>
      <Routes>
        {/* Bungkus semua halaman dengan LayoutUtama */}
        <Route path="/" element={<LayoutUtama />}>
          
          {/* Halaman yang akan dirender di dalam <Outlet /> */}
          <Route index element={<DashboardManager />} />
          <Route path="karyawan" element={<DatabaseKaryawan />} />
          <Route path="master-tugas" element={<MasterTugas />} />
          <Route path="laporan-kerusakan" element={<LaporanKerusakan />} />
          <Route path="pengaturan" element={<PengaturanSistem />} />
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;