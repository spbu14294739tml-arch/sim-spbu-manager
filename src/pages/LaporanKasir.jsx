// src/pages/LaporanKasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah, exportToCSV } from '../lib/formatHelper';
import { Loader2, Printer, Calendar, FileText, FileSpreadsheet, BarChart3 } from 'lucide-react';
import KopSurat from '../components/KopSurat';

export default function LaporanKasir() {
  const [activeTab, setActiveTab] = useState('harian'); // 'harian' atau 'bulanan'
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  
  // Filter Harian
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('SEMUA');

  // Filter Bulanan
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data Laporan
  const [laporanBBM, setLaporanBBM] = useState([]);
  const [laporanNFR, setLaporanNFR] = useState([]);
  const [totalBBM, setTotalBBM] = useState(0);
  const [totalNFR, setTotalNFR] = useState(0);
  
  // Data Bulanan (Rekap Harian)
  const [rekapHarianBulan, setRekapHarianBulan] = useState([]);

  const fetchShift = async () => {
    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData) setListShift(shiftData.map(s => s.nama_shift));
  };

  const fetchLaporanHarian = async () => {
    setIsLoading(true);
    let queryBBM = supabase.from('penjualan_bbm').select('*').eq('tanggal', selectedDate);
    if (selectedShift !== 'SEMUA') queryBBM = queryBBM.eq('shift', selectedShift);
    const { data: dataBBM } = await queryBBM;

    let queryNFR = supabase.from('penjualan_nfr').select('*').eq('tanggal', selectedDate);
    if (selectedShift !== 'SEMUA') queryNFR = queryNFR.eq('shift', selectedShift);
    const { data: dataNFR } = await queryNFR;

    const rekapBBM = {};
    let sumBBM = 0;
    if (dataBBM) {
      dataBBM.forEach(item => {
        if (!rekapBBM[item.jenis_bbm]) rekapBBM[item.jenis_bbm] = { liter: 0, harga: 0 };
        rekapBBM[item.jenis_bbm].liter += item.jumlah_liter;
        rekapBBM[item.jenis_bbm].harga += item.total_harga;
        sumBBM += item.total_harga;
      });
    }
    
    const rekapNFR = {};
    let sumNFR = 0;
    if (dataNFR) {
      dataNFR.forEach(item => {
        if (!rekapNFR[item.produk_nfr]) rekapNFR[item.produk_nfr] = { jumlah: 0, harga: 0 };
        rekapNFR[item.produk_nfr].jumlah += item.jumlah;
        rekapNFR[item.produk_nfr].harga += item.total_harga;
        sumNFR += item.total_harga;
      });
    }

    setLaporanBBM(Object.keys(rekapBBM).map(key => ({ nama: key, ...rekapBBM[key] })));
    setLaporanNFR(Object.keys(rekapNFR).map(key => ({ nama: key, ...rekapNFR[key] })));
    setTotalBBM(sumBBM);
    setTotalNFR(sumNFR);
    setIsLoading(false);
  };

  const fetchLaporanBulanan = async () => {
    setIsLoading(true);
    // Buat format tanggal awal dan akhir bulan
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

    // Tarik data BBM dan NFR di bulan tersebut
    const { data: dataBBM } = await supabase.from('penjualan_bbm').select('tanggal, total_harga').gte('tanggal', startDate).lte('tanggal', endDate);
    const { data: dataNFR } = await supabase.from('penjualan_nfr').select('tanggal, total_harga').gte('tanggal', startDate).lte('tanggal', endDate);

    // Olah data per hari
    const rekapHarian = {};
    let sumBulanBBM = 0;
    let sumBulanNFR = 0;

    // Inisialisasi semua hari di bulan tersebut dengan 0
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      rekapHarian[dateStr] = { tanggal: dateStr, bbm: 0, nfr: 0, total: 0 };
    }

    if (dataBBM) {
      dataBBM.forEach(item => {
        if (rekapHarian[item.tanggal]) {
          rekapHarian[item.tanggal].bbm += item.total_harga;
          rekapHarian[item.tanggal].total += item.total_harga;
          sumBulanBBM += item.total_harga;
        }
      });
    }

    if (dataNFR) {
      dataNFR.forEach(item => {
        if (rekapHarian[item.tanggal]) {
          rekapHarian[item.tanggal].nfr += item.total_harga;
          rekapHarian[item.tanggal].total += item.total_harga;
          sumBulanNFR += item.total_harga;
        }
      });
    }

    setRekapHarianBulan(Object.values(rekapHarian));
    setTotalBBM(sumBulanBBM);
    setTotalNFR(sumBulanNFR);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchShift();
  }, []);

  useEffect(() => {
    if (activeTab === 'harian') fetchLaporanHarian();
    else fetchLaporanBulanan();
  }, [activeTab, selectedDate, selectedShift, selectedMonth, selectedYear]);

  const totalKeseluruhan = totalBBM + totalNFR;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Laporan Kasir</h1>
          <p className="text-slate-500 mt-1">Rekap penjualan BBM dan NFR.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (activeTab === 'harian') {
                const dataEkspor = [
                  ...laporanBBM.map(b => ({ Kategori: 'BBM', 'Nama Produk': b.nama, 'Total Volume': b.liter, 'Total Pendapatan': b.harga })),
                  ...laporanNFR.map(n => ({ Kategori: 'NFR', 'Nama Produk': n.nama, 'Total Volume': n.jumlah, 'Total Pendapatan': n.harga }))
                ];
                exportToCSV(dataEkspor, `Laporan_Harian_${selectedDate}`);
              } else {
                const dataEkspor = rekapHarianBulan.map(r => ({ Tanggal: r.tanggal, 'Total BBM': r.bbm, 'Total NFR': r.nfr, 'Total Keseluruhan': r.total }));
                exportToCSV(dataEkspor, `Laporan_Bulanan_${selectedMonth}_${selectedYear}`);
              }
            }} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <FileSpreadsheet size={20} /> Ekspor Excel
          </button>
          <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={20} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b mb-6 border-slate-200 no-print">
        <button type="button" onClick={() => setActiveTab('harian')} className={`py-3 px-6 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'harian' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Calendar size={18}/> Laporan Harian</button>
        <button type="button" onClick={() => setActiveTab('bulanan')} className={`py-3 px-6 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'bulanan' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><BarChart3 size={18}/> Laporan Bulanan</button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center no-print">
        {activeTab === 'harian' ? (
          <>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Calendar size={18} className="text-slate-500" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-700" />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <FileText size={18} className="text-slate-500" />
              <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
                <option value="SEMUA">Semua Shift</option>
                {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-slate-600">Pilih Periode:</span>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
              {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </>
        )}
      </div>

      {/* KOP SURAT (Hanya muncul saat dicetak) */}
      <KopSurat 
        judul={activeTab === 'harian' ? "Laporan Rekapitulasi Penjualan Kasir (Harian)" : "Laporan Rekapitulasi Penjualan Kasir (Bulanan)"} 
        periode={activeTab === 'harian' 
          ? `Tanggal: ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - Shift: ${selectedShift}`
          : `Bulan: ${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][selectedMonth-1]} ${selectedYear}`
        } 
      />

      {/* KONTEN LAPORAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
        ) : activeTab === 'harian' ? (
          // TAMPILAN HARIAN (Sama seperti sebelumnya)
          <div className="p-8 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">I. REKAP PENJUALAN BBM (FUEL RETAIL)</h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-sm">
                    <th className="py-3 px-4 font-semibold">Jenis BBM</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Volume (Liter)</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Amount (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {laporanBBM.length > 0 ? laporanBBM.map((bbm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-800">{bbm.nama}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{bbm.liter.toLocaleString('id-ID')} L</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatRupiah(bbm.harga)}</td>
                    </tr>
                  )) : <tr><td colSpan="3" className="py-6 text-center text-slate-500">Tidak ada penjualan BBM.</td></tr>}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="py-4 px-4 font-bold text-blue-800">TOTAL BBM</td>
                    <td className="py-4 px-4 text-right font-bold text-blue-800">{laporanBBM.reduce((acc, curr) => acc + curr.liter, 0).toLocaleString('id-ID')} L</td>
                    <td className="py-4 px-4 text-right font-bold text-blue-800">{formatRupiah(totalBBM)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">II. REKAP PENJUALAN NFR (NON-FUEL RETAIL)</h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-sm">
                    <th className="py-3 px-4 font-semibold">Nama Produk</th>
                    <th className="py-3 px-4 font-semibold text-right">Jumlah (Pcs/Tabung)</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Amount (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {laporanNFR.length > 0 ? laporanNFR.map((nfr, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-800">{nfr.nama}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{nfr.jumlah.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatRupiah(nfr.harga)}</td>
                    </tr>
                  )) : <tr><td colSpan="3" className="py-6 text-center text-slate-500">Tidak ada penjualan NFR.</td></tr>}
                </tbody>
                <tfoot>
                  <tr className="bg-orange-50 border-t-2 border-orange-200">
                    <td className="py-4 px-4 font-bold text-orange-800">TOTAL NFR</td>
                    <td className="py-4 px-4 text-right font-bold text-orange-800">{laporanNFR.reduce((acc, curr) => acc + curr.jumlah, 0).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-4 text-right font-bold text-orange-800">{formatRupiah(totalNFR)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="bg-slate-800 text-white p-6 rounded-xl flex justify-between items-center shadow-lg">
              <div>
                <p className="text-slate-300 font-medium">TOTAL PENDAPATAN KESELURUHAN</p>
                <p className="text-sm text-slate-400 mt-1">(BBM + NFR)</p>
              </div>
              <h3 className="text-3xl font-bold">{formatRupiah(totalKeseluruhan)}</h3>
            </div>
          </div>
        ) : (
          // TAMPILAN BULANAN (Tabel Rekap Harian)
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-slate-200">REKAP PENJUALAN HARIAN (BULAN INI)</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-sm">
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold text-right">Total BBM</th>
                  <th className="py-3 px-4 font-semibold text-right">Total NFR</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rekapHarianBulan.map((hari, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">{new Date(hari.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(hari.bbm)}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(hari.nfr)}</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600">{formatRupiah(hari.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 text-white border-t-2 border-slate-600">
                  <td className="py-4 px-4 font-bold">TOTAL BULAN INI</td>
                  <td className="py-4 px-4 text-right font-bold">{formatRupiah(totalBBM)}</td>
                  <td className="py-4 px-4 text-right font-bold">{formatRupiah(totalNFR)}</td>
                  <td className="py-4 px-4 text-right font-bold text-green-400 text-lg">{formatRupiah(totalKeseluruhan)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}