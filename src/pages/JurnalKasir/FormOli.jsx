import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { ShoppingBag, Loader2, Image as ImageIcon } from 'lucide-react';

export default function FormOli({ isSaving, setIsSaving }) {
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [produkOLI, setProdukOLI] = useState([]);
  const [listKodeAkun, setListKodeAkun] = useState([]);
  
  const [formData, setFormData] = useState({ tanggal: new Date().toISOString().split('T')[0], shift: '' });
  const [oliData, setOliData] = useState({ produk: null, jumlah: '', total_harga: '', reff: '' });

  useEffect(() => {
    const fetchInit = async () => {
      const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
      if (shiftData && shiftData.length > 0) {
        setListShift(shiftData.map(s => s.nama_shift));
        setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
      }
      
      const { data: nfr } = await supabase.from('master_produk_nfr').select('*').eq('kategori', 'OLI');
      if (nfr) setProdukOLI(nfr);
      
      const { data: kodeAkun } = await supabase.from('master_kode_akun').select('*').ilike('nama_transaksi', '%oli%');
      if (kodeAkun) setListKodeAkun(kodeAkun);
      
      setIsLoading(false);
    };
    fetchInit();
  }, []);

  const handleJumlahChange = (e) => {
    const jumlah = e.target.value;
    const total = (jumlah && oliData.produk) ? parseFloat(jumlah) * oliData.produk.harga_jual : 0;
    setOliData({ ...oliData, jumlah, total_harga: total });
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!oliData.produk || !oliData.jumlah) return alert('Lengkapi data Oli!');
    setIsSaving(true);

    await supabase.from('penjualan_nfr').insert([{
      tanggal: formData.tanggal, shift: formData.shift, produk_nfr: oliData.produk.nama_produk, jumlah: parseFloat(oliData.jumlah), total_harga: oliData.total_harga, kasir_foreman: 'KASIR'
    }]);

    const { data: lastJurnal } = await supabase.from('jurnal_kasir').select('saldo').eq('tanggal', formData.tanggal).order('created_at', { ascending: false }).limit(1);
    const saldoSebelumnya = lastJurnal && lastJurnal.length > 0 ? lastJurnal[0].saldo : 0;

    await supabase.from('jurnal_kasir').insert([{
      tanggal: formData.tanggal, 
      shift: formData.shift, 
      dari_ke: 'PENJUALAN OLI',
      uraian_kegiatan: `Produk: ${oliData.produk.nama_produk}`, 
      reff: oliData.reff || 'SP 4122',
      debet: oliData.total_harga, 
      kredit: 0, 
      saldo: saldoSebelumnya + oliData.total_harga, 
      created_by: 'Kasir'
    }]);

    alert('✅ Penjualan Oli tersimpan!');
    setOliData({ produk: null, jumlah: '', total_harga: '', reff: '' });
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <ShoppingBag className="text-emerald-600" /> Input Penjualan Oli / Pelumas
      </h2>
      
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
          <label className="block text-xs font-bold text-slate-500 mb-1">Jenis Oli</label>
          <div className="grid grid-cols-2 gap-2">
            {produkOLI.map(p => (
              <div key={p.id} onClick={() => setOliData({ ...oliData, produk: p })} className={`cursor-pointer border p-2 rounded-xl flex flex-col items-center justify-center transition-all ${oliData.produk?.id === p.id ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-emerald-300'}`}>
                {p.foto_url ? <img src={p.foto_url} alt={p.nama_produk} className="w-10 h-10 object-cover rounded-md mb-1" /> : <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center mb-1"><ImageIcon size={16} className="text-slate-400" /></div>}
                <span className="block font-bold text-xs text-center">{p.nama_produk}</span>
                <span className="block text-[10px] text-slate-500 mt-1">{formatRupiah(p.harga_jual)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah (Pcs)</label>
          <input type="number" value={oliData.jumlah} onChange={handleJumlahChange} className="w-full px-3 py-2 border rounded-lg text-sm" required />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Reff Akun</label>
          <select value={oliData.reff} onChange={(e) => setOliData({ ...oliData, reff: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">-- Pilih Reff --</option>
            {listKodeAkun.map((k, i) => <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>)}
          </select>
        </div>

        <div className="bg-emerald-50 p-3 rounded-lg flex justify-between font-bold text-emerald-700">
          <span>Total Harga:</span> <span>{formatRupiah(oliData.total_harga)}</span>
        </div>

        <button type="submit" disabled={isSaving} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">
          {isSaving ? 'Menyimpan...' : 'Simpan Penjualan Oli'}
        </button>
      </form>
    </div>
  );
}