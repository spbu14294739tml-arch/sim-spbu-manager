// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  Settings, 
  LogOut,
  UserCircle,
  UserCheck,
  ShoppingCart,
  FileText
} from 'lucide-react';
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
        setUserRole(user.user_metadata?.role || 'accounting');
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard, roles: ['manager', 'accounting'] },
    { path: '/karyawan', name: 'Database Karyawan', icon: Users, roles: ['manager'] },
    { path: '/absensi', name: 'Absensi Harian', icon: UserCheck, roles: ['manager', 'accounting'] },
    { path: '/kasir', name: 'Kasir & Penjualan', icon: ShoppingCart, roles: ['manager', 'accounting'] },
    { path: '/master-tugas', name: 'Master Tugas', icon: ClipboardList, roles: ['manager', 'accounting'] },
    { path: '/laporan-kerusakan', name: 'Laporan Kerusakan', icon: AlertTriangle, roles: ['manager', 'accounting'] },
    { path: '/laporan-kasir', name: 'Laporan Kasir', icon: FileText, roles: ['manager', 'accounting'] },
    { path: '/pengaturan', name: 'Pengaturan Sistem', icon: Settings, roles: ['manager'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-64 min-h-screen bg-slate-900/95 backdrop-blur-md text-slate-300 flex flex-col shadow-2xl z-20 border-r border-slate-800">
      
      {/* Header Sidebar */}
      <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <span className="text-white font-bold text-lg">SP</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">SIM SPBU</h1>
          <p className="text-xs text-slate-400 font-medium">14.294.739</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-6 overflow-y-auto px-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Menu Utama</p>
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/50' 
                  : 'hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Sidebar (Profil & Logout) */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
        <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
            <UserCircle size={24} className="text-blue-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 capitalize">Masuk sebagai: <span className="text-blue-400 font-semibold">{userRole}</span></p>
            <p className="text-xs font-medium text-white truncate" title={userEmail}>
              {userEmail || 'Memuat...'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full px-3 py-3 rounded-xl font-medium"
        >
          <LogOut size={20} />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </div>
  );
}