// src/pages/LaporanVoucherMacet.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Printer, ShieldAlert, AlertTriangle, Search } from 'lucide-react';
import KopSurat from '../components/KopSurat';

export default function LaporanVoucherMacet() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataMacet, setDataMacet] = useState([]);
  const [totalKerugian, setTotalKerugian] = useState(0);
  const [totalLembar, setTotalLembar] = useState(0);
  
  // State Filter Bulan (default: 6 bulan ke belakang)
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
  const [startDate, setStartDate] = useState(sixMonthsAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const fetchDataMacet = async () => {
    setIsLoading(true);

    // Ambil semua voucher yang statusnya PENDING (belum masuk) 
    // Dan tanggal inputnya berada di rentang waktu yang dipilih
    const { data, error } = await supabase
      .from('penjualan_voucher')
      .select('*')
      .eq('status_voucher', 'PENDING')
      .gte('tanggal', startDate)
      .lte('tanggal', endDate)
      .order('tanggal', { ascending: true });

    if (!error && data) {
      let kerugian = 0;
      let lembar = 0;

      // Filter: Hanya tampilkan yang sudah melewati tanggal kedaluwarsa
      const macet = data.filter(v => {
        if (!v.tanggal_kedaluwarsa) return true; // Jika tidak ada tgl expired, anggap macet
        return new Date(v.tanggal_kedaluwarsa) < new Date(); // Sudah lewat hari ini
      });

      macet.forEach(v => {
        // Hitung berapa lembar yang belum masuk
        // Kita ambil dari total_harga dibagi nominal, karena no_voucher formatnya "100 - 200"
        const jmlLembar = Math.round(v.total_harga / v.nominal);
        lembar += jmlLembar;
        kerugian += v.total_harga;
      });

      setDataMacet(macet);
      setTotalKerugian(kerugian);
      setTotalLembar(lembar);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDataMacet();
  }, [startDate, endDate]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Voucher Macet</h1>
          <p className="text-slate-500 text-sm mt-1">Laporan voucher yang belum kembali & sudah kedaluwarsa.</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
          <Printer size={18} /> Cetak Laporan
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-medium text-slate-600">Dari:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
          <span className="text-sm font-medium text-slate-600">Sampai:</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
        </div>
      </div>

      <KopSurat 
        judul="LAPORAN VOUCHER MACET (KEDALUWARSA)" 
        periode={`Periode Input: ${new Date(startDate).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})} s/d ${new Date(endDate).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}`} 
      />

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
      ) : (
        <>
          {/* KARTU RINGKASAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600"><AlertTriangle size={24} /></div>
              <div>
                <p className="text-sm text-red-600 font-bold uppercase">Total Lembar Macet</p>
                <p className="text-2xl font-black text-red-800">{totalLembar} Lembar</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full text-orange-600"><ShieldAlert size={24} /></div>
              <div>
                <p className="text-sm text-orange-600 font-bold uppercase">Estimasi Nilai Kerugian</p>
                <p className="text-2xl font-black text-orange-800">{formatRupiah(totalKerugian)}</p>
              </div>
            </div>
          </div>

          {/* TABEL DATA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left w-12">No</th>
                  <th className="px-4 py-3 text-left">Tgl Input</th>
                  <th className="px-4 py-3 text-left">No Voucher</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-right">Nominal/Lembar</th>
                  <th className="px-4 py-3 text-right">Total Kerugian</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataMacet.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-green-600 font-bold bg-green-50">Aman! Tidak ada voucher macet di periode ini.</td></tr>
                ) : dataMacet.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{new Date(v.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</td>
                    <td className="px-4 py-3 font-bold text-purple-700">{v.no_voucher}</td>
                    <td className="px-4 py-3 text-slate-600">{v.nama_customer}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatRupiah(v.nominal)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-600">{formatRupiah(v.total_harga)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded">HANGUS</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {dataMacet.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={5} className="px-4 py-4 text-right uppercase">Total Kerugian</td>
                    <td className="px-4 py-4 text-right text-red-700 text-base">{formatRupiah(totalKerugian)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-area { display: block !important; }
          th, td { border: 1px solid black !important; padding: 6px 8px !important; color: black !important; }
          .bg-slate-800 { background-color: #1e293b !important; color: white !important; }
        }
      `}} />
    </div>
  );
}