import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { RotateCcw, ShieldAlert, Loader2 } from 'lucide-react';

export default function FormKoreksi({ isSaving, setIsSaving }) {
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [masterKodeAkun, setMasterKodeAkun] = useState([]);
  
  const [formData, setFormData] = useState({ tanggal: new Date().toISOString().split('T')[0], shift: '' });
  const [koreksiData, setKoreksiData] = useState({
    tanggal_asli: new Date().toISOString().split('T')[0],
    shift_asli: '', jenis: 'BBM', uraian_asli: '',
    nominal_asli: '', nominal_benar: '', reff: '', alasan: '',
  });

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
    if (!koreksiData.tanggal_asli || !koreksiData.shift_asli) return alert('Lengkapi tanggal dan shift transaksi asli!');
    if (!koreksiData.uraian_asli.trim()) return alert('Isi uraian transaksi asli yang salah!');
    if (!koreksiData.nominal_asli || !koreksiData.nominal_benar) return alert('Isi nominal salah dan nominal benar!');
    if (!koreksiData.reff) return alert('Pilih kode akun / reff transaksi!');
    if (!koreksiData.alasan.trim()) return alert('Isi alasan koreksi untuk jejak audit!');

    const nominalAsli = parseFloat(koreksiData.nominal_asli);
    const nominalBenar = parseFloat(koreksiData.nominal_benar);
    if (nominalAsli === nominalBenar) return alert('Nominal salah dan benar tidak boleh sama.');

    const yakin = window.confirm(`Konfirmasi Koreksi:\nSalah: ${formatRupiah(nominalAsli)}\nBenar: ${formatRupiah(nominalBenar)}\n\nSistem akan membuat 2 baris jurnal koreksi. Lanjutkan?`);
    if (!yakin) return;

    setIsSaving(true);
    try {
      const tanggalKoreksi = new Date().toISOString().split('T')[0];
      const { data: jurnalTglIni } = await supabase.from('jurnal_kasir').select('saldo').eq('tanggal', tanggalKoreksi).order('created_at', { ascending: false }).limit(1);
      let saldoBerjalan = jurnalTglIni && jurnalTglIni.length > 0 ? jurnalTglIni[0].saldo : 0;

      // Baris 1: Balik transaksi salah (Kredit)
      await supabase.from('jurnal_kasir').insert([{
        tanggal: tanggalKoreksi, shift: formData.shift || koreksiData.shift_asli,
        dari_ke: `KOREKSI - ${koreksiData.jenis}`, uraian_kegiatan: `[KOREKSI] ${koreksiData.uraian_asli.toUpperCase()} (BALIK SALAH)`,
        reff: koreksiData.reff, debet: 0, kredit: nominalAsli, saldo: saldoBerjalan - nominalAsli, created_by: 'Kasir'
      }]);
      saldoBerjalan = saldoBerjalan - nominalAsli;

      // Baris 2: Catat nilai benar (Debet)
      await supabase.from('jurnal_kasir').insert([{
        tanggal: tanggalKoreksi, shift: formData.shift || koreksiData.shift_asli,
        dari_ke: `KOREKSI - ${koreksiData.jenis}`, uraian_kegiatan: `[KOREKSI] ${koreksiData.uraian_asli.toUpperCase()} (NILAI BENAR)`,
        reff: koreksiData.reff, debet: nominalBenar, kredit: 0, saldo: saldoBerjalan + nominalBenar, created_by: 'Kasir'
      }]);

      alert(`✅ Jurnal Koreksi berhasil dibuat!`);
      setKoreksiData({ tanggal_asli: new Date().toISOString().split('T')[0], shift_asli: '', jenis: 'BBM', uraian_asli: '', nominal_asli: '', nominal_benar: '', reff: '', alasan: '' });
    } catch (error) {
      alert('Gagal simpan koreksi: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 max-w-xl mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
        <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-1"><ShieldAlert size={16} /> Mode Jurnal Koreksi</h2>
        <p className="text-xs text-amber-700 leading-snug">Untuk salah input <b>tanggal lampau</b>. Sistem membuat 2 baris jurnal koreksi.</p>
      </div>

      <form onSubmit={handleSimpan} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Asli (Salah)</label>
            <input type="date" value={koreksiData.tanggal_asli} onChange={(e) => setKoreksiData({ ...koreksiData, tanggal_asli: e.target.value })} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Shift Asli</label>
            <select value={koreksiData.shift_asli} onChange={(e) => setKoreksiData({ ...koreksiData, shift_asli: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required>
              <option value="">-- Pilih Shift --</option>
              {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Uraian Transaksi Asli</label>
          <input type="text" value={koreksiData.uraian_asli} onChange={(e) => setKoreksiData({ ...koreksiData, uraian_asli: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: PENJUALAN BBM PERTALITE" required />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Kode Akun / Reff</label>
          <select value={koreksiData.reff} onChange={(e) => setKoreksiData({ ...koreksiData, reff: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required>
            <option value="">-- Pilih Kode Akun --</option>
            {masterKodeAkun.map((k, i) => <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-red-700 mb-1">Nominal Salah (Rp)</label>
            <input type="number" value={koreksiData.nominal_asli} onChange={(e) => setKoreksiData({ ...koreksiData, nominal_asli: e.target.value })} className="w-full px-3 py-2 border-2 border-red-200 rounded-lg text-sm font-bold text-red-700" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-green-700 mb-1">Nominal Benar (Rp)</label>
            <input type="number" value={koreksiData.nominal_benar} onChange={(e) => setKoreksiData({ ...koreksiData, nominal_benar: e.target.value })} className="w-full px-3 py-2 border-2 border-green-200 rounded-lg text-sm font-bold text-green-700" required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Alasan Koreksi (wajib)</label>
          <input type="text" value={koreksiData.alasan} onChange={(e) => setKoreksiData({ ...koreksiData, alasan: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: SALAH KETIK LITER" required />
        </div>

        <button type="submit" disabled={isSaving} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold">
          {isSaving ? 'Menyimpan...' : '🔄 Simpan Jurnal Koreksi'}
        </button>
      </form>
    </div>
  );
}