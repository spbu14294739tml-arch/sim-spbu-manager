// src/pages/Absensi.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, CheckCircle2, XCircle, Clock, CalendarDays, UserX } from 'lucide-react';

export default function Absensi() {
  const [isLoading, setIsLoading] = useState(true);
  const [karyawanList, setKaryawanList] = useState([]);
  const [absensiHariIni, setAbsensiHariIni] = useState([]);
  
  // Mendapatkan tanggal hari ini dalam format YYYY-MM-DD (Waktu Lokal)
  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const hariIni = getTodayDate();

  // 1. Ambil Data Karyawan & Absensi Hari Ini
  const fetchData = async () => {
    setIsLoading(true);
    
    // Ambil Karyawan Aktif
    const { data: dataKaryawan } = await supabase
      .from('karyawan')
      .select('id, nama, posisi, shift, nomor_karyawan')
      .eq('status', 'Aktif')
      .order('nama', { ascending: true });

    // Ambil Absensi Hari Ini
    const { data: dataAbsensi } = await supabase
      .from('absensi')
      .select('*')
      .eq('tanggal', hariIni);

    if (dataKaryawan) setKaryawanList(dataKaryawan);
    if (dataAbsensi) setAbsensiHariIni(dataAbsensi);
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Fungsi Tandai Kehadiran
  const handleTandai = async (karyawanId, shift, statusBaru) => {
    // Cek apakah sudah ada data absensi untuk karyawan ini hari ini
    const existingAbsensi = absensiHariIni.find(a => a.karyawan_id === karyawanId);

    if (existingAbsensi) {
      // Jika sudah ada, UPDATE statusnya
      const { error } = await supabase
        .from('absensi')
        .update({ status_kehadiran: statusBaru })
        .eq('id', existingAbsensi.id);
      
      if (!error) fetchData();
    } else {
      // Jika belum ada, INSERT data baru
      const { error } = await supabase
        .from('absensi')
        .insert([{ 
          tanggal: hariIni, 
          karyawan_id: karyawanId, 
          status_kehadiran: statusBaru,
          shift: shift
        }]);
      
      if (!error) fetchData();
    }
  };

  // Helper untuk mendapatkan status kehadiran karyawan saat ini
  const getStatus = (karyawanId) => {
    const record = absensiHariIni.find(a => a.karyawan_id === karyawanId);
    return record ? record.status_kehadiran : null;
  };

  // Hitung Statistik
  const totalHadir = absensiHariIni.filter(a => a.status_kehadiran === 'Hadir').length;
  const totalIzin = absensiHariIni.filter(a => a.status_kehadiran === 'Izin').length;
  const totalSakit = absensiHariIni.filter(a => a.status_kehadiran === 'Sakit').length;
  const totalAlpa = absensiHariIni.filter(a => a.status_kehadiran === 'Alpa').length;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Absensi Harian</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <CalendarDays size={18} /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Panel Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Hadir</p><p className="text-xl font-bold text-slate-800">{totalHadir}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><Clock size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Izin</p><p className="text-xl font-bold text-slate-800">{totalIzin}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><XCircle size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Sakit</p><p className="text-xl font-bold text-slate-800">{totalSakit}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg"><UserX size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Alpa</p><p className="text-xl font-bold text-slate-800">{totalAlpa}</p></div>
        </div>
      </div>

      {/* Tabel Absensi */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="py-4 px-6 font-semibold">No</th>
              <th className="py-4 px-6 font-semibold">Nama Karyawan</th>
              <th className="py-4 px-6 font-semibold">Posisi & Shift</th>
              <th className="py-4 px-6 font-semibold text-center">Status Kehadiran</th>
              <th className="py-4 px-6 font-semibold text-center">Tindakan Manager</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {karyawanList.map((karyawan, index) => {
              const status = getStatus(karyawan.id);
              
              return (
                <tr key={karyawan.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-slate-500">{index + 1}</td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-800">{karyawan.nama}</div>
                    <div className="text-xs text-slate-500">{karyawan.nomor_karyawan || '-'}</div>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <div className="font-medium text-slate-700">{karyawan.posisi}</div>
                    <div className="text-slate-500">Shift: {karyawan.shift}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {status ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        status === 'Hadir' ? 'bg-green-100 text-green-700 border-green-200' :
                        status === 'Izin' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        status === 'Sakit' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {status}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-sm">Belum diabsen</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleTandai(karyawan.id, karyawan.shift, 'Hadir')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${status === 'Hadir' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}>Hadir</button>
                      <button onClick={() => handleTandai(karyawan.id, karyawan.shift, 'Izin')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${status === 'Izin' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50'}`}>Izin</button>
                      <button onClick={() => handleTandai(karyawan.id, karyawan.shift, 'Sakit')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${status === 'Sakit' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>Sakit</button>
                      <button onClick={() => handleTandai(karyawan.id, karyawan.shift, 'Alpa')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${status === 'Alpa' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}>Alpa</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}