// src/pages/JurnalKasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Plus, Trash2, BookOpen, Printer } from 'lucide-react';
import KopSurat from '../components/KopSurat';

const DAFTAR_DARI_KE = [
  'KASIR', 'MANAGER', 'ACCOUNTING', 'BANK BJB', 'BANK BRI', 'BANK MANDIRI', 
  'TMB (Tata Murtaya Bersama)', 'PT TPS', 'JASA RAHARJA', 'PERTAMINA', 
  'OPERASIONAL', 'LAINNYA'
];

export default function JurnalKasir() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listShift, setListShift] = useState([]);
  const [jurnal, setJurnal] = useState([]);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    shift: '',
    pilihan_dari_ke: 'KASIR',
    custom_dari_ke: '',
    uraian_kegiatan: '',
    reff: '',
    debet: '',
    kredit: ''
  });

  const fetchData = async () => {
    setIsLoading(true);

    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData && shiftData.length > 0) {
      setListShift(shiftData.map(s => s.nama_shift));
      if (!formData.shift) setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
    }

    let query = supabase.from('jurnal_kasir')
      .select('*')
      .eq('tanggal', formData.tanggal)
      .order('created_at', { ascending: true });

    if (formData.shift) query = query.eq('shift', formData.shift);

    const { data: jurnalData } = await query;
    if (jurnalData) setJurnal(jurnalData);

    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [formData.tanggal, formData.shift]);

  // Hitung Saldo Berjalan
  let saldoBerjalan = 0;
  const jurnalDenganSaldo = jurnal.map((item) => {
    saldoBerjalan += (item.debet || 0) - (item.kredit || 0);
    return { ...item, running_saldo: saldoBerjalan };
  });

  const totalDebet = jurnalDenganSaldo.reduce((acc, curr) => acc + (curr.debet || 0), 0);
  const totalKredit = jurnalDenganSaldo.reduce((acc, curr) => acc + (curr.kredit || 0), 0);

  // HANDLER PILIH DARI/KE
  const handlePilihDariKe = (val) => {
    let autoReff = '';
    if (val === 'BANK BJB') autoReff = 'SETOR-BJB-';
    else if (val === 'BANK BRI') autoReff = 'SETOR-BRI-';
    else if (val === 'BANK MANDIRI') autoReff = 'SETOR-MDR-';
    else if (val === 'LAINNYA') autoReff = '';

    setFormData({ ...formData, pilihan_dari_ke: val, reff: autoReff });
  };

  // Simpan Transaksi
  const handleSimpan = async (e) => {
    e.preventDefault();
    const namaFinal = formData.pilihan_dari_ke === 'LAINNYA' ? formData.custom_dari_ke : formData.pilihan_dari_ke;
    
    if (!namaFinal || !formData.uraian_kegiatan) return alert('Lengkapi Dari/Ke dan Uraian Kegiatan!');
    if (!formData.debet && !formData.kredit) return alert('Isi salah satu: Debet atau Kredit!');

    setIsSaving(true);

    const saldoAkhirSekarang = totalDebet - totalKredit;
    const debetNum = parseFloat(formData.debet) || 0;
    const kreditNum = parseFloat(formData.kredit) || 0;
    const saldoBaru = saldoAkhirSekarang + debetNum - kreditNum;

    const payload = {
      tanggal: formData.tanggal,
      shift: formData.shift,
      dari_ke: namaFinal.toUpperCase(),
      uraian_kegiatan: formData.uraian_kegiatan.toUpperCase(),
      reff: formData.reff.toUpperCase(),
      debet: debetNum,
      kredit: kreditNum,
      saldo: saldoBaru
    };

    const { error } = await supabase.from('jurnal_kasir').insert([payload]);
    
    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      setFormData({ ...formData, custom_dari_ke: '', uraian_kegiatan: '', reff: '', debet: '', kredit: '' });
      fetchData();
    }
    setIsSaving(false);
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Hapus catatan transaksi ini?')) return;
    await supabase.from('jurnal_kasir').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Jurnal Kas Harian</h1>
          <p className="text-slate-500 text-sm mt-1">Pencatatan uang masuk (Debet) dan uang keluar (Kredit).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <Printer size={18}/> Cetak Jurnal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM INPUT */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit no-print">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-600"/> Tambah Catatan</h2>
          
          <form onSubmit={handleSimpan} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                <input type="date" value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" readOnly />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Shift</label>
                <select value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                  {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Dari / Ke</label>
              <select value={formData.pilihan_dari_ke} onChange={(e) => handlePilihDariKe(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                {DAFTAR_DARI_KE.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Jika Pilih LAINNYA, Munculkan Input Customer */}
            {formData.pilihan_dari_ke === 'LAINNYA' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-medium text-blue-700 mb-1">Input Customer / Instansi Baru</label>
                <input type="text" value={formData.custom_dari_ke} onChange={(e) => setFormData({...formData, custom_dari_ke: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm" placeholder="Ketik nama..." required />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Uraian Kegiatan</label>
              <input type="text" value={formData.uraian_kegiatan} onChange={(e) => setFormData({...formData, uraian_kegiatan: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: SETORAN MODAL AWAL" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reff / No. Bukti</label>
              <input type="text" value={formData.reff} onChange={(e) => setFormData({...formData, reff: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Otomatis / Ketik Manual" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">Debet (Masuk)</label>
                <input type="number" value={formData.debet} onChange={(e) => setFormData({...formData, debet: e.target.value, kredit: ''})} className="w-full px-3 py-2 border-2 border-green-200 rounded-lg text-sm font-bold text-green-700 focus:ring-2 focus:ring-green-500" placeholder="Rp" />
              </div>
              <div>
                <label className="block text-xs font-medium text-red-700 mb-1">Kredit (Keluar)</label>
                <input type="number" value={formData.kredit} onChange={(e) => setFormData({...formData, kredit: e.target.value, debet: ''})} className="w-full px-3 py-2 border-2 border-red-200 rounded-lg text-sm font-bold text-red-700 focus:ring-2 focus:ring-red-500" placeholder="Rp" />
              </div>
            </div>

            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm mt-2 text-sm disabled:opacity-50">
              {isSaving ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </form>
        </div>

        {/* TABEL JURNAL */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden no-print">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-slate-500"/> Jurnal Berjalan</h2>
            <p className="text-xs text-slate-500">{jurnal.length} catatan</p>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left">Dari / Ke</th>
                  <th className="px-3 py-3 text-left">Uraian</th>
                  <th className="px-3 py-3 text-center">Reff</th>
                  <th className="px-3 py-3 text-right">Debet</th>
                  <th className="px-3 py-3 text-right">Kredit</th>
                  <th className="px-3 py-3 text-right">Saldo</th>
                  <th className="px-3 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jurnalDenganSaldo.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">Belum ada transaksi pada shift ini.</td></tr>
                ) : jurnalDenganSaldo.map((item, idx) => (
                  <tr key={item.id} className={`hover:bg-slate-50 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                    <td className="px-3 py-3 font-semibold text-slate-800">{item.dari_ke}</td>
                    <td className="px-3 py-3 text-slate-600">{item.uraian_kegiatan}</td>
                    <td className="px-3 py-3 text-center text-slate-400">{item.reff || '-'}</td>
                    <td className="px-3 py-3 text-right font-medium text-green-600">{item.debet > 0 ? formatRupiah(item.debet) : '-'}</td>
                    <td className="px-3 py-3 text-right font-medium text-red-600">{item.kredit > 0 ? formatRupiah(item.kredit) : '-'}</td>
                    <td className="px-3 py-3 text-right font-bold text-slate-800 bg-slate-50/50">{formatRupiah(item.running_saldo)}</td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => handleHapus(item.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
            <div className="flex gap-6 text-sm">
              <span>Total Masuk: <strong className="text-green-400">{formatRupiah(totalDebet)}</strong></span>
              <span>Total Keluar: <strong className="text-red-400">{formatRupiah(totalKredit)}</strong></span>
            </div>
            <span className="text-sm">Sisa Saldo: <strong className="text-blue-300 text-lg">{formatRupiah(totalDebet - totalKredit)}</strong></span>
          </div>
        </div>
      </div>

      {/* AREA CETAK */}
      <div className="hidden print:block print-area">
        <KopSurat 
          judul="JURNAL KAS HARIAN" 
          periode={`Tanggal: ${new Date(formData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - Shift: ${formData.shift}`} 
        />
        
        <table className="w-full text-xs border-collapse mt-4">
          <thead>
            <tr className="bg-slate-100 border-y-2 border-black">
              <th className="border border-black px-2 py-2 text-left">Dari / Ke</th>
              <th className="border border-black px-2 py-2 text-left">Uraian Kegiatan</th>
              <th className="border border-black px-2 py-2 text-center">Reff</th>
              <th className="border border-black px-2 py-2 text-right">Debet (Rp)</th>
              <th className="border border-black px-2 py-2 text-right">Kredit (Rp)</th>
              <th className="border border-black px-2 py-2 text-right">Saldo (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {jurnalDenganSaldo.map((item, idx) => (
              <tr key={item.id}>
                <td className="border border-black px-2 py-1.5 font-semibold">{item.dari_ke}</td>
                <td className="border border-black px-2 py-1.5">{item.uraian_kegiatan}</td>
                <td className="border border-black px-2 py-1.5 text-center">{item.reff || '-'}</td>
                <td className="border border-black px-2 py-1.5 text-right">{item.debet > 0 ? formatRupiah(item.debet) : '-'}</td>
                <td className="border border-black px-2 py-1.5 text-right">{item.kredit > 0 ? formatRupiah(item.kredit) : '-'}</td>
                <td className="border border-black px-2 py-1.5 text-right font-bold">{formatRupiah(item.running_saldo)}</td>
              </tr>
            ))}
            <tr className="bg-slate-200 border-t-2 border-black font-bold">
              <td colSpan={3} className="border border-black px-2 py-2 text-right uppercase">Total</td>
              <td className="border border-black px-2 py-2 text-right">{formatRupiah(totalDebet)}</td>
              <td className="border border-black px-2 py-2 text-right">{formatRupiah(totalKredit)}</td>
              <td className="border border-black px-2 py-2 text-right">{formatRupiah(totalDebet - totalKredit)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between mt-12 px-8 text-sm font-semibold text-black">
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

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .print-area { display: block !important; }
        }
      `}} />
    </div>
  );
}