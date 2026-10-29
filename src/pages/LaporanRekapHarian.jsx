// src/pages/LaporanRekapHarian.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Printer, Calendar, FileSpreadsheet, BarChart3, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import KopSurat from '../components/KopSurat';

export default function LaporanRekapHarian() {
  const [activeTab, setActiveTab] = useState('harian'); // 'harian', 'bulanan'
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // State untuk Harian
  const [dataHarian, setDataHarian] = useState({ shift1: {}, shift2: {}, total: {} });
  // State untuk Bulanan
  const [dataBulanan, setDataBulanan] = useState([]);
  const [totalBulanan, setTotalBulanan] = useState({});

  const fetchShift = async () => {
    const { data } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (data) setListShift(data.map(s => s.nama_shift));
  };

  const fetchLaporanHarian = async () => {
    setIsLoading(true);

    // Ambil Semua Jurnal di Tanggal Tersebut
    const { data: jurnal } = await supabase
      .from('jurnal_kasir')
      .select('*')
      .eq('tanggal', selectedDate);

    // Siapkan Struktur Penampung
    let rekap = {
      shift1: { bbm: 0, oli: 0, lpg: 0, voucher: 0, pendapatanLain: 0, pengeluaran: 0 },
      shift2: { bbm: 0, oli: 0, lpg: 0, voucher: 0, pendapatanLain: 0, pengeluaran: 0 },
      total: { bbm: 0, oli: 0, lpg: 0, voucher: 0, pendapatanLain: 0, pengeluaran: 0 }
    };

    if (jurnal) {
      jurnal.forEach(item => {
        // Tentukan ini Shift 1 atau Shift 2 (Bisa disesuaikan dengan string shift Bapak)
        const isShift1 = item.shift.toLowerCase().includes('1') || item.shift.toLowerCase().includes('pagi');
        const target = isShift1 ? 'shift1' : 'shift2';
        const targetTotal = 'total';

        // Kategorisasi
        if (item.uraian_kegiatan.includes('PENJUALAN BBM')) {
          rekap[target].bbm += item.debet;
          rekap[targetTotal].bbm += item.debet;
        } else if (item.uraian_kegiatan.includes('OLI')) {
          rekap[target].oli += item.debet;
          rekap[targetTotal].oli += item.debet;
        } else if (item.uraian_kegiatan.includes('LPG')) {
          rekap[target].lpg += item.debet;
          rekap[targetTotal].lpg += item.debet;
        } else if (item.dari_ke.includes('VOUCHER')) {
          rekap[target].voucher += item.debet;
          rekap[targetTotal].voucher += item.debet;
        } else {
          // Transaksi Lainnya (Debet masuk / Kredit keluar)
          rekap[target].pendapatanLain += item.debet;
          rekap[targetTotal].pendapatanLain += item.debet;
          rekap[target].pengeluaran += item.kredit;
          rekap[targetTotal].pengeluaran += item.kredit;
        }
      });
    }

    setDataHarian(rekap);
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

    const rekapHarian = {};
    let total = { bbm: 0, nfr: 0, voucher: 0, pendapatanLain: 0, pengeluaran: 0, grandTotal: 0 };

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      rekapHarian[dateStr] = { tanggal: dateStr, bbm: 0, nfr: 0, voucher: 0, pendapatanLain: 0, pengeluaran: 0 };
    }

    if (jurnal) {
      jurnal.forEach(item => {
        if (!rekapHarian[item.tanggal]) return;
        const r = rekapHarian[item.tanggal];

        if (item.uraian_kegiatan.includes('PENJUALAN BBM')) {
          r.bbm += item.debet; total.bbm += item.debet;
        } else if (item.uraian_kegiatan.includes('OLI') || item.uraian_kegiatan.includes('LPG')) {
          r.nfr += item.debet; total.nfr += item.debet;
        } else if (item.dari_ke.includes('VOUCHER')) {
          r.voucher += item.debet; total.voucher += item.debet;
        } else {
          r.pendapatanLain += item.debet; total.pendapatanLain += item.debet;
          r.pengeluaran += item.kredit; total.pengeluaran += item.kredit;
        }
      });
    }

    const dataArray = Object.values(rekapHarian).map(r => ({
      ...r,
      grandTotal: r.bbm + r.nfr + r.voucher + r.pendapatanLain - r.pengeluaran
    }));

    total.grandTotal = total.bbm + total.nfr + total.voucher + total.pendapatanLain - total.pengeluaran;

    setDataBulanan(dataArray);
    setTotalBulanan(total);
    setIsLoading(false);
  };

  useEffect(() => { fetchShift(); }, []);
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
          <p className="text-slate-500 mt-1">Laporan gabungan Shift 1 & Shift 2 (Harian & Bulanan).</p>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
          
          <div className="p-4 bg-slate-800 text-white text-center hidden print:block">
            <h2 className="text-lg font-bold">REKAPITULASI HARIAN (GABUNGAN SHIFT)</h2>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-4 text-left w-12">No</th>
                <th className="py-3 px-4 text-left">Keterangan Transaksi</th>
                <th className="py-3 px-4 text-right bg-blue-50">Shift 1</th>
                <th className="py-3 px-4 text-right bg-purple-50">Shift 2</th>
                <th className="py-3 px-4 text-right bg-slate-200">TOTAL HARIAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4">1</td>
                <td className="py-3 px-4 font-semibold">Penjualan BBM</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift1.bbm)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift2.bbm)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatRupiah(dataHarian.total.bbm)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4">2</td>
                <td className="py-3 px-4 font-semibold">Penjualan Oli / Pelumas</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift1.oli)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift2.oli)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatRupiah(dataHarian.total.oli)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4">3</td>
                <td className="py-3 px-4 font-semibold">Penjualan LPG</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift1.lpg)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift2.lpg)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatRupiah(dataHarian.total.lpg)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4">4</td>
                <td className="py-3 px-4 font-semibold">Penerimaan Voucher</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift1.voucher)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift2.voucher)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatRupiah(dataHarian.total.voucher)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4">5</td>
                <td className="py-3 px-4 font-semibold">Pendapatan Lain-lain</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift1.pendapatanLain)}</td>
                <td className="py-3 px-4 text-right font-mono">{formatRupiah(dataHarian.shift2.pendapatanLain)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatRupiah(dataHarian.total.pendapatanLain)}</td>
              </tr>
              <tr className="hover:bg-red-50/50">
                <td className="py-3 px-4">6</td>
                <td className="py-3 px-4 font-semibold text-red-600">Pengeluaran / Setoran</td>
                <td className="py-3 px-4 text-right font-mono text-red-600">({formatRupiah(dataHarian.shift1.pengeluaran)})</td>
                <td className="py-3 px-4 text-right font-mono text-red-600">({formatRupiah(dataHarian.shift2.pengeluaran)})</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-red-600">({formatRupiah(dataHarian.total.pengeluaran)})</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white">
                <td colSpan={2} className="py-4 px-4 text-right font-bold text-lg uppercase tracking-wide">Total Pendapatan Bersih</td>
                <td className="py-4 px-4 text-right font-mono font-bold text-green-400 text-base">
                  {formatRupiah(dataHarian.shift1.bbm + dataHarian.shift1.oli + dataHarian.shift1.lpg + dataHarian.shift1.voucher + dataHarian.shift1.pendapatanLain - dataHarian.shift1.pengeluaran)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-green-400 text-base">
                  {formatRupiah(dataHarian.shift2.bbm + dataHarian.shift2.oli + dataHarian.shift2.lpg + dataHarian.shift2.voucher + dataHarian.shift2.pendapatanLain - dataHarian.shift2.pengeluaran)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-black text-green-400 text-xl bg-slate-900">
                  {formatRupiah(
                    dataHarian.total.bbm + dataHarian.total.oli + dataHarian.total.lpg + 
                    dataHarian.total.voucher + dataHarian.total.pendapatanLain - dataHarian.total.pengeluaran
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        // TAMPILAN BULANAN
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
          <div className="p-4 bg-slate-800 text-white text-center hidden print:block">
            <h2 className="text-lg font-bold">REKAPITULASI BULANAN</h2>
          </div>
          
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-left">Tanggal</th>
                  <th className="py-3 px-3 text-right">Penjualan BBM</th>
                  <th className="py-3 px-3 text-right">Penjualan NFR</th>
                  <th className="py-3 px-3 text-right">Penerimaan Voucher</th>
                  <th className="py-3 px-3 text-right">Lain-lain</th>
                  <th className="py-3 px-3 text-right text-red-600">Pengeluaran</th>
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
                    <td className="py-2 px-3 text-right font-mono">{formatRupiah(hari.pendapatanLain)}</td>
                    <td className="py-2 px-3 text-right font-mono text-red-600">({formatRupiah(hari.pengeluaran)})</td>
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
                  <td className="py-3 px-3 text-right font-mono font-bold">{formatRupiah(totalBulanan.pendapatanLain)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-red-400">({formatRupiah(totalBulanan.pengeluaran)})</td>
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
          .bg-slate-800 { background-color: #1e293b !important; color: white !important; -webkit-print-color-adjust: exact !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-purple-50 { background-color: #faf5ff !important; }
          .text-blue-700, .text-red-600, .text-green-400 { color: black !important; }
        }
      `}} />
    </div>
  );
}