// src/pages/LaporanRekapHarian.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Printer, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import KopSurat from '../components/KopSurat';

export default function LaporanRekapHarian() {
  const [activeTab, setActiveTab] = useState('harian'); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // State Harian (Dinamis per Produk)
  const [dataHarian, setDataHarian] = useState({ 
    shift1: { items: [], total: 0 }, 
    shift2: { items: [], total: 0 }, 
    total: { items: [], total: 0 } 
  });
  
  // State Bulanan
  const [dataBulanan, setDataBulanan] = useState([]);
  const [totalBulanan, setTotalBulanan] = useState({});

  const fetchLaporanHarian = async () => {
    setIsLoading(true);

    const { data: jurnal } = await supabase
      .from('jurnal_kasir')
      .select('*')
      .eq('tanggal', selectedDate);

    let rekapPerProduk = {}; // Menyimpan data dinamis { NamaProduk: { shift1: 0, shift2: 0, total: 0 } }

    if (jurnal) {
      jurnal.forEach(item => {
        const isShift1 = item.shift.toLowerCase().includes('1') || item.shift.toLowerCase().includes('pagi');
        const target = isShift1 ? 'shift1' : 'shift2';
        
        // Tentukan Nama Baris (Kategori Produk)
        let namaBaris = item.uraian_kegiatan;
        
        // Bersihkan nama baris agar rapi (opsional)
        if (namaBaris.includes('PENJUALAN BBM')) {
          // Tetap gunakan nama dari jurnal (misal: PENJUALAN BBM PERTALITE)
        } else if (item.dari_ke.includes('VOUCHER')) {
          namaBaris = 'PENERIMAAN VOUCHER';
        } else if (namaBaris.includes('PENJUALAN LPG') || namaBaris.includes('PENJUALAN OLI')) {
          // Tetap gunakan nama produk
        } else {
          // Transaksi Lainnya
          namaBaris = `${item.uraian_kegiatan} (${item.dari_ke})`;
        }

        if (!rekapPerProduk[namaBaris]) {
          rekapPerProduk[namaBaris] = { shift1: 0, shift2: 0, total: 0, type: 'DEBET' };
        }

        // Hitung
        if (item.debet > 0) {
          rekapPerProduk[namaBaris][target] += item.debet;
          rekapPerProduk[namaBaris].total += item.debet;
        }
        if (item.kredit > 0) {
          rekapPerProduk[namaBaris][target] -= item.kredit;
          rekapPerProduk[namaBaris].total -= item.kredit;
          rekapPerProduk[namaBaris].type = 'KREDIT';
        }
      });
    }

    const itemsArray = Object.keys(rekapPerProduk).map(key => ({
      nama: key,
      shift1: rekapPerProduk[key].shift1,
      shift2: rekapPerProduk[key].shift2,
      total: rekapPerProduk[key].total,
      type: rekapPerProduk[key].type
    })).sort((a, b) => a.nama.localeCompare(b.nama));

    // Hitung Grand Total
    const totalShift1 = itemsArray.reduce((acc, curr) => acc + curr.shift1, 0);
    const totalShift2 = itemsArray.reduce((acc, curr) => acc + curr.shift2, 0);
    const grandTotal = itemsArray.reduce((acc, curr) => acc + curr.total, 0);

    setDataHarian({ 
      shift1: { items: itemsArray, total: totalShift1 }, 
      shift2: { items: itemsArray, total: totalShift2 }, 
      total: { items: itemsArray, total: grandTotal } 
    });

    setIsLoading(false);
  };

  const fetchLaporanBulanan = async () => {
    setIsLoading(true);
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

    const { data: jurnal } = await supabase
      .from('jurnal_kasir')
      .select('*')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate);

    // 1. Rekap Harian untuk Tabel Bawah
    const rekapHarian = {};
    let total = { bbm: 0, nfr: 0, voucher: 0, lain: 0, grandTotal: 0 };

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      rekapHarian[dateStr] = { tanggal: dateStr, bbm: 0, nfr: 0, voucher: 0, lain: 0, grandTotal: 0 };
    }

    if (jurnal) {
      jurnal.forEach(item => {
        if (!rekapHarian[item.tanggal]) return;
        const r = rekapHarian[item.tanggal];
        const netValue = (item.debet || 0) - (item.kredit || 0);

        if (item.uraian_kegiatan.includes('PENJUALAN BBM')) {
          r.bbm += netValue; total.bbm += netValue;
        } else if (item.uraian_kegiatan.includes('OLI') || item.uraian_kegiatan.includes('LPG')) {
          r.nfr += netValue; total.nfr += netValue;
        } else if (item.dari_ke.includes('VOUCHER')) {
          r.voucher += netValue; total.voucher += netValue;
        } else {
          r.lain += netValue; total.lain += netValue;
        }
        r.grandTotal += netValue; total.grandTotal += netValue;
      });
    }

    setDataBulanan(Object.values(rekapHarian));
    setTotalBulanan(total);
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'harian') fetchLaporanHarian();
    else fetchLaporanBulanan();
  }, [activeTab, selectedDate, selectedMonth, selectedYear]);

  const formatTanggalIndo = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Rekapitulasi</h1>
          <p className="text-slate-500 mt-1">Laporan gabungan Shift 1 & Shift 2 secara detail per produk.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={20} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-2 mb-6 p-2 bg-slate-100 rounded-2xl w-fit no-print">
        <button type="button" onClick={() => setActiveTab('harian')} className={`py-2 px-5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'harian' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><Calendar size={16}/> Laporan Harian</button>
        <button type="button" onClick={() => setActiveTab('bulanan')} className={`py-2 px-5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'bulanan' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><BarChart3 size={16}/> Laporan Bulanan</button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center no-print">
        {activeTab === 'harian' ? (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Calendar size={18} className="text-slate-500" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-700" />
          </div>
        ) : (
          <>
            <span className="text-sm font-medium text-slate-600">Pilih Periode:</span>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
              {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </>
        )}
      </div>

      <KopSurat 
        judul={activeTab === 'harian' ? "Laporan Rekapitulasi Harian Kasir" : "Laporan Rekapitulasi Bulanan Kasir"} 
        periode={activeTab === 'harian' 
          ? `Tanggal: ${formatTanggalIndo(selectedDate)}`
          : `Bulan: ${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][selectedMonth-1]} ${selectedYear}`
        } 
      />

      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
      ) : activeTab === 'harian' ? (
        // TAMPILAN HARIAN DETAIL
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white border-b border-slate-200">
                <th className="py-3 px-4 text-left w-12">No</th>
                <th className="py-3 px-4 text-left">Keterangan Transaksi (Produk)</th>
                <th className="py-3 px-4 text-right bg-slate-700">Shift 1</th>
                <th className="py-3 px-4 text-right bg-slate-700">Shift 2</th>
                <th className="py-3 px-4 text-right bg-slate-900">TOTAL HARIAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataHarian.total.items.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500 italic">Belum ada transaksi pada tanggal ini.</td></tr>
              ) : dataHarian.total.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                  <td className={`py-3 px-4 font-semibold ${item.type === 'KREDIT' ? 'text-red-600' : 'text-slate-800'}`}>{item.nama}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(item.shift1)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(item.shift2)}</td>
                  <td className={`py-3 px-4 text-right font-mono font-bold ${item.type === 'KREDIT' ? 'text-red-700' : 'text-blue-700'}`}>{formatRupiah(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 text-slate-800 border-t-2 border-slate-300">
                <td colSpan={2} className="py-4 px-4 text-right font-black text-lg uppercase tracking-wide">Total Pendapatan Bersih</td>
                <td className="py-4 px-4 text-right font-mono font-bold text-green-700 text-base">{formatRupiah(dataHarian.shift1.total)}</td>
                <td className="py-4 px-4 text-right font-mono font-bold text-green-700 text-base">{formatRupiah(dataHarian.shift2.total)}</td>
                <td className="py-4 px-4 text-right font-mono font-black text-green-700 text-xl bg-green-50">{formatRupiah(dataHarian.total.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        // TAMPILAN BULANAN
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-left">Tanggal</th>
                  <th className="py-3 px-3 text-right">Penjualan BBM</th>
                  <th className="py-3 px-3 text-right">Penjualan NFR</th>
                  <th className="py-3 px-3 text-right">Penerimaan Voucher</th>
                  <th className="py-3 px-3 text-right">Lain-lain</th>
                  <th className="py-3 px-3 text-right bg-slate-200">Total Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataBulanan.map((hari) => (
                  <tr key={hari.tanggal} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-800">{new Date(hari.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatRupiah(hari.bbm)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatRupiah(hari.nfr)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatRupiah(hari.voucher)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatRupiah(hari.lain)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 bg-slate-50">{formatRupiah(hari.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 text-white sticky bottom-0">
                  <td className="py-3 px-3 font-bold">TOTAL BULAN INI</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">{formatRupiah(totalBulanan.bbm)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">{formatRupiah(totalBulanan.nfr)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">{formatRupiah(totalBulanan.voucher)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">{formatRupiah(totalBulanan.lain)}</td>
                  <td className="py-3 px-3 text-right font-mono font-black text-green-400 text-sm bg-slate-900">{formatRupiah(totalBulanan.grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-area { display: block !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 6px 8px !important; color: black !important; }
          .bg-slate-100 { background-color: #f3f4f6 !important; }
          .bg-slate-200 { background-color: #e5e7eb !important; }
          .bg-slate-800, .bg-slate-700, .bg-slate-900 { background-color: #1e293b !important; color: white !important; -webkit-print-color-adjust: exact !important; }
          .text-green-700, .text-green-400, .text-blue-700, .text-red-700 { color: black !important; }
        }
      `}} />
    </div>
  );
}