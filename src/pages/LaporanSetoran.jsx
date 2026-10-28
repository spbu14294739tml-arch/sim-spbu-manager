// src/pages/LaporanSetoran.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Printer, Save, Plus, Trash2, ArrowRight, Wallet, Calculator } from 'lucide-react';
import KopSurat from '../components/KopSurat';

const DEFAULT_PENGURANGAN = [
  'Tata Murtaya Bersama (TMB)', 'Alltrue Lite Hotel', 'PT Tri Putra Senamustika (TPS)',
  'DISHUB', 'MPS', 'Imigrasi Batam', 'BNNK', 'G.E.D Mina', 'Putra Tridar Perkasa (PTP)',
  'Balai Karantina Pertanian (BKP)', 'Bank BJB', 'Trans Auto', 'JASA RAHARJA',
  'PT Surya Buana Bintan (SBB)', 'KB Bank/Penggunaan Kartu BBM', 'My Pertamina',
  'Pembelian BBM Transfer ke TML'
];

const PECAHAN_UANG = [100000, 50000, 20000, 10000, 5000, 2000, 1000];

export default function LaporanSetoran() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listShift, setListShift] = useState([]);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    shift: ''
  });

  const [penjualan, setPenjualan] = useState({ bbm: 0, nfr: 0, total: 0 });
  
  const [pengurangan, setPengurangan] = useState([]);
  const [rekapUang, setRekapUang] = useState(
    PECAHAN_UANG.map(p => ({ nominal: p, lembar: 0, total: 0 }))
  );
  const [uangKoin, setUangKoin] = useState(0);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    setIsLoading(true);

    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData && shiftData.length > 0) {
      setListShift(shiftData.map(s => s.nama_shift));
      if (!formData.shift) setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
    }

    let qBBM = supabase.from('penjualan_bbm').select('total_harga').eq('tanggal', formData.tanggal);
    let qNFR = supabase.from('penjualan_nfr').select('total_harga').eq('tanggal', formData.tanggal);
    
    if (formData.shift) {
      qBBM = qBBM.eq('shift', formData.shift);
      qNFR = qNFR.eq('shift', formData.shift);
    }

    const { data: dataBBM } = await qBBM;
    const { data: dataNFR } = await qNFR;

    const sumBBM = dataBBM?.reduce((acc, curr) => acc + curr.total_harga, 0) || 0;
    const sumNFR = dataNFR?.reduce((acc, curr) => acc + curr.total_harga, 0) || 0;
    
    setPenjualan({ bbm: sumBBM, nfr: sumNFR, total: sumBBM + sumNFR });

    const defaultList = DEFAULT_PENGURANGAN.map(nama => ({ nama, nominal: 0 }));
    setPengurangan(defaultList);

    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [formData.tanggal, formData.shift]);

  // ================= HANDLER =================
  const handlePenguranganChange = (index, val) => {
    const newArr = [...pengurangan];
    newArr[index].nominal = parseFloat(val) || 0;
    setPengurangan(newArr);
  };

  const handleAddPengurangan = () => {
    setPengurangan([...pengurangan, { nama: '', nominal: 0 }]);
  };

  const handleRemovePengurangan = (index) => {
    const newArr = pengurangan.filter((_, i) => i !== index);
    setPengurangan(newArr);
  };

  const handleLembarChange = (index, val) => {
    const newArr = [...rekapUang];
    const lembar = parseFloat(val) || 0;
    newArr[index].lembar = lembar;
    newArr[index].total = lembar * newArr[index].nominal;
    setRekapUang(newArr);
  };

  // ================= KALKULASI =================
  const totalPengurangan = pengurangan.reduce((acc, curr) => acc + curr.nominal, 0);
  const totalYangDisetor = penjualan.total - totalPengurangan;
  
  const totalRekapLembar = rekapUang.reduce((acc, curr) => acc + curr.total, 0);
  const totalUangFisik = totalRekapLembar + (parseFloat(uangKoin) || 0);
  
  const plusMinus = totalUangFisik - totalYangDisetor;

  // ================= SIMPAN =================
  const handleSimpan = async () => {
    setIsSaving(true);
    const payload = {
      tanggal: formData.tanggal,
      shift: formData.shift,
      total_bbm: penjualan.bbm,
      total_nfr: penjualan.nfr,
      total_penjualan: penjualan.total,
      data_pengurangan: pengurangan.filter(p => p.nominal > 0),
      total_pengurangan: totalPengurangan,
      total_disetor: totalYangDisetor,
      data_rekap_uang: rekapUang.filter(r => r.lembar > 0),
      total_uang_fisik: totalUangFisik,
      plus_minus: plusMinus
    };

    const { error } = await supabase.from('laporan_setoran_spbu').insert([payload]);
    if (error) alert('Gagal menyimpan: ' + error.message);
    else alert('Laporan Setoran berhasil disimpan!');
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      
      {/* ================= HEADER & KONTROL (NO PRINT) ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Setoran Kasir</h1>
          <p className="text-slate-500 text-sm mt-1">Format Pertanggungjawaban Standar SPBU</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSimpan} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Simpan Laporan
          </button>
          <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Printer size={18} /> Cetak
          </button>
        </div>
      </div>

      {/* ================= FILTER (NO PRINT) ================= */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center no-print">
        <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Tanggal</label>
          <input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Shift</label>
          <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
            {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ================= AREA CETAK & TAMPILAN MODERN ================= */}
      <div className="print-area bg-white md:shadow-sm md:border md:border-slate-200 md:rounded-2xl p-6">
        <div className="hidden print:block mb-6"><KopSurat /></div>
        
        {/* Header Info */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 pb-4 border-b-2 border-slate-800 gap-4">
          <div className="text-sm font-bold bg-slate-100 md:bg-transparent px-4 py-2 md:p-0 rounded-lg w-full md:w-auto text-center md:text-left">
            TANGGAL : {new Date(formData.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
          </div>
          <div className="text-xl font-black text-slate-800 tracking-wide text-center">LAPORAN PENJUALAN</div>
          <div className="text-sm font-bold bg-slate-100 md:bg-transparent px-4 py-2 md:p-0 rounded-lg w-full md:w-auto text-center md:text-right">
            SHIFT : {formData.shift}
          </div>
        </div>

        {/* 1. TABEL PENJUALAN (Modern UI) */}
        <div className="mb-8 overflow-hidden rounded-xl border border-slate-200">
          <div className="bg-blue-50/50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
            <Wallet size={16} className="text-blue-600" />
            <span className="font-bold text-blue-900 text-sm">I. RINGKASAN PENJUALAN</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 text-slate-600 w-12 text-center">1</td>
                <td className="px-4 py-3 font-semibold text-slate-800">TOTAL PENJUALAN BBM</td>
                <td className="px-4 py-3 text-slate-500 w-8 text-center">Rp.</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono tracking-wide">{formatRupiah(penjualan.bbm).replace('Rp', '')}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-600 text-center">2</td>
                <td className="px-4 py-3 font-semibold text-slate-800">PENJUALAN OLI / LPG (NFR)</td>
                <td className="px-4 py-3 text-slate-500 text-center">Rp.</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono tracking-wide">{formatRupiah(penjualan.nfr).replace('Rp', '')}</td>
              </tr>
              <tr className="bg-slate-50">
                <td colSpan={2} className="px-4 py-4 text-right font-black text-slate-800 uppercase tracking-wider">Total Penjualan</td>
                <td className="px-4 py-4 text-slate-500 text-center">Rp.</td>
                <td className="px-4 py-4 text-right font-black text-green-600 font-mono text-base tracking-wide bg-green-50/50">{formatRupiah(penjualan.total).replace('Rp', '')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. TABEL PENGURANGAN */}
        <div className="mb-8 overflow-hidden rounded-xl border border-slate-200">
          <div className="bg-orange-50/50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRight size={16} className="text-orange-600" />
              <span className="font-bold text-orange-900 text-sm">II. PENGURANGAN (SETORAN)</span>
            </div>
            {/* Tombol Tambah Khusus Desktop UI */}
            <button onClick={handleAddPengurangan} className="text-xs font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 px-3 py-1 rounded-lg flex items-center gap-1 transition-colors no-print">
              <Plus size={14}/> Tambah Baris
            </button>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {pengurangan.map((p, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50">
                  <td className="px-4 py-2 text-slate-500 w-12 text-center">{idx + 1}</td>
                  <td className="px-4 py-2 font-medium text-slate-700 relative">
                    {p.nama}
                    {idx >= DEFAULT_PENGURANGAN.length && (
                      <button onClick={() => handleRemovePengurangan(idx)} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 hidden group-hover:block no-print" title="Hapus"><Trash2 size={14}/></button>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-400 w-8 text-center">Rp.</td>
                  <td className="px-4 py-2 w-48 text-right">
                    <input 
                      type="number" 
                      value={p.nominal || ''} 
                      onChange={(e) => handlePenguranganChange(idx, e.target.value)}
                      className="w-full bg-transparent text-right font-mono font-semibold outline-none border-b border-transparent focus:border-blue-400 no-print placeholder-slate-300"
                      placeholder="0"
                    />
                    <span className="hidden print:inline font-mono">{p.nominal > 0 ? formatRupiah(p.nominal).replace('Rp', '') : '-'}</span>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td colSpan={2} className="px-4 py-3 text-right font-bold text-slate-700">TOTAL PENGURANGAN</td>
                <td className="px-4 py-3 text-slate-500 text-center">Rp.</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono">{formatRupiah(totalPengurangan).replace('Rp', '')}</td>
              </tr>
              <tr className="bg-yellow-100">
                <td colSpan={2} className="px-4 py-4 text-right font-black text-yellow-900 text-sm uppercase tracking-wide">Total Yang Disetor</td>
                <td className="px-4 py-4 text-yellow-700 text-center font-bold">Rp.</td>
                <td className="px-4 py-4 text-right font-black text-yellow-900 font-mono text-lg tracking-wide">{formatRupiah(totalYangDisetor).replace('Rp', '')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. TABEL REKAP UANG */}
        <div className="mb-8 overflow-hidden rounded-xl border border-slate-200">
          <div className="bg-emerald-50/50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
            <Calculator size={16} className="text-emerald-600" />
            <span className="font-bold text-emerald-900 text-sm">III. REKAP UANG FISIK</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {rekapUang.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 text-slate-500 w-12 text-center">{idx + 1}</td>
                  <td className="px-4 py-2 text-right font-mono font-medium text-slate-700 w-24">{r.nominal.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 text-slate-400 w-8 text-center">X</td>
                  <td className="px-4 py-2 w-24 text-center">
                    <input 
                      type="number" 
                      value={r.lembar || ''} 
                      onChange={(e) => handleLembarChange(idx, e.target.value)}
                      className="w-full bg-transparent text-center font-bold text-slate-800 outline-none border-b border-transparent focus:border-blue-400 no-print placeholder-slate-300"
                      placeholder="0"
                    />
                    <span className="hidden print:inline font-mono">{r.lembar > 0 ? r.lembar : '-'}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-500 w-16 text-center text-xs">Lembar</td>
                  <td className="px-4 py-2 text-slate-400 w-8 text-center">Rp.</td>
                  <td className="px-4 py-2 text-right font-mono font-medium text-slate-700">{r.total > 0 ? formatRupiah(r.total).replace('Rp', '') : '-'}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="px-4 py-2 text-right font-bold text-slate-700">UANG KOIN</td>
                <td className="px-4 py-2 text-slate-400 text-center">Rp.</td>
                <td className="px-4 py-2 text-right font-mono font-medium text-slate-700">
                  <input 
                    type="number" 
                    value={uangKoin || ''} 
                    onChange={(e) => setUangKoin(e.target.value)}
                    className="w-full bg-transparent text-right font-bold text-slate-800 outline-none border-b border-transparent focus:border-blue-400 no-print placeholder-slate-300"
                    placeholder="0"
                  />
                  <span className="hidden print:inline">{uangKoin > 0 ? formatRupiah(uangKoin).replace('Rp', '') : '-'}</span>
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td colSpan={5} className="px-4 py-3 text-right font-bold text-slate-800">TOTAL REKAP UANG</td>
                <td className="px-4 py-3 text-slate-500 text-center">Rp.</td>
                <td className="px-4 py-3 text-right font-black text-slate-800 font-mono text-base">{formatRupiah(totalUangFisik).replace('Rp', '')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. PLUS / MINUS */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <tbody>
              <tr className={plusMinus < 0 ? 'bg-red-500' : plusMinus > 0 ? 'bg-blue-600' : 'bg-green-600'}>
                <td colSpan={2} className="px-6 py-5 text-right font-black text-white text-lg uppercase tracking-widest w-1/2">PLUS / MINUS</td>
                <td className="px-2 py-5 text-white/80 text-center font-bold w-8">Rp.</td>
                <td className="px-6 py-5 text-right font-black text-white font-mono text-2xl tracking-wider">
                  {formatRupiah(plusMinus).replace('Rp', '')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Keterangan Warna Plus Minus (No Print) */}
        <div className="mt-4 text-xs text-slate-500 text-center no-print">
          {plusMinus === 0 ? '✅ Uang fisik SESUAI dengan sistem (BALANCE).' : plusMinus > 0 ? 'ℹ️ Uang fisik LEBIH dari sistem.' : '⚠️ Uang fisik KURANG dari sistem.'}
        </div>

      </div>

      {/* ================= GAYA KHUSUS UNTUK CETAK (PRINTER) ================= */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 4px 8px !important; color: black !important; }
          .bg-blue-50\\/50, .bg-orange-50\\/50, .bg-emerald-50\\/50, .bg-slate-50 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .bg-yellow-100, .bg-green-600, .bg-red-500, .bg-blue-600 { background-color: #fef08a !important; color: black !important; -webkit-print-color-adjust: exact; }
          .text-green-600, .text-yellow-900, .text-white { color: black !important; }
          input { border: none !important; padding: 0 !important; text-align: right; }
          .rounded-xl, .rounded-2xl { border-radius: 0 !important; }
          h1, p { display: none !important; }
        }
      `}} />
    </div>
  );
}