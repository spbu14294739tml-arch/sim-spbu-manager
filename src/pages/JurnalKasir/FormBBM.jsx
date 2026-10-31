import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { Fuel, Loader2 } from 'lucide-react';

export default function FormBBM({ isSaving, setIsSaving }) {
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [masterBBM, setMasterBBM] = useState([]);
  const [listKodeAkun, setListKodeAkun] = useState([]);
  
  const [formData, setFormData] = useState({ tanggal: new Date().toISOString().split('T')[0], shift: '' });
  const [bbmData, setBbmData] = useState({ dispenser: 'DISPENSER 1', jenis_bbm: '', jumlah_liter: '', operator: '', total_harga: '', reff: '' });
  const listDispenser = ['DISPENSER 1', 'DISPENSER 2', 'DISPENSER 3', 'DISPENSER 4', 'DISPENSER 5'];

  useEffect(() => {
    const fetchInit = async () => {
      const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
      if (shiftData && shiftData.length > 0) {
        setListShift(shiftData.map(s => s.nama_shift));
        setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
      }
      const { data: bbmData } = await supabase.from('master_produk_bbm').select('*');
      if (bbmData) setMasterBBM(bbmData);
      
      const { data: kodeAkun } = await supabase.from('master_kode_akun').select('*').ilike('nama_transaksi', '%bbm%');
      if (kodeAkun) setListKodeAkun(kodeAkun);
      
      setIsLoading(false);
    };
    fetchInit();
  }, []);

  const handleJumlahChange = (e) => {
    const jumlah = e.target.value;
    const selectedBBM = masterBBM.find(b => b.jenis_bbm === bbmData.jenis_bbm);
    const total = (jumlah && selectedBBM) ? parseFloat(jumlah) * selectedBBM.harga_per_liter : 0;
    setBbmData({ ...bbmData, jumlah_liter: jumlah, total_harga: total });
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!bbmData.jenis_bbm || !bbmData.jumlah_liter) return alert('Lengkapi data BBM!');
    setIsSaving(true);

    await supabase.from('penjualan_bbm').insert([{
      tanggal: formData.tanggal, shift: formData.shift, dispenser: bbmData.dispenser, jenis_bbm: bbmData.jenis_bbm, jumlah_liter: parseFloat(bbmData.jumlah_liter), total_harga: bbmData.total_harga, operator: bbmData.operator.toUpperCase() || 'OPERATOR'
    }]);

    const { data: lastJurnal } = await supabase.from('jurnal_kasir').select('saldo').eq('tanggal', formData.tanggal).order('created_at', { ascending: false }).limit(1);
    const saldoSebelumnya = lastJurnal && lastJurnal.length > 0 ? lastJurnal[0].saldo : 0;

    await supabase.from('jurnal_kasir').insert([{
      tanggal: formData.tanggal, shift: formData.shift, dari_ke: 'SPBU 14.294.739', uraian_kegiatan: `PENJUALAN BBM ${bbmData.jenis_bbm}`, reff: bbmData.reff || 'SP-4100', debet: bbmData.total_harga, kredit: 0, saldo: saldoSebelumnya + bbmData.total_harga, created_by: 'Kasir'
    }]);

    alert('✅ Penjualan BBM tersimpan!');
    setBbmData({ ...bbmData, jenis_bbm: '', jumlah_liter: '', operator: '', total_harga: '', reff: '' });
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Fuel className="text-blue-600" /> Input Penjualan BBM</h2>
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
          <label className="block text-xs font-bold text-slate-500 mb-1">Dispenser</label>
          <select value={bbmData.dispenser} onChange={(e) => setBbmData({ ...bbmData, dispenser: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
            {listDispenser.map((d, i) => <option key={i} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Jenis BBM</label>
          <div className="grid grid-cols-2 gap-2">
            {masterBBM.map(b => (
              <div key={b.id} onClick={() => setBbmData({ ...bbmData, jenis_bbm: b.jenis_bbm })} className={`cursor-pointer border p-2 rounded-xl text-center ${bbmData.jenis_bbm === b.jenis_bbm ? 'bg-blue-50 border-blue-500' : 'border-slate-200'}`}>
                <span className="block font-bold text-xs">{b.jenis_bbm}</span>
                <span className="block text-[10px] text-slate-500">{formatRupiah(b.harga_per_liter)}/L</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah Liter</label>
            <input type="number" step="0.01" value={bbmData.jumlah_liter} onChange={handleJumlahChange} className="w-full px-3 py-2 border rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Operator</label>
            <input type="text" value={bbmData.operator} onChange={(e) => setBbmData({ ...bbmData, operator: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Reff Akun</label>
          <select value={bbmData.reff} onChange={(e) => setBbmData({ ...bbmData, reff: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">-- Pilih Reff --</option>
            {listKodeAkun.map((k, i) => <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>)}
          </select>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg flex justify-between font-bold text-blue-700">
          <span>Total Harga:</span> <span>{formatRupiah(bbmData.total_harga)}</span>
        </div>

        <button type="submit" disabled={isSaving} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">
          {isSaving ? 'Menyimpan...' : 'Simpan Penjualan BBM'}
        </button>
      </form>
    </div>
  );
}