// src/pages/LaporanKasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah, exportToCSV } from '../lib/formatHelper';
import { Loader2, Printer, Calendar, FileText, FileSpreadsheet } from 'lucide-react';
import KopSurat from '../components/KopSurat';

export default function LaporanKasir() {
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('SEMUA');

  const [laporanBBM, setLaporanBBM] = useState([]);
  const [laporanNFR, setLaporanNFR] = useState([]);
  const [totalBBM, setTotalBBM] = useState(0);
  const [totalNFR, setTotalNFR] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);

    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData) setListShift(shiftData.map(s => s.nama_shift));

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

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedShift]);

  const totalKeseluruhan = totalBBM + totalNFR;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Laporan Kasir</h1>
          <p className="text-slate-500 mt-1">Rekap penjualan BBM dan NFR per hari/shift.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const dataEkspor = [
                ...laporanBBM.map(b => ({ Kategori: 'BBM', 'Nama Produk': b.nama, 'Total Volume': b.liter, 'Total Pendapatan': b.harga })),
                ...laporanNFR.map(n => ({ Kategori: 'NFR', 'Nama Produk': n.nama, 'Total Volume': n.jumlah, 'Total Pendapatan': n.harga }))
              ];
              exportToCSV(dataEkspor, `Laporan_Kasir_${selectedDate}_${selectedShift}`);
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

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center no-print">
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
      </div>

      <KopSurat judul="Laporan Rekapitulasi Penjualan Kasir" periode={`Tanggal: ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - Shift: ${selectedShift}`} />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
        ) : (
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

            <div className="hidden print:grid grid-cols-2 gap-8 mt-16 text-center">
              <div>
                <p className="text-slate-600 mb-20">Dibuat oleh,</p>
                <p className="font-bold text-slate-800 border-t border-slate-400 pt-2 mx-8">Accounting / Kasir</p>
              </div>
              <div>
                <p className="text-slate-600 mb-20">Diperiksa oleh,</p>
                <p className="font-bold text-slate-800 border-t border-slate-400 pt-2 mx-8">Manager Operasional</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}