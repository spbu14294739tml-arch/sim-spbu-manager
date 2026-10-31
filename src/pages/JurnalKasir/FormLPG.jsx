import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { Droplet, Loader2, Image as ImageIcon, Calculator, Lock } from 'lucide-react';

export default function FormLPG({ isSaving, setIsSaving }) {
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [produkLPG, setProdukLPG] = useState([]);
  const [listKodeAkun, setListKodeAkun] = useState([]);
  
  const [formData, setFormData] = useState({ tanggal: new Date().toISOString().split('T')[0], shift: '' });
  
  // State Form LPG
  const [lpgData, setLpgData] = useState({ 
    produk: null, 
    jenis_transaksi: 'REFILL_ONLY', 
    jumlah: '', 
    total_harga: '', 
    reff: '' 
  });

  useEffect(() => {
    const fetchInit = async () => {
      const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
      if (shiftData && shiftData.length > 0) {
        setListShift(shiftData.map(s => s.nama_shift));
        setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
      }
      
      // Ambil data LPG beserta harganya dari database
      const { data: nfr } = await supabase.from('master_produk_nfr').select('*').eq('kategori', 'LPG');
      if (nfr) setProdukLPG(nfr);
      
      const { data: kodeAkun } = await supabase.from('master_kode_akun').select('*').ilike('nama_transaksi', '%lpg%');
      if (kodeAkun) setListKodeAkun(kodeAkun);
      
      setIsLoading(false);
    };
    fetchInit();
  }, []);

  // Fungsi hitung total berdasarkan pilihan (TANPA INPUT MANUAL)
  const hitungTotal = (updatedData) => {
    const { produk, jenis_transaksi, jumlah } = updatedData;
    if (!produk || !jumlah) return 0;

    const qty = parseFloat(jumlah) || 0;
    const hargaIsi = parseFloat(produk.harga_jual) || 0;
    const hargaTabung = parseFloat(produk.harga_tabung) || 0; // Ambil dari database

    if (jenis_transaksi === 'REFILL_TABUNG') {
      return qty * (hargaIsi + hargaTabung);
    }
    return qty * hargaIsi; // Refill Only
  };

  const handleChange = (field, value) => {
    const newData = { ...lpgData, [field]: value };
    newData.total_harga = hitungTotal(newData);
    setLpgData(newData);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!lpgData.produk || !lpgData.jumlah) return alert('Lengkapi data LPG!');
    setIsSaving(true);

    const jenisStr = lpgData.jenis_transaksi === 'REFILL_TABUNG' ? 'Isi + Tabung' : 'Refill Only';
    const uraianJurnal = `LPG ${lpgData.produk.nama_produk} (${jenisStr})`;

    await supabase.from('penjualan_nfr').insert([{
      tanggal: formData.tanggal, 
      shift: formData.shift, 
      produk_nfr: uraianJurnal, 
      jumlah: parseFloat(lpgData.jumlah), 
      total_harga: lpgData.total_harga, 
      kasir_foreman: 'KASIR'
    }]);

    const { data: lastJurnal } = await supabase.from('jurnal_kasir').select('saldo').eq('tanggal', formData.tanggal).order('created_at', { ascending: false }).limit(1);
    const saldoSebelumnya = lastJurnal && lastJurnal.length > 0 ? lastJurnal[0].saldo : 0;

    await supabase.from('jurnal_kasir').insert([{
      tanggal: formData.tanggal, 
      shift: formData.shift, 
      dari_ke: 'PENJUALAN LPG', 
      uraian_kegiatan: `Produk: ${uraianJurnal}`, 
      reff: lpgData.reff || 'SP 4121', 
      debet: lpgData.total_harga, 
      kredit: 0, 
      saldo: saldoSebelumnya + lpgData.total_harga, 
      created_by: 'Kasir'
    }]);

    alert(`✅ Penjualan LPG (${jenisStr}) tersimpan!`);
    setLpgData({ produk: null, jenis_transaksi: 'REFILL_ONLY', jumlah: '', total_harga: '', reff: '' });
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;

  // Tampilkan peringatan jika Manager belum mengisi harga tabung
  const isHargaTabungKosong = lpgData.jenis_transaksi === 'REFILL_TABUNG' && lpgData.produk && (!lpgData.produk.harga_tabung || lpgData.produk.harga_tabung === 0);

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
          <label className="block text-xs font-bold text-slate-500 mb-1">Jenis Transaksi</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => handleChange('jenis_transaksi', 'REFILL_ONLY')} className={`flex-1 py-2 px-3 rounded-lg border font-semibold text-sm transition-all ${lpgData.jenis_transaksi === 'REFILL_ONLY' ? 'bg-orange-100 border-orange-500 text-orange-800' : 'bg-white border-slate-200 text-slate-600'}`}>
              Hanya Isi (Refill)
            </button>
            <button type="button" onClick={() => handleChange('jenis_transaksi', 'REFILL_TABUNG')} className={`flex-1 py-2 px-3 rounded-lg border font-semibold text-sm transition-all ${lpgData.jenis_transaksi === 'REFILL_TABUNG' ? 'bg-orange-100 border-orange-500 text-orange-800' : 'bg-white border-slate-200 text-slate-600'}`}>
              Isi + Tabung
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Jenis LPG</label>
          <div className="grid grid-cols-2 gap-2">
            {produkLPG.map(p => (
              <div key={p.id} onClick={() => handleChange('produk', p)} className={`cursor-pointer border p-2 rounded-xl flex flex-col items-center justify-center transition-all ${lpgData.produk?.id === p.id ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200' : 'border-slate-200 hover:border-orange-300'}`}>
                {p.foto_url ? <img src={p.foto_url} alt={p.nama_produk} className="w-10 h-10 object-cover rounded-md mb-1" /> : <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center mb-1"><ImageIcon size={16} className="text-slate-400" /></div>}
                <span className="block font-bold text-xs text-center">{p.nama_produk}</span>
                <span className="block text-[10px] text-slate-500 mt-1">Refill: {formatRupiah(p.harga_jual)}</span>
                {p.harga_tabung > 0 && <span className="block text-[10px] text-slate-500">+ Tabung: {formatRupiah(p.harga_tabung)}</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah (Pcs / Tabung)</label>
          <input type="number" value={lpgData.jumlah} onChange={(e) => handleChange('jumlah', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required />
        </div>

        {/* PERINGATAN JIKA HARGA TABUNG BELUM DIISI MANAGER */}
        {isHargaTabungKosong && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-xs flex items-start gap-2">
            <Lock size={16} className="mt-0.5 shrink-0" />
            <p><b>Harga Tabung Belum Diatur!</b> Silakan hubungi Manager untuk mengisi Harga Tabung di Master Produk. Kasir tidak diizinkan memasukkan harga manual.</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Reff Akun</label>
          <select value={lpgData.reff} onChange={(e) => setLpgData({ ...lpgData, reff: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">-- Pilih Reff --</option>
            {listKodeAkun.map((k, i) => <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>)}
          </select>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg flex justify-between items-center font-bold text-orange-700 border border-orange-200">
          <div className="flex items-center gap-2"><Calculator size={20}/> Total Harga:</div>
          <span className="text-xl">{formatRupiah(lpgData.total_harga)}</span>
        </div>

        <button 
          type="submit" 
          disabled={isSaving || isHargaTabungKosong} 
          className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Penjualan LPG'}
        </button>
      </form>
    </div>
  );
}