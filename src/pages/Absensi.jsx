// src/pages/Absensi.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, CheckCircle2, XCircle, Clock, CalendarDays, UserX, BarChart3 } from 'lucide-react';

export default function Absensi() {
  // State untuk Tab
  const [activeTab, setActiveTab] = useState('harian'); // 'harian' atau 'rekap'
  
  const [isLoading, setIsLoading] = useState(true);
  const [karyawanList, setKaryawanList] = useState([]);
  
  // State untuk Harian
  const [absensiHariIni, setAbsensiHariIni] = useState([]);
  
  // State untuk Rekap Bulanan
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [rekapData, setRekapData] = useState([]);
  const [isRekapLoading, setIsRekapLoading] = useState(false);

  // Mendapatkan tanggal hari ini
  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };
  const hariIni = getTodayDate();

  // 1. Ambil Data Karyawan (Untuk kedua tab)
  useEffect(() => {
    const fetchKaryawan = async () => {
      const { data } = await supabase
        .from('karyawan')
        .select('id, nama, posisi, shift, nomor_karyawan')
        .eq('status', 'Aktif')
        .order('nama', { ascending: true });
      if (data) setKaryawanList(data);
    };
    fetchKaryawan();
  }, []);

  // 2. Ambil Data Absensi Harian
  const fetchAbsensiHarian = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('absensi').select('*').eq('tanggal', hariIni);
    if (data) setAbsensiHariIni(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'harian') fetchAbsensiHarian();
  }, [activeTab]);

  // 3. Ambil Data Rekap Bulanan
  useEffect(() => {
    const fetchRekap = async () => {
      if (activeTab !== 'rekap') return;
      setIsRekapLoading(true);
      
      // Buat format tanggal awal dan akhir bulan (YYYY-MM-DD)
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]; // Hari terakhir bulan

      // Tarik semua absensi di bulan tersebut
      const { data, error } = await supabase
        .from('absensi')
        .select('karyawan_id, status_kehadiran')
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (!error && data) {
        // Olah data menjadi bentuk rekap
        const rekap = {};
        data.forEach(item => {
          if (!rekap[item.karyawan_id]) {
            rekap[item.karyawan_id] = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
          }
          rekap[item.karyawan_id][item.status_kehadiran] += 1;
        });
        setRekapData(rekap);
      }
      setIsRekapLoading(false);
    };

    fetchRekap();
  }, [activeTab, selectedMonth, selectedYear]);

  // Fungsi Tandai Kehadiran (Harian)
  const handleTandai = async (karyawanId, shift, statusBaru) => {
    const existingAbsensi = absensiHariIni.find(a => a.karyawan_id === karyawanId);

    if (existingAbsensi) {
      await supabase.from('absensi').update({ status_kehadiran: statusBaru }).eq('id', existingAbsensi.id);
    } else {
      await supabase.from('absensi').insert([{ 
        tanggal: hariIni, 
        karyawan_id: karyawanId, 
        status_kehadiran: statusBaru,
        shift: shift
      }]);
    }
    fetchAbsensiHarian();
  };

  const getStatus = (karyawanId) => {
    const record = absensiHariIni.find(a => a.karyawan_id === karyawanId);
    return record ? record.status_kehadiran : null;
  };

  // Statistik Harian
  const totalHadir = absensiHariIni.filter(a => a.status_kehadiran === 'Hadir').length;
  const totalIzin = absensiHariIni.filter(a => a.status_kehadiran === 'Izin').length;
  const totalSakit = absensiHariIni.filter(a => a.status_kehadiran === 'Sakit').length;
  const totalAlpa = absensiHariIni.filter(a => a.status_kehadiran === 'Alpa').length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header & Tab Navigation */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Manajemen Absensi</h1>
        <p className="text-slate-500 mt-1">Kelola kehadiran harian dan rekap bulanan karyawan.</p>
        
        <div className="flex gap-4 mt-6 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('harian')}
            className={`pb-3 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'harian' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <CalendarDays size={18} /> Absensi Harian
          </button>
          <button 
            onClick={() => setActiveTab('rekap')}
            className={`pb-3 px-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'rekap' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <BarChart3 size={18} /> Rekap Bulanan
          </button>
        </div>
      </div>

      {/* KONTEN TAB HARIAN */}
      {activeTab === 'harian' && (
        <div className="animate-in fade-in duration-300">
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

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                    <th className="py-4 px-6 font-semibold">No</th>
                    <th className="py-4 px-6 font-semibold">Nama Karyawan</th>
                    <th className="py-4 px-6 font-semibold">Posisi & Shift</th>
                    <th className="py-4 px-6 font-semibold text-center">Status</th>
                    <th className="py-4 px-6 font-semibold text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {karyawanList.map((karyawan, index) => {
                    const status = getStatus(karyawan.id);
                    return (
                      <tr key={karyawan.id} className="hover:bg-slate-50/50">
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
                            }`}>{status}</span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Belum diabsen</span>
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
            )}
          </div>
        </div>
      )}

      {/* KONTEN TAB REKAP BULANAN */}
      {activeTab === 'rekap' && (
        <div className="animate-in fade-in duration-300">
          {/* Filter Bulan & Tahun */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-slate-600">Pilih Periode:</span>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {isRekapLoading ? (
              <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                    <th className="py-4 px-6 font-semibold">No</th>
                    <th className="py-4 px-6 font-semibold">Nama Karyawan</th>
                    <th className="py-4 px-6 font-semibold text-center">Hadir</th>
                    <th className="py-4 px-6 font-semibold text-center">Izin</th>
                    <th className="py-4 px-6 font-semibold text-center">Sakit</th>
                    <th className="py-4 px-6 font-semibold text-center">Alpa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {karyawanList.map((karyawan, index) => {
                    const rekap = rekapData[karyawan.id] || { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
                    return (
                      <tr key={karyawan.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-500">{index + 1}</td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-800">{karyawan.nama}</div>
                          <div className="text-xs text-slate-500">{karyawan.posisi}</div>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-green-600">{rekap.Hadir}</td>
                        <td className="py-4 px-6 text-center font-bold text-yellow-600">{rekap.Izin}</td>
                        <td className="py-4 px-6 text-center font-bold text-blue-600">{rekap.Sakit}</td>
                        <td className="py-4 px-6 text-center font-bold text-red-600">{rekap.Alpa}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}