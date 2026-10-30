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
  FileText,
  FileCheck,
  PieChart, 
  Ticket,
  Barcode,
  Search,
  ChevronDown // <-- Ikon untuk buka-tutup
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  
  // State untuk kontrol buka-tutup menu Voucher
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

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

  // Jika sedang berada di halaman voucher, otomatis buka menunya saat pertama dimuat
  useEffect(() => {
    if (location.pathname.includes('/voucher-bbm')) {
      setIsVoucherOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    if (!window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isVoucherPage = location.pathname.includes('/voucher-bbm');
  const currentVoucherTab = new URLSearchParams(location.search).get('tab') || 'input';

  return (
    <div className="w-64 min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black text-slate-300 flex flex-col shadow-2xl z-20 border-r border-slate-800/50 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>

      {/* LOGO */}
      <div className="relative p-6 border-b border-slate-800/50 flex flex-col items-center justify-center text-center gap-2 z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent -z-10"></div>
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-white/10 p-1 mb-1">
          <img src="/logo-tml.png" alt="Logo TML" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight tracking-wide">SIM SPBU</h1>
          <p className="text-[10px] text-blue-400 font-medium tracking-widest mt-0.5">14.294.739</p>
        </div>
      </div>

      {/* MENU UTAMA */}
      <div className="flex-1 py-6 overflow-y-auto px-3 space-y-1 relative z-10 scrollbar-thin scrollbar-thumb-slate-700">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Menu Utama</p>
        
        {/* Dashboard, Karyawan, Absensi, Jurnal */}
        {[
          { path: '/', name: 'Dashboard', icon: LayoutDashboard, roles: ['manager', 'accounting', 'kasir'] },
          { path: '/karyawan', name: 'Database Karyawan', icon: Users, roles: ['manager'] },
          { path: '/absensi', name: 'Absensi', icon: UserCheck, roles: ['manager', 'accounting'] },
          { path: '/jurnal-transaksi', name: 'Jurnal Transaksi Kasir', icon: ShoppingCart, roles: ['kasir', 'manager'] },
        ].filter(item => item.roles.includes(userRole)).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${isActive ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white'}`}>
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}

        {/* === DROPDOWN MANAJEMEN VOUCHER === */}
        {['kasir', 'manager', 'accounting'].includes(userRole) && (
          <div className="pt-2">
            <button 
              onClick={() => setIsVoucherOpen(!isVoucherOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ${
                isVoucherPage ? 'bg-slate-800/80 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ticket size={18} className={isVoucherPage ? 'text-blue-400' : 'text-slate-400'} />
                <span className="text-sm">Voucher BBM</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isVoucherOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Sub-menu (Animasi Buka-Tutup) */}
            <div className={`overflow-hidden transition-all duration-300 ${isVoucherOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-col gap-1 pl-10 pr-3 py-1">
                <Link 
                  to="/voucher-bbm?tab=input" 
                  className={`flex items-center gap-2 py-2 text-sm rounded-lg transition-colors ${
                    isVoucherPage && currentVoucherTab === 'input' ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={14} /> Input Voucher
                </Link>
                <Link 
                  to="/voucher-bbm?tab=scan" 
                  className={`flex items-center gap-2 py-2 text-sm rounded-lg transition-colors ${
                    isVoucherPage && currentVoucherTab === 'scan' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Barcode size={14} /> Scan Fisik
                </Link>
                <Link 
                  to="/voucher-bbm?tab=macet" 
                  className={`flex items-center gap-2 py-2 text-sm rounded-lg transition-colors ${
                    isVoucherPage && currentVoucherTab === 'macet' ? 'text-red-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle size={14} /> Voucher Macet
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* MENU SISA */}
        <div className="pt-4">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Laporan & Lainnya</p>
          {[
            { path: '/master-tugas', name: 'Master Tugas', icon: ClipboardList, roles: ['manager', 'accounting'] },
            { path: '/laporan-kerusakan', name: 'Laporan Kerusakan', icon: AlertTriangle, roles: ['manager', 'accounting'] },
            { path: '/laporan-kasir', name: 'Laporan Kasir', icon: FileText, roles: ['manager', 'accounting'] },
            { path: '/laporan-rekap', name: 'Laporan Rekap Harian', icon: PieChart, roles: ['manager', 'accounting', 'kasir'] },
            { path: '/laporan-setoran', name: 'Laporan Setoran', icon: FileCheck, roles: ['manager', 'accounting', 'kasir'] },
            { path: '/pengaturan', name: 'Pengaturan Sistem', icon: Settings, roles: ['manager'] },
          ].filter(item => item.roles.includes(userRole)).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${isActive ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800/60 hover:text-white'}`}>
                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* USER PROFILE & LOGOUT */}
      <div className="p-4 border-t border-slate-800/50 bg-black/20 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-800/40 rounded-xl border border-slate-700/50 shadow-inner">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center ring-1 ring-slate-500/50">
            <UserCircle size={24} className="text-cyan-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 capitalize">Login sebagai: <span className="text-cyan-400 font-semibold">{userRole}</span></p>
            <p className="text-xs font-medium text-slate-200 truncate" title={userEmail}>
              {userEmail || 'Memuat...'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full px-3 py-3 rounded-xl font-medium group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </div>
  );
}