import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { Droplet, Loader2 } from 'lucide-react';

export default function FormLPG({ isSaving, setIsSaving }) {
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [produkLPG, setProdukLPG] = useState([]);
  const [listKodeAkun, setListKodeAkun] = useState([]);
  
  const [formData, setFormData] = useState({ tanggal: new Date().toISOString().split('T')[0], shift: '' });
  const [lpgData, setLpgData] = useState({ produk: null, jumlah: '', total_harga: '', reff: '' });

  useEffect(() => {
    const fetchInit = async () => {
      const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
      if (shiftData && shiftData.length > 0) {
        setListShift(shiftData.map(s => s.nama_shift));
        setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
      }
      const { data: nfr } = await supabase.from('master_produk_nfr').select('*').eq('kategori', 'LPG');
      if (nfr) setProdukLPG(nfr);
      
      const { data: kodeAkun } = await supabase.from('master_kode_akun').select('*').ilike('nama_transaksi', '%lpg%');
      if (kodeAkun) setListKodeAkun(kodeAkun);
      
      setIsLoading(false);
    };
    fetchInit();
  }, []);

  const handleJumlahChange = (e) => {
    const jumlah = e.target.value;
    const total = (jumlah && lpgData.produk) ? parseFloat(jumlah) * lpgData.produk.harga_jual : 0;
    setLpgData({ ...lpgData, jumlah, total_harga: total });
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!lpgData.produk || !lpgData.jumlah) return alert('Lengkapi data LPG!');
    setIsSaving(true);

    await supabase.from('penjualan_nfr').insert([{
      tanggal: formData.tanggal, shift: formData.shift, produk_nfr: lpgData.produk.nama_produk, jumlah: parseFloat(lpgData.jumlah), total_harga: lpgData.total_harga, kasir_foreman: 'KASIR'
    }]);

    const { data: lastJurnal } = await supabase.from('jurnal_kasir').select('saldo').eq('tanggal', formData.tanggal).order('created_at', { ascending: false }).limit(1);
    const saldoSebelumnya = lastJurnal && lastJurnal.length > 0 ? lastJurnal[0].saldo : 0;

    await supabase.from('jurnal_kasir').insert([{
      tanggal: formData.tanggal, shift: formData.shift, dari_ke: 'PENJUALAN LPG', uraian_kegiatan: `Produk: ${lpgData.produk.nama_produk}`, reff: lpgData.reff || 'SP 4121', debet: lpgData.total_harga, kredit: 0, saldo: saldoSebelumnya + lpgData.total_harga, created_by: 'Kasir'
    }]);

    alert('✅ Penjualan LPG tersimpan!');
    setLpgData({ produk: null, jumlah: '', total_harga: '', reff: '' });
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Droplet className="text-orange-500" /> Input Penjualan LPG</h2>
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
          <label className="block text-xs font-bold text-slate-500 mb-1">Jenis LPG</label>
          <div className="grid grid-cols-2 gap-2">
            {produkLPG.map(p => (
              <div key={p.id} onClick={() => setLpgData({ ...lpgData, produk: p })} className={`cursor-pointer border p-2 rounded-xl text-center ${lpgData.produk?.id === p.id ? 'bg-orange-50 border-orange-500' : 'border-slate-200'}`}>
                <span className="block font-bold text-xs">{p.nama_produk}</span>
                <span className="block text-[10px] text-slate-500">{formatRupiah(p.harga_jual)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah Tabung</label>
          <input type="number" value={lpgData.jumlah} onChange={handleJumlahChange} className="w-full px-3 py-2 border rounded-lg text-sm" required />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Reff Akun</label>
          <select value={lpgData.reff} onChange={(e) => setLpgData({ ...lpgData, reff: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">-- Pilih Reff --</option>
            {listKodeAkun.map((k, i) => <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>)}
          </select>
        </div>

        <div className="bg-orange-50 p-3 rounded-lg flex justify-between font-bold text-orange-700">
          <span>Total Harga:</span> <span>{formatRupiah(lpgData.total_harga)}</span>
        </div>

        <button type="submit" disabled={isSaving} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">
          {isSaving ? 'Menyimpan...' : 'Simpan Penjualan LPG'}
        </button>
      </form>
    </div>
  );
}