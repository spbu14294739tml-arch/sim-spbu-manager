// src/pages/DashboardManager.jsx
import React from 'react';
import { Users, UserCheck, AlertTriangle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { dataKaryawan } from '../lib/dataKaryawan';
import { Link } from 'react-router-dom';

export default function DashboardManager() {
  // Menghitung statistik sederhana dari data dummy
  const totalKaryawan = dataKaryawan.length;
  const karyawanAktif = dataKaryawan.filter(k => k.status === 'Aktif').length;
  const laporanKerusakan = 3; // Dummy sementara

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Sapaan */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Selamat Malam, Pak Dadang! 👋</h1>
          <p className="text-slate-500 mt-2">Berikut adalah ringkasan operasional SPBU 14.294.739 hari ini.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400">Senin, 19 Oktober 2026</p>
          <p className="text-lg font-bold text-blue-600 flex items-center justify-end gap-2">
            <Clock size={18} /> 22:45 WIB
          </p>
        </div>
      </div>

      {/* Grid Bento Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Kartu 1: Total Karyawan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Karyawan</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalKaryawan} Orang</h3>
          </div>
        </div>

        {/* Kartu 2: Absensi Hari Ini */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Hadir Hari Ini</p>
            <h3 className="text-2xl font-bold text-slate-800">{karyawanAktif} Orang</h3>
          </div>
        </div>

        {/* Kartu 3: Laporan Kerusakan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Laporan Kerusakan</p>
            <h3 className="text-2xl font-bold text-slate-800">{laporanKerusakan} Tiket</h3>
          </div>
        </div>
      </div>

      {/* Area Bawah: Aksi Cepat & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aksi Cepat */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <Link to="/karyawan" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors group">
              <div className="flex items-center gap-3">
                <Users className="text-slate-400 group-hover:text-blue-600" size={20} />
                <span className="font-medium text-slate-700 group-hover:text-blue-700">Kelola Database Karyawan</span>
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600" />
            </Link>
            <Link to="/laporan-kerusakan" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50 rounded-xl transition-colors group">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-slate-400 group-hover:text-orange-600" size={20} />
                <span className="font-medium text-slate-700 group-hover:text-orange-700">Cek Laporan Kerusakan</span>
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-orange-600" />
            </Link>
          </div>
        </div>

        {/* Info Sistem */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={120} />
          </div>
          <h2 className="text-lg font-bold mb-2 relative z-10">Sistem Berjalan Normal</h2>
          <p className="text-blue-100 text-sm mb-6 relative z-10">
            Semua modul (Absensi, Laporan, Database) terhubung dengan baik. Data disimpan secara lokal dan siap di-backup.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium bg-blue-500/30 w-fit px-3 py-1.5 rounded-lg relative z-10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Status: Online
          </div>
        </div>
      </div>
    </div>
  );
}