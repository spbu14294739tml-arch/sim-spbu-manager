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
    return () => clearInterval(timer);
  }, []);

  const formatTanggal = waktu.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatJam = waktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Selamat Datang, Pak Dadang! 👋</h1>
          <p className="text-slate-500 mt-2">Berikut adalah ringkasan operasional SPBU 14.294.739 hari ini.</p>
        </div>
        <div className="text-left md:text-right bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500">{formatTanggal}</p>
          <p className="text-lg font-bold text-blue-600 flex items-center md:justify-end gap-2 mt-1"><Clock size={18} /> {formatJam}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-500/30 flex items-center gap-4 text-white hover:scale-[1.02] transition-transform duration-300">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Users size={28} /></div>
          <div>
            <p className="text-sm font-medium text-blue-100">Total Karyawan</p>
            <h3 className="text-3xl font-bold">{isLoading ? <Loader2 className="animate-spin" size={24} /> : `${stats.totalKaryawan}`}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center"><UserCheck size={28} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Hadir Hari Ini</p>
            <h3 className="text-3xl font-bold text-slate-800">{isLoading ? <Loader2 className="animate-spin" size={24} /> : `${stats.hadirHariIni}`}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center"><AlertTriangle size={28} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Laporan Pending</p>
            <h3 className="text-3xl font-bold text-slate-800">{isLoading ? <Loader2 className="animate-spin" size={24} /> : `${stats.laporanPending}`}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-blue-500"/> Tren Kehadiran (7 Hari Terakhir)</h2>
          <div className="h-72 w-full">
            {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartKehadiran} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="hadir" name="Hadir" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Status Laporan</h2>
          <div className="h-72 w-full">
            {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartLaporan} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartLaporan.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <Link to="/karyawan" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3"><Users className="text-slate-400 group-hover:text-blue-600" size={20} /><span className="font-medium text-slate-700 group-hover:text-blue-700">Kelola Database Karyawan</span></div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600" />
            </Link>
            <Link to="/kasir" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-green-50 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3"><TrendingUp className="text-slate-400 group-hover:text-green-600" size={20} /><span className="font-medium text-slate-700 group-hover:text-green-700">Input Penjualan Kasir</span></div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-green-600" />
            </Link>
            <Link to="/laporan-kerusakan" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3"><AlertTriangle className="text-slate-400 group-hover:text-orange-600" size={20} /><span className="font-medium text-slate-700 group-hover:text-orange-700">Cek Laporan Kerusakan</span></div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-orange-600" />
            </Link>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck size={120} /></div>
          <h2 className="text-lg font-bold mb-2 relative z-10">Sistem Berjalan Normal</h2>
          <p className="text-slate-300 text-sm mb-6 relative z-10">Semua modul terhubung dengan baik ke Server Cloud Supabase. Data tersimpan secara aman dan terpusat.</p>
          <div className="flex items-center gap-2 text-sm font-medium bg-white/10 w-fit px-4 py-2 rounded-xl relative z-10 backdrop-blur-sm border border-white/10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>Status: Online
          </div>
        </div>
      </div>
    </div>
  );
}