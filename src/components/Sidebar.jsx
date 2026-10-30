// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, ShoppingCart, Ticket, Barcode, AlertTriangle, FileText, FileCheck, PieChart, Settings, LogOut, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        setUserRole(user.user_metadata?.role || 'kasir'); 
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
    await supabase.auth.signOut();
    navigate('/login');
  };

  // MENU LANGSUNG TAMPIL SEMUA (Tanpa Filter Role)
  const menuItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/jurnal-transaksi', name: 'Jurnal Transaksi Kasir', icon: ShoppingCart },
    { path: '/voucher-bbm', name: 'Manajemen Voucher BBM', icon: Ticket },
    { path: '/laporan-rekap', name: 'Laporan Rekap Harian', icon: PieChart },
    { path: '/laporan-setoran', name: 'Laporan Setoran', icon: FileCheck },
    { path: '/pengaturan', name: 'Pengaturan Sistem', icon: Settings },
  ];

  return (
    <div className="w-64 min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black text-slate-300 flex flex-col shadow-2xl z-20 border-r border-slate-800/50">
      
      <div className="p-6 border-b border-slate-800/50 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-1 mb-2">
          <img src="/logo-tml.png" alt="Logo TML" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-lg font-bold text-white">SIM SPBU</h1>
        <p className="text-[10px] text-blue-400 tracking-widest">14.294.739</p>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase mb-2">Menu Utama</p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-800/40 rounded-xl">
          <UserCircle size={24} className="text-cyan-400" />
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400">Login: <span className="text-cyan-400 font-semibold">{userRole}</span></p>
            <p className="text-xs text-slate-200 truncate">{userEmail || 'Memuat...'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 w-full px-3 py-3 rounded-xl font-medium">
          <LogOut size={20} />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </div>
  );
}