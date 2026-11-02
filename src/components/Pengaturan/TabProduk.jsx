import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { Loader2, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

export default function TabProduk() {
  const [daftarProduk, setDaftarProduk] = useState([]);
  const [produkBaru, setProdukBaru] = useState({ kategori: 'LPG', nama_produk: '', harga_jual: '' });
  const [displayHargaProduk, setDisplayHargaProduk] = useState('');
  const [fileFotoProduk, setFileFotoProduk] = useState(null);
  const [previewFotoProduk, setPreviewFotoProduk] = useState('');
  const [isUploadingProduk, setIsUploadingProduk] = useState(false);
  const fileInputRefProduk = useRef(null);

  const fetchData = async () => {
    const { data } = await supabase.from('master_produk_nfr').select('*').order('id', { ascending: false });
    if (data) setDaftarProduk(data);
  };
  useEffect(() => { fetchData(); }, []);

  const handleHargaProdukChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setProdukBaru({ ...produkBaru, harga_jual: rawValue });
    setDisplayHargaProduk(rawValue ? formatRupiah(rawValue) : '');
  };

  const handleFotoProdukChange = (e) => {
    const file = e.target.files[0];
    if (file) { setFileFotoProduk(file); setPreviewFotoProduk(URL.createObjectURL(file)); }
  };

  const handleTambahProduk = async (e) => {
    e.preventDefault();
    if (!produkBaru.nama_produk || !produkBaru.harga_jual) return alert('Lengkapi Nama dan Harga Produk!');
    if (isUploadingProduk) return;
    setIsUploadingProduk(true);
    let fotoUrl = '';

    if (fileFotoProduk) {
      const fileExt = fileFotoProduk.name.split('.').pop();
      const fileName = `${Date.now()}_${produkBaru.nama_produk.replace(/\s+/g, '_')}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('foto_produk').upload(fileName, fileFotoProduk);
      if (uploadError) { alert('Gagal upload foto: ' + uploadError.message); setIsUploadingProduk(false); return; }
      const { data: publicUrlData } = supabase.storage.from('foto_produk').getPublicUrl(fileName);
      fotoUrl = publicUrlData.publicUrl;
    }

    await supabase.from('master_produk_nfr').insert([{
      kategori: produkBaru.kategori, nama_produk: produkBaru.nama_produk.toUpperCase(), harga_jual: parseFloat(produkBaru.harga_jual), foto_url: fotoUrl
    }]);

    setProdukBaru({ kategori: 'LPG', nama_produk: '', harga_jual: '' }); setDisplayHargaProduk('');
    setFileFotoProduk(null); setPreviewFotoProduk(''); fetchData();
    setIsUploadingProduk(false);
  };

  const handleHapusProduk = async (id) => {
    if (!window.confirm('Hapus produk ini?')) return;
    await supabase.from('master_produk_nfr').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Tambah Produk NFR Baru</h2>
        <form onSubmit={handleTambahProduk} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <select value={produkBaru.kategori} onChange={(e) => setProdukBaru({...produkBaru, kategori: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white">
              <option value="LPG">LPG</option>
              <option value="OLI">Oli / Pelumas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label>
            <input type="text" required value={produkBaru.nama_produk} onChange={(e) => setProdukBaru({...produkBaru, nama_produk: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="Cth: LPG 3 KG / Mesran" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Harga Jual (Rp)</label>
            <input type="text" required value={displayHargaProduk} onChange={handleHargaProdukChange} className="w-full px-4 py-2 border rounded-xl" placeholder="Rp 0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Foto Produk (Opsional)</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                {previewFotoProduk ? <img src={previewFotoProduk} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-400" size={24} />}
              </div>
              <input type="file" accept="image/*" ref={fileInputRefProduk} onChange={handleFotoProdukChange} className="hidden" />
              <button type="button" onClick={() => fileInputRefProduk.current.click()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><Upload size={16} /> Pilih Foto</button>
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end mt-2">
            <button type="submit" disabled={isUploadingProduk} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
              {isUploadingProduk ? <><Loader2 className="animate-spin" size={18} /> Menyimpan...</> : <><Plus size={18} /> Tambah Produk</>}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr className="text-slate-500 text-sm">
              <th className="py-4 px-6 font-semibold">Foto</th>
              <th className="py-4 px-6 font-semibold">Kategori</th>
              <th className="py-4 px-6 font-semibold">Nama Produk</th>
              <th className="py-4 px-6 font-semibold">Harga Jual</th>
              <th className="py-4 px-6 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {daftarProduk.length > 0 ? daftarProduk.map(prod => (
              <tr key={prod.id} className="hover:bg-slate-50/50">
                <td className="py-3 px-6">
                  {prod.foto_url ? <img src={prod.foto_url} alt={prod.nama_produk} className="w-12 h-12 rounded-lg object-cover border" /> : <div className="w-12 h-12 rounded-lg bg-slate-100 border flex items-center justify-center"><ImageIcon className="text-slate-400" size={20} /></div>}
                </td>
                <td className="py-3 px-6"><span className={`px-2 py-1 rounded text-xs font-semibold ${prod.kategori === 'LPG' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{prod.kategori}</span></td>
                <td className="py-3 px-6 font-medium text-slate-800">{prod.nama_produk}</td>
                <td className="py-3 px-6 font-semibold text-green-600">{formatRupiah(prod.harga_jual)}</td>
                <td className="py-3 px-6 text-center"><button onClick={() => handleHapusProduk(prod.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></td>
              </tr>
            )) : <tr><td colSpan="5" className="py-8 text-center text-slate-500">Belum ada produk NFR.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}