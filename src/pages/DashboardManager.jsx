// src/pages/DashboardManager.jsx
import React, { useState, useEffect } from 'react';
import { Users, UserCheck, AlertTriangle, ArrowRight, ShieldCheck, Clock, Loader2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DashboardManager() {
  const [stats, setStats] = useState({ totalKaryawan: 0, hadirHariIni: 0, laporanPending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [waktu, setWaktu] = useState(new Date());
  const [chartKehadiran, setChartKehadiran] = useState([]);
  const [chartLaporan, setChartLaporan] = useState([]);
  
  // State untuk deteksi Online/Offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const fetchData = async () => {
    setIsLoading(true);
    
    const { count: total } = await supabase.from('karyawan').select('*', { count: 'exact', head: true });
    const { count: hadir } = await supabase.from('absensi').select('*', { count: 'exact', head: true }).eq('tanggal', getTodayDate()).eq('status_kehadiran', 'Hadir');
    const { count: pending } = await supabase.from('laporan_kerusakan').select('*', { count: 'exact', head: true }).eq('status', 'Pending');

    setStats({ totalKaryawan: total || 0, hadirHariIni: hadir || 0, laporanPending: pending || 0 });

    // Grafik Kehadiran
    const tujuhHariLalu = new Date();
    tujuhHariLalu.setDate(tujuhHariLalu.getDate() - 6);
    const { data: absensi7Hari } = await supabase.from('absensi').select('tanggal').gte('tanggal', tujuhHariLalu.toISOString().split('T')[0]).eq('status_kehadiran', 'Hadir');
    if (absensi7Hari) {
      const rekapHarian = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        rekapHarian[d.toISOString().split('T')[0]] = 0;
      }
      absensi7Hari.forEach(item => { if (rekapHarian[item.tanggal] !== undefined) rekapHarian[item.tanggal] += 1; });
      setChartKehadiran(Object.keys(rekapHarian).sort().map(date => ({ tanggal: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), hadir: rekapHarian[date] })));
    }

    // Grafik Laporan
    const { data: semuaLaporan } = await supabase.from('laporan_kerusakan').select('status');
    if (semuaLaporan) {
      const rekapStatus = { Pending: 0, Disetujui: 0, Ditolak: 0 };
      semuaLaporan.forEach(l => { if (rekapStatus[l.status] !== undefined) rekapStatus[l.status] += 1; });
      setChartLaporan([
        { name: 'Pending', value: rekapStatus.Pending, color: '#eab308' },
        { name: 'Disetujui', value: rekapStatus.Disetujui, color: '#22c55e' },
        { name: 'Ditolak', value: rekapStatus.Ditolak, color: '#ef4444' },
      ]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setWaktu(new Date()), 1000);

    // Logika Deteksi Online/Offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTanggal = waktu.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatJam = waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-slate-800">Selamat Datang, Pak Dadang! 👋</h1>
          <p className="text-slate-500 mt-2 text-lg">Berikut adalah ringkasan operasional SPBU 14.294.739 hari ini.</p>
        </div>
        <div className="text-left md:text-right bg-white/60 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-white/80">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{formatTanggal}</p>
          <p className="text-xl font-black text-blue-600 flex items-center md:justify-end gap-2 mt-1"><Clock size={20} /> {formatJam}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-white/50 flex items-center gap-5 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Users size={32} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Karyawan</p>
            <h3 className="text-4xl font-black text-slate-800 mt-1">{isLoading ? <Loader2 className="animate-spin" size={24} /> : `${stats.totalKaryawan}`}</h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-white/50 flex items-center gap-5 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-2xl flex items-center justify-center shadow-inner"><UserCheck size={32} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Hadir Hari Ini</p>
            <h3 className="text-4xl font-black text-slate-800 mt-1">{isLoading ? <Loader2 className="animate-spin" size={24} /> : `${stats.hadirHariIni}`}</h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-white/50 flex items-center gap-5 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner"><AlertTriangle size={32} /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Laporan Pending</p>
            <h3 className="text-4xl font-black text-slate-800 mt-1">{isLoading ? <Loader2 className="animate-spin" size={24} /> : `${stats.laporanPending}`}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={24} className="text-blue-500"/> Tren Kehadiran (7 Hari Terakhir)</h2>
          <div className="h-72 w-full">
            {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartKehadiran} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="hadir" name="Hadir" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Status Laporan</h2>
          <div className="h-72 w-full">
            {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartLaporan} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                    {chartLaporan.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-5">Aksi Cepat</h2>
          <div className="space-y-3">
            <Link to="/karyawan" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-all duration-300 group border border-transparent hover:border-blue-200">
              <div className="flex items-center gap-4"><Users className="text-slate-400 group-hover:text-blue-600" size={24} /><span className="font-semibold text-slate-700 group-hover:text-blue-700">Kelola Database Karyawan</span></div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/kasir" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-green-50 rounded-2xl transition-all duration-300 group border border-transparent hover:border-green-200">
              <div className="flex items-center gap-4"><TrendingUp className="text-slate-400 group-hover:text-green-600" size={24} /><span className="font-semibold text-slate-700 group-hover:text-green-700">Input Penjualan Kasir</span></div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-green-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/laporan-kerusakan" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50 rounded-2xl transition-all duration-300 group border border-transparent hover:border-orange-200">
              <div className="flex items-center gap-4"><AlertTriangle className="text-slate-400 group-hover:text-orange-600" size={24} /><span className="font-semibold text-slate-700 group-hover:text-orange-700">Cek Laporan Kerusakan</span></div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck size={180} /></div>
          <h2 className="text-2xl font-bold mb-3 relative z-10">Sistem Berjalan Normal</h2>
          <p className="text-slate-300 text-base mb-8 relative z-10 leading-relaxed">Semua modul terhubung dengan baik ke Server Cloud Supabase. Data tersimpan secara aman dan terpusat.</p>
          
          {/* INDIKATOR STATUS DINAMIS */}
          <div className={`flex items-center gap-3 text-base font-medium px-5 py-2.5 rounded-2xl relative z-10 backdrop-blur-md border transition-colors duration-300 ${
            isOnline 
              ? 'bg-blue-500/30 text-blue-100 border-blue-400/30' 
              : 'bg-red-500/30 text-red-100 border-red-400/30'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isOnline ? 'bg-blue-400' : 'bg-red-400'}`}></div>
            Status: {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>
    </div>
  );
}