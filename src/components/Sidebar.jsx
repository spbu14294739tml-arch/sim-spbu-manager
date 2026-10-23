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
  ShoppingCart
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState(''); // State untuk menyimpan role

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        // Ambil role dari user_metadata
        const role = user.user_metadata?.role || 'accounting'; // Default ke accounting jika tidak ada role
        setUserRole(role);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Daftar Menu Lengkap
  const menuItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard, roles: ['manager', 'accounting'] },
    { path: '/karyawan', name: 'Database Karyawan', icon: Users, roles: ['manager'] }, // Hanya Manager
    { path: '/absensi', name: 'Absensi Harian', icon: UserCheck, roles: ['manager', 'accounting'] },
    { path: '/master-tugas', name: 'Master Tugas', icon: ClipboardList, roles: ['manager', 'accounting'] },
    { path: '/laporan-kerusakan', name: 'Laporan Kerusakan', icon: AlertTriangle, roles: ['manager', 'accounting'] },
    { path: '/pengaturan', name: 'Pengaturan Sistem', icon: Settings, roles: ['manager'] }, // Hanya Manager
    { path: '/kasir', name: 'Kasir & Penjualan', icon: ShoppingCart, roles: ['manager', 'accounting'] },
  ];

  // Filter menu berdasarkan role user
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-64 min-h-screen bg-slate-900 text-white flex flex-col shadow-xl">
      <div className="p-5 border-b border-slate-700 bg-slate-950">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">SP</div>
          SIM SPBU
        </h1>
        <p className="text-xs text-slate-400 mt-1">14.294.739</p>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white font-medium' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-950">
        <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-800/50 rounded-lg">
          <UserCircle size={24} className="text-blue-400" />
          <div className="overflow-hidden">
            <p className="text-xs text-slate-400 capitalize">Masuk sebagai: {userRole}</p>
            <p className="text-sm font-medium text-white truncate" title={userEmail}>
              {userEmail || 'Memuat...'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full px-3 py-2.5 rounded-lg"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Keluar</span>
        </button>
      </div>
    </div>
  );
}