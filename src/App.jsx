import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { Loader2 } from 'lucide-react';

// Import Layout & Halaman
import LayoutUtama from './layouts/LayoutUtama';
import Login from './pages/Login';
import DashboardManager from './pages/DashboardManager';
import DatabaseKaryawan from './pages/DatabaseKaryawan';
import Absensi from './pages/Absensi';
import Kasir from './pages/Kasir';
import LaporanKasir from './pages/LaporanKasir';
import MasterTugas from './pages/MasterTugas'; 
import LaporanKerusakan from './pages/LaporanKerusakan';
import PengaturanSistem from './pages/PengaturanSistem';
import AccountingVoucher from './pages/AccountingVoucher'; // <-- IMPORT BARU
import LaporanSetoran from './pages/LaporanSetoran';

// 1. Satpam Umum (Cek Login)
function ProtectedRoute() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => authListener.subscription.unsubscribe();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// 2. Satpam Khusus Manager (Cek Role)
function ManagerRoute() {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.role === 'manager') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    };
    checkRole();
  }, []);

  if (isAuthorized === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (!isAuthorized) return <Navigate to="/" replace />;
  
  return <Outlet />;
}

// 3. Satpam Khusus Accounting (Cek Role)
function AccountingRoute() {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Bisa untuk accounting ATAU manager (manager punya akses penuh)
      if (user && (user.user_metadata?.role === 'accounting' || user.user_metadata?.role === 'manager')) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    };
    checkRole();
  }, []);

  if (isAuthorized === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (!isAuthorized) return <Navigate to="/" replace />;
  
  return <Outlet />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Satpam Umum: Harus Login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<LayoutUtama />}>
            <Route index element={<DashboardManager />} />
            <Route path="absensi" element={<Absensi />} />
            <Route path="kasir" element={<Kasir />} />
            <Route path="laporan-kasir" element={<LaporanKasir />} />
            <Route path="master-tugas" element={<MasterTugas />} />
            <Route path="laporan-kerusakan" element={<LaporanKerusakan />} />
            <Route path="/laporan-setoran" element={<LaporanSetoran />} />    
            {/* RUTE ACCOUNTING (Dilindungi Satpam Accounting) */}
            <Route element={<AccountingRoute />}>
              <Route path="accounting-voucher" element={<AccountingVoucher />} />
            </Route>

            {/* RUTE MANAGER (Dilindungi Satpam Manager) */}
            <Route element={<ManagerRoute />}>
              <Route path="karyawan" element={<DatabaseKaryawan />} />
              <Route path="pengaturan" element={<PengaturanSistem />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;