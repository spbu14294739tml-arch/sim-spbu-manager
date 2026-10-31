// src/pages/HalamanSetoran.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Printer, Save, Calendar, FileCheck } from 'lucide-react';
import KopSurat from '../components/KopSurat';

export default function HalamanSetoran() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [listShift, setListShift] = useState([]);
  const [selectedShift, setSelectedShift] = useState('');
  const [dataSetoran, setDataSetoran] = useState([]);
  const [catatanKasir, setCatatanKasir] = useState('');
  
  // State untuk merekap total
  const [totalSetoran, setTotalSetoran] = useState(0);
  const [totalJurnal, setTotalJurnal] = useState(0);

  const fetchSetoran = async () => {
    setIsLoading(true);

    // 1. Ambil list shift
    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData && shiftData.length > 0) {
      setListShift(shiftData.map(s => s.nama_shift));
      if (!selectedShift) setSelectedShift(shiftData[0].nama_shift);
    }

    // 2. Ambil data jurnal kasir (uang yang seharusnya disetor)
    let queryJurnal = supabase.from('jurnal_kasir').select('*').eq('tanggal', selectedDate);
    if (selectedShift) queryJurnal = queryJurnal.eq('shift', selectedShift);
    const { data: jurnalData } = await queryJurnal;

    if (jurnalData) {
      // Hitung total uang masuk - uang keluar dari jurnal
      const total = jurnalData.reduce((acc, curr) => acc + (curr.debet || 0) - (curr.kredit || 0), 0);
      setTotalJurnal(total);
    }

    // 3. Ambil data setoran yang sudah pernah disimpan hari itu
    let querySetoran = supabase.from('setoran_kasir').select('*').eq('tanggal', selectedDate);
    if (selectedShift) querySetoran = querySetoran.eq('shift', selectedShift);
    const { data: setoranData } = await querySetoran;

    if (setoranData && setoranData.length > 0) {
      setDataSetoran(setoranData);
      setCatatanKasir(setoranData[0].catatan || '');
      setTotalSetoran(setoranData[0].total_setoran || 0);
    } else {
      setDataSetoran([]);
      setCatatanKasir('');
      setTotalSetoran(0);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchSetoran();
  }, [selectedDate, selectedShift]);

  const handleSimpanSetoran = async (e) => {
    e.preventDefault();
    if (totalSetoran <= 0) return alert('Masukkan total setoran tunai terlebih dahulu!');
    
    setIsSaving(true);
    try {
      // Cek apakah sudah ada setoran di tanggal & shift yang sama
      const existing = dataSetoran.find(d => d.tanggal === selectedDate && d.shift === selectedShift);

      if (existing) {
        // Update setoran yang sudah ada
        const { error } = await supabase.from('setoran_kasir').update({
          total_setoran: parseFloat(totalSetoran),
          catatan: catatanKasir,
          total_jurnal: totalJurnal,
          selisih: totalSetoran - totalJurnal,
          updated_at: new Date()
        }).eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Buat setoran baru
        const { error } = await supabase.from('setoran_kasir').insert([{
          tanggal: selectedDate,
          shift: selectedShift,
          total_setoran: parseFloat(totalSetoran),
          catatan: catatanKasir,
          total_jurnal: totalJurnal,
          selisih: totalSetoran - totalJurnal,
          created_by: 'Kasir'
        }]);
        
        if (error) throw error;
      }

      alert('✅ Setoran berhasil disimpan!');
      fetchSetoran();
    } catch (error) {
      alert('Gagal simpan setoran: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTanggalIndo = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Setoran Kasir</h1>
          <p className="text-slate-500 mt-1">Input total uang tunai yang disetorkan sesuai shift.</p>
        </div>
        <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
          <Printer size={20} /> Cetak Bukti Setoran
        </button>
      </div>

      {/* FILTER TANGGAL & SHIFT */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center no-print">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar size={18} className="text-slate-500" />
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-700" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-medium text-slate-600">Shift:</span>
          <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
            {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <KopSurat 
        judul="BUKTI SETORAN KASIR" 
        periode={`Tanggal: ${formatTanggalIndo(selectedDate)} - ${selectedShift}`} 
      />

      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 print-area">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* KOTAK TOTAL JURNAL */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
              <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-2">Total Pendapatan (Sistem)</p>
              <p className="text-3xl font-black text-blue-800">{formatRupiah(totalJurnal)}</p>
              <p className="text-xs text-blue-500 mt-2">*Berdasarkan data dari Jurnal Transaksi Kasir.</p>
            </div>

            {/* KOTAK SELISIH */}
            <div className={`p-6 rounded-xl border ${totalSetoran - totalJurnal === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${totalSetoran - totalJurnal === 0 ? 'text-green-600' : 'text-red-600'}`}>Selisih Setoran</p>
              <p className={`text-3xl font-black ${totalSetoran - totalJurnal === 0 ? 'text-green-800' : 'text-red-800'}`}>
                {totalSetoran - totalJurnal === 0 ? 'PAS (Rp 0)' : formatRupiah(totalSetoran - totalJurnal)}
              </p>
              <p className="text-xs text-slate-500 mt-2">*Total fisik yang disetor - Total sistem.</p>
            </div>
          </div>

          <form onSubmit={handleSimpanSetoran} className="no-print">
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Total Uang Tunai Fisik (Disetor)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">Rp</span>
                <input 
                  type="number" 
                  value={totalSetoran} 
                  onChange={(e) => setTotalSetoran(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-300 rounded-xl text-2xl font-black text-slate-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Catatan (Opsional)</label>
              <textarea 
                value={catatanKasir} 
                onChange={(e) => setCatatanKasir(e.target.value)} 
                rows="3" 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Contoh: Uang kertas lecek dipisahkan, dll."
              ></textarea>
            </div>

            <button type="submit" disabled={isSaving} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-lg">
              {isSaving ? <><Loader2 className="animate-spin" size={24} /> Menyimpan Setoran...</> : <><Save size={24} /> Simpan Data Setoran</>}
            </button>
          </form>

          {/* TANDA TANGAN PRINT */}
          <div className="hidden print:flex justify-between mt-16 px-8 text-sm font-semibold text-black">
            <div className="text-center flex flex-col justify-between h-28">
              <p>Kasir</p>
              <p className="mt-16">(...................................)</p>
            </div>
            <div className="text-center flex flex-col justify-between h-28">
              <p>Diperiksa Oleh,<br/>Accounting</p>
              <p className="mt-12">(...................................)</p>
            </div>
          </div>

        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-area { display: block !important; padding: 0 !important; }
          .bg-slate-100, .bg-blue-50, .bg-green-50, .bg-red-50 { background-color: transparent !important; border: 1px solid black !important; }
          .text-blue-800, .text-green-800, .text-red-800 { color: black !important; }
        }
      `}} />
    </div>
  );
}