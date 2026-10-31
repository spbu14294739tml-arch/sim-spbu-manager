import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { Loader2, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

export default function TabProdukNFR() {
  const [daftarProduk, setDaftarProduk] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [form, setForm] = useState({ kategori: 'LPG', nama_produk: '', harga_beli: '', harga_jual: '', harga_tabung: '' });
  const [displayBeli, setDisplayBeli] = useState('');
  const [displayJual, setDisplayJual] = useState('');
  const [displayTabung, setDisplayTabung] = useState('');
  
  const [fileFoto, setFileFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState('');
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('master_produk_nfr').select('*').order('id', { ascending: false });
    if (data) setDaftarProduk(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const formatHarga = (e, setterRaw, setterDisplay) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setterRaw(raw);
    setterDisplay(raw ? formatRupiah(raw) : '');
  };

  const handleTambah = async (e) => {
    e.preventDefault();
    if (!form.nama_produk || !form.harga_jual) return alert('Lengkapi Nama dan Harga Jual Produk!');
    setIsUploading(true);
    let fotoUrl = '';

    if (fileFoto) {
      const fileExt = fileFoto.name.split('.').pop();
      const fileName = `${Date.now()}_${form.nama_produk.replace(/\s+/g, '_')}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('foto_produk').upload(fileName, fileFoto);
      if (uploadError) { alert('Gagal upload foto: ' + uploadError.message); setIsUploading(false); return; }
      const { data: publicUrlData } = supabase.storage.from('foto_produk').getPublicUrl(fileName);
      fotoUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from('master_produk_nfr').insert([{
      kategori: form.kategori, 
      nama_produk: form.nama_produk.toUpperCase(), 
      harga_beli: parseFloat(form.harga_beli) || 0, 
      harga_jual: parseFloat(form.harga_jual), 
      harga_tabung: form.kategori === 'LPG' ? (parseFloat(form.harga_tabung) || 0) : 0,
      foto_url: fotoUrl
    }]);

    if (error) alert('Gagal simpan produk: ' + error.message);
    else {
      setForm({ kategori: 'LPG', nama_produk: '', harga_beli: '', harga_jual: '', harga_tabung: '' }); 
      setDisplayBeli(''); setDisplayJual(''); setDisplayTabung('');
      setFileFoto(null); setPreviewFoto(''); fetchData();
    }
    setIsUploading(false);
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Hapus produk ini?')) return;
    await supabase.from('master_produk_nfr').delete().eq('id', id);
    fetchData();
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Tambah Produk NFR Baru</h2>
        <form onSubmit={handleTambah} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <select value={form.kategori} onChange={(e) => setForm({...form, kategori: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white">
              <option value="LPG">LPG</option>
              <option value="OLI">Oli / Pelumas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label>
            <input type="text" required value={form.nama_produk} onChange={(e) => setForm({...form, nama_produk: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="Cth: LPG 3 KG" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Harga Beli (Modal) Rp</label>
            <input type="text" value={displayBeli} onChange={(e) => formatHarga(e, (v) => setForm({...form, harga_beli: v}), setDisplayBeli)} className="w-full px-4 py-2 border rounded-xl" placeholder="Rp 0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Harga Jual (Refill) Rp</label>
            <input type="text" required value={displayJual} onChange={(e) => formatHarga(e, (v) => setForm({...form, harga_jual: v}), setDisplayJual)} className="w-full px-4 py-2 border rounded-xl" placeholder="Rp 0" />
          </div>

          {form.kategori === 'LPG' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Harga Tabung Rp</label>
              <input type="text" value={displayTabung} onChange={(e) => formatHarga(e, (v) => setForm({...form, harga_tabung: v}), setDisplayTabung)} className="w-full px-4 py-2 border rounded-xl" placeholder="Rp 0" />
            </div>
          )}

          <div className={form.kategori === 'LPG' ? "" : "md:col-span-2"}>
            <label className="block text-sm font-medium text-slate-700 mb-1">Foto Produk</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-100 border flex items-center justify-center overflow-hidden">
                {previewFoto ? <img src={previewFoto} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-400" size={24} />}
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { setFileFoto(e.target.files[0]); setPreviewFoto(URL.createObjectURL(e.target.files[0])); }} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current.click()} className="bg-white border px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><Upload size={16} /> Pilih Foto</button>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end mt-2">
            <button type="submit" disabled={isUploading} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
              {isUploading ? <><Loader2 className="animate-spin" size={18} /> Menyimpan...</> : <><Plus size={18} /> Tambah Produk</>}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-bold text-slate-800">Daftar Produk & Margin Keuntungan</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white border-b text-sm text-slate-500">
            <tr>
              <th className="py-4 px-4 font-semibold">Foto</th>
              <th className="py-4 px-4 font-semibold">Kategori</th>
              <th className="py-4 px-4 font-semibold">Nama Produk</th>
              <th className="py-4 px-4 font-semibold text-right">Harga Beli</th>
              <th className="py-4 px-4 font-semibold text-right">Harga Jual</th>
              <th className="py-4 px-4 font-semibold text-right text-green-600">Margin</th>
              <th className="py-4 px-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {daftarProduk.length > 0 ? daftarProduk.map(prod => {
              const margin = (prod.harga_jual || 0) - (prod.harga_beli || 0);
              return (
              <tr key={prod.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  {prod.foto_url ? <img src={prod.foto_url} className="w-12 h-12 rounded-lg object-cover border" /> : <div className="w-12 h-12 rounded-lg bg-slate-100 border flex items-center justify-center"><ImageIcon className="text-slate-400" size={20} /></div>}
                </td>
                <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${prod.kategori === 'LPG' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{prod.kategori}</span></td>
                <td className="py-3 px-4 font-medium text-slate-800">
                  {prod.nama_produk}
                  {prod.kategori === 'LPG' && <span className="block text-[10px] text-slate-500">Tabung: {formatRupiah(prod.harga_tabung || 0)}</span>}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600">{formatRupiah(prod.harga_beli || 0)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{formatRupiah(prod.harga_jual)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-green-600">{formatRupiah(margin)}</td>
                <td className="py-3 px-4 text-center"><button onClick={() => handleHapus(prod.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></td>
              </tr>
            )}) : <tr><td colSpan="7" className="py-8 text-center text-slate-500">Belum ada produk NFR.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}