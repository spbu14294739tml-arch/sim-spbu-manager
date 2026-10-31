// src/pages/DashboardKasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Link } from 'react-router-dom';
import { 
  Fuel, 
  Droplet, 
  ShoppingBag, 
  FileText, 
  Clock, 
  ArrowRight,
  TrendingUp,
  History
} from 'lucide-react';

export default function DashboardKasir() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataHariIni, setDataHariIni] = useState({ bbm: 0, nfr: 0, total: 0 });
  const [dataKemarin, setDataKemarin] = useState({ bbm: 0, nfr: 0, total: 0 });
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateTodayStr = today.toISOString().split('T')[0];
  const dateYesterdayStr = yesterday.toISOString().split('T')[0];

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);

      // 1. Ambil data Hari Ini
      const { data: jurnalHariIni } = await supabase
        .from('jurnal_kasir')
        .select('*')
        .eq('tanggal', dateTodayStr);

      // 2. Ambil data Kemarin
      const { data: jurnalKemarin } = await supabase
        .from('jurnal_kasir')
        .select('*')
        .eq('tanggal', dateYesterdayStr);

      // Hitung Ringkasan Hari Ini
      if (jurnalHariIni) {
        const bbm = jurnalHariIni.filter(j => j.uraian_kegiatan.includes('PENJUALAN BBM')).reduce((a, b) => a + b.debet, 0);
        const nfr = jurnalHariIni.filter(j => j.uraian_kegiatan.includes('LPG') || j.uraian_kegiatan.includes('OLI')).reduce((a, b) => a + b.debet, 0);
        setDataHariIni({ bbm, nfr, total: bbm + nfr });
      }

      // Hitung Ringkasan Kemarin
      if (jurnalKemarin) {
        const bbm = jurnalKemarin.filter(j => j.uraian_kegiatan.includes('PENJUALAN BBM')).reduce((a, b) => a + b.debet, 0);
        const nfr = jurnalKemarin.filter(j => j.uraian_kegiatan.includes('LPG') || j.uraian_kegiatan.includes('OLI')).reduce((a, b) => a + b.debet, 0);
        setDataKemarin({ bbm, nfr, total: bbm + nfr });
      }

      setIsLoading(false);
    };
    fetchDashboard();
  }, [dateTodayStr, dateYesterdayStr]);

  const formatTanggal = (date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Selamat Bekerja, Kasir! 👋</h1>
          <p className="text-blue-100 text-sm md:text-base">Berikut adalah ringkasan aktivitas SPBU hari ini ({formatTanggal(today)}).</p>
        </div>
      </div>

      {/* RINGKASAN HARI INI */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" /> Ringkasan Hari Ini
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-blue-100 p-4 rounded-full text-blue-600"><Fuel size={28} /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Penjualan BBM</p>
              <p className="text-2xl font-black text-slate-800">{formatRupiah(dataHariIni.bbm)}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-orange-100 p-4 rounded-full text-orange-600"><Droplet size={28} /></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Penjualan NFR</p>
              <p className="text-2xl font-black text-slate-800">{formatRupiah(dataHariIni.nfr)}</p>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
            <div className="bg-slate-700 p-4 rounded-full text-green-400"><FileText size={28} /></div>
            <div>
              <p className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-1">Total Pendapatan</p>
              <p className="text-2xl font-black text-green-400">{formatRupiah(dataHariIni.total)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSAKSI KEMARIN (H+1) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <History size={20} className="text-purple-600" /> Rekap Transaksi Kemarin (H+1)
            </h2>
            <p className="text-sm text-slate-500 mt-1">{formatTanggal(yesterday)}</p>
          </div>
          <Link to={`/laporan-rekap`} className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-100 transition-colors">
            Lihat Detail <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Fuel size={20} /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">BBM Kemarin</p>
              <p className="font-bold text-slate-800">{formatRupiah(dataKemarin.bbm)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><ShoppingBag size={20} /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">NFR Kemarin</p>
              <p className="font-bold text-slate-800">{formatRupiah(dataKemarin.nfr)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={20} /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Kemarin</p>
              <p className="font-bold text-slate-800">{formatRupiah(dataKemarin.total)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AKSI CEPAT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/jurnal-transaksi" className="bg-blue-600 hover:bg-blue-700 transition-colors p-6 rounded-2xl text-white flex items-center justify-between shadow-md group">
          <div>
            <h3 className="font-bold text-lg mb-1">Mulai Input Transaksi</h3>
            <p className="text-blue-100 text-sm">Catat penjualan BBM, LPG, dan Oli hari ini.</p>
          </div>
          <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
        </Link>
        
        <Link to="/voucher-bbm" className="bg-purple-600 hover:bg-purple-700 transition-colors p-6 rounded-2xl text-white flex items-center justify-between shadow-md group">
          <div>
            <h3 className="font-bold text-lg mb-1">Scan / Input Voucher</h3>
            <p className="text-purple-100 text-sm">Proses voucher fisik dari customer.</p>
          </div>
          <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>

    </div>
  );
}