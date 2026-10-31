import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { FileText, Loader2 } from 'lucide-react';

export default function FormLainnya({ isSaving, setIsSaving }) {
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [masterKodeAkun, setMasterKodeAkun] = useState([]);
  
  const [formData, setFormData] = useState({ tanggal: new Date().toISOString().split('T')[0], shift: '' });
  const [lainnyaData, setLainnyaData] = useState({ dari_ke: '', uraian_kegiatan: '', reff: '', debet: '', kredit: '' });

  useEffect(() => {
    const fetchInit = async () => {
      const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
      if (shiftData && shiftData.length > 0) {
        setListShift(shiftData.map(s => s.nama_shift));
        setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
      }
      
      const { data: kodeAkun } = await supabase.from('master_kode_akun').select('*').order('kode_reff');
      if (kodeAkun) setMasterKodeAkun(kodeAkun);
      
      setIsLoading(false);
    };
    fetchInit();
  }, []);

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!lainnyaData.dari_ke || !lainnyaData.uraian_kegiatan) return alert('Lengkapi Dari/Ke dan Uraian!');
    if (!lainnyaData.debet && !lainnyaData.kredit) return alert('Isi salah satu: Debet atau Kredit!');
    
    setIsSaving(true);

    // Cari Kode Akun yang dipilih untuk melihat Mutasi normalnya
    const selectedAkun = masterKodeAkun.find(k => k.kode_reff === lainnyaData.reff);
    let debetNum = 0;
    let kreditNum = 0;

    if (selectedAkun) {
      if (selectedAkun.mutasi === 'DEBET') debetNum = parseFloat(lainnyaData.debet || 0);
      else kreditNum = parseFloat(lainnyaData.kredit || 0);
    }

    const { data: lastJurnal } = await supabase.from('jurnal_kasir').select('saldo').eq('tanggal', formData.tanggal).order('created_at', { ascending: false }).limit(1);
    const saldoSebelumnya = lastJurnal && lastJurnal.length > 0 ? lastJurnal[0].saldo : 0;
    const saldoBaru = saldoSebelumnya + debetNum - kreditNum;

    await supabase.from('jurnal_kasir').insert([{
      tanggal: formData.tanggal, 
      shift: formData.shift, 
      dari_ke: lainnyaData.dari_ke.toUpperCase(), 
      uraian_kegiatan: lainnyaData.uraian_kegiatan.toUpperCase(), 
      reff: lainnyaData.reff.toUpperCase(), 
      debet: debetNum, 
      kredit: kreditNum,
      saldo: saldoBaru, 
      created_by: 'Kasir'
    }]);

    alert('✅ Transaksi Lainnya tersimpan!');
    setLainnyaData({ dari_ke: '', uraian_kegiatan: '', reff: '', debet: '', kredit: '' });
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="text-slate-700" /> Input Transaksi Lainnya</h2>
      <form onSubmit={handleSimpan} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
            <input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Shift</label>
            <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
              {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Dari / Ke</label>
          <select value={lainnyaData.dari_ke} onChange={(e) => setLainnyaData({...lainnyaData, dari_ke: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required>
            <option value="">-- Pilih --</option>
            <option value="KASIR">KASIR</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ACCOUNTING">ACCOUNTING</option>
            <option value="BANK BJB">BANK BJB</option>
            <option value="BANK BRI">BANK BRI</option>
            <option value="OPERASIONAL">OPERASIONAL</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Uraian Kegiatan</label>
          <input type="text" value={lainnyaData.uraian_kegiatan} onChange={(e) => setLainnyaData({...lainnyaData, uraian_kegiatan: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: Beli Air Minum" required />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Kode Akun / Reff</label>
          <select value={lainnyaData.reff} onChange={(e) => setLainnyaData({...lainnyaData, reff: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required>
            <option value="">-- Pilih Kode Akun --</option>
            {masterKodeAkun.map((k, i) => <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-green-700 mb-1">Debet (Masuk)</label>
            <input type="number" value={lainnyaData.debet} onChange={(e) => setLainnyaData({...lainnyaData, debet: e.target.value, kredit: ''})} className="w-full px-3 py-2 border-2 border-green-200 rounded-lg text-sm font-bold text-green-700" placeholder="Rp" />
          </div>
          <div>
            <label className="block text-xs font-bold text-red-700 mb-1">Kredit (Keluar)</label>
            <input type="number" value={lainnyaData.kredit} onChange={(e) => setLainnyaData({...lainnyaData, kredit: e.target.value, debet: ''})} className="w-full px-3 py-2 border-2 border-red-200 rounded-lg text-sm font-bold text-red-700" placeholder="Rp" />
          </div>
        </div>

        <button type="submit" disabled={isSaving} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">
          {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
        </button>
      </form>
    </div>
  );
}