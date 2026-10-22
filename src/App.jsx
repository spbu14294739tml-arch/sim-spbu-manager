// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 1. Import Layout & Satpam
import LayoutUtama from './layouts/LayoutUtama';
import ProtectedRoute from './components/ProtectedRoute'; 

// 2. Import Halaman
import Login from './pages/Login';
import DashboardManager from './pages/DashboardManager';
import DatabaseKaryawan from './pages/DatabaseKaryawan';
import Absensi from './pages/Absensi'; // <-- Import Halaman Baru
import MasterTugas from './pages/MasterTugas'; 
import LaporanKerusakan from './pages/LaporanKerusakan';
import PengaturanSistem from './pages/PengaturanSistem';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<LayoutUtama />}>
            <Route index element={<DashboardManager />} />
            <Route path="karyawan" element={<DatabaseKaryawan />} />
            <Route path="absensi" element={<Absensi />} /> {/* <-- Rute Baru */}
            <Route path="master-tugas" element={<MasterTugas />} />
            <Route path="laporan-kerusakan" element={<LaporanKerusakan />} />
            <Route path="pengaturan" element={<PengaturanSistem />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;