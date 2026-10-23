// src/pages/PengaturanSistem.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Save, Plus, Trash2, Upload, Image as ImageIcon, Fuel, ShoppingBag } from 'lucide-react';

export default function PengaturanSistem() {
  const [activeTab, setActiveTab] = useState('profil'); // 'profil', 'shift', 'produk'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notif, setNotif] = useState('');

  // State Profil
  const [profil, setProfil] = useState({ nama_spbu: '', nomor_izin: '', alamat: '', telepon: '', email: '' });

  // State Shift
  const [daftarShift, setDaftarShift] = useState([]);
  const [shiftBaru, setShiftBaru] = useState({ nama_shift: '', jam_kerja: '' });

  // State Produk NFR
  const [daftarProduk, setDaftarProduk] = useState([]);
  const [produkBaru, setProdukBaru] = useState({ kategori: 'LPG', nama_produk: '', harga_jual: '' });
  const [displayHargaProduk, setDisplayHargaProduk] = useState('');
  const [fileFotoProduk, setFileFotoProduk] = useState(null);
  const [previewFotoProduk, setPreviewFotoProduk] = useState('');
  const [isUploadingProduk, setIsUploadingProduk] = useState(false);
  const fileInputRefProduk = useRef(null);

  // Ambil Data
  const fetchData = async () => {
    setIsLoading(true);
    
    // Profil
    const { data: dataProfil } = await supabase.from('profil_spbu').select('*').eq('id', 1).single();
    if (dataProfil) setProfil(dataProfil);

    // Shift
    const { data: dataShift } = await supabase.from('pengaturan_shift').select('*').order('id');
    if (dataShift) setDaftarShift(dataShift);

    // Produk NFR
    const { data: dataProduk } = await supabase.from('master_produk_nfr').select('*').order('id', { ascending: false });
    if (dataProduk) setDaftarProduk(dataProduk);

    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Simpan Profil
  const handleSimpanProfil = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await supabase.from('profil_spbu').update({
      nama_spbu: profil.nama_spbu, nomor_izin: profil.nomor_izin, alamat: profil.alamat, telepon: profil.telepon, email: profil.email
    }).eq('id', 1);
    setIsSaving(false);
    setNotif('Profil SPBU berhasil disimpan!'); setTimeout(() => setNotif(''), 3000);
  };

  // Shift
  const handleTambahShift = async () => {
    if (!shiftBaru.nama_shift || !shiftBaru.jam_kerja) return alert('Lengkapi data shift!');
    await supabase.from('pengaturan_shift').insert([shiftBaru]);
    const { data } = await supabase.from('pengaturan_shift').select('*').order('id');
    setDaftarShift(data);
    setShiftBaru({ nama_shift: '', jam_kerja: '' });
  };
  const handleHapusShift = async (id) => {
    if (!window.confirm('Hapus shift ini?')) return;
    await supabase.from('pengaturan_shift').delete().eq('id', id);
    setDaftarShift(daftarShift.filter(s => s.id !== id));
  };

  // Produk NFR
  const handleHargaProdukChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setProdukBaru({ ...produkBaru, harga_jual: rawValue });
    setDisplayHargaProduk(rawValue ? formatRupiah(rawValue) : '');
  };

  const handleFotoProdukChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileFotoProduk(file);
      setPreviewFotoProduk(URL.createObjectURL(file));
    }
  };

  const handleTambahProduk = async (e) => {
    e.preventDefault();
    if (!produkBaru.nama_produk || !produkBaru.harga_jual) return alert('Lengkapi Nama dan Harga Produk!');
    
    setIsUploadingProduk(true);
    let fotoUrl = '';

    // Upload Foto jika ada
    if (fileFotoProduk) {
      const fileExt = fileFotoProduk.name.split('.').pop();
      const fileName = `${Date.now()}_${produkBaru.nama_produk.replace(/\s+/g, '_')}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('foto_produk').upload(fileName, fileFotoProduk);
      
      if (uploadError) {
        alert('Gagal upload foto: ' + uploadError.message);
        setIsUploadingProduk(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('foto_produk').getPublicUrl(fileName);
      fotoUrl = publicUrlData.publicUrl;
    }

    // Simpan ke Database
    const { error } = await supabase.from('master_produk_nfr').insert([{
      kategori: produkBaru.kategori,
      nama_produk: produkBaru.nama_produk.toUpperCase(),
      harga_jual: parseFloat(produkBaru.harga_jual),
      foto_url: fotoUrl
    }]);

    if (error) alert('Gagal simpan produk: ' + error.message);
    else {
      setProdukBaru({ kategori: 'LPG', nama_produk: '', harga_jual: '' });
      setDisplayHargaProduk('');
      setFileFotoProduk(null);
      setPreviewFotoProduk('');
      fetchData();
    }
    setIsUploadingProduk(false);
  };

  const handleHapusProduk = async (id) => {
    if (!window.confirm('Hapus produk ini?')) return;
    await supabase.from('master_produk_nfr').delete().eq('id', id);
    fetchData();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Pengaturan Sistem</h1>
        <p className="text-slate-500 mt-1">Kelola profil SPBU, shift, dan produk NFR.</p>
      </div>

      {notif && <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded shadow-sm">{notif}</div>}

      {/* TAB NAVIGATION */}
      <div className="flex border-b mb-6 border-slate-200">
        <button type="button" onClick={() => setActiveTab('profil')} className={`py-3 px-6 font-medium text-sm border-b-2 ${activeTab === 'profil' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Profil SPBU</button>
        <button type="button" onClick={() => setActiveTab('shift')} className={`py-3 px-6 font-medium text-sm border-b-2 ${activeTab === 'shift' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Shift Operasional</button>
        <button type="button" onClick={() => setActiveTab('produk')} className={`py-3 px-6 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'produk' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><ShoppingBag size={18}/> Produk NFR (LPG & Oli)</button>
      </div>

      {/* TAB PROFIL */}
      {activeTab === 'profil' && (
        <form onSubmit={handleSimpanProfil} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama SPBU</label><input type="text" value={profil.nama_spbu || ''} onChange={(e) => setProfil({...profil, nama_spbu: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Badan Hukum / Izin</label><input type="text" value={profil.nomor_izin || ''} onChange={(e) => setProfil({...profil, nomor_izin: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label><textarea value={profil.alamat || ''} onChange={(e) => setProfil({...profil, alamat: e.target.value})} rows="2" className="w-full px-4 py-2 border rounded-xl"></textarea></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label><input type="text" value={profil.telepon || ''} onChange={(e) => setProfil({...profil, telepon: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={profil.email || ''} onChange={(e) => setProfil({...profil, email: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700">{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Simpan Profil</button>
          </div>
        </form>
      )}

      {/* TAB SHIFT */}
      {activeTab === 'shift' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="space-y-3 mb-6">
            {daftarShift.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div><span className="font-semibold text-slate-700">{shift.nama_shift}:</span> <span className="text-slate-600">{shift.jam_kerja}</span></div>
                <button onClick={() => handleHapusShift(shift.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 items-end bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex-1"><label className="block text-xs font-medium text-slate-600 mb-1">Nama Shift</label><input type="text" value={shiftBaru.nama_shift} onChange={(e) => setShiftBaru({...shiftBaru, nama_shift: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: Shift 1" /></div>
            <div className="flex-1"><label className="block text-xs font-medium text-slate-600 mb-1">Jam Kerja</label><input type="text" value={shiftBaru.jam_kerja} onChange={(e) => setShiftBaru({...shiftBaru, jam_kerja: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: 08:00 - 16:00" /></div>
            <button onClick={handleTambahShift} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Tambah</button>
          </div>
        </div>
      )}

      {/* TAB PRODUK NFR */}
      {activeTab === 'produk' && (
        <div className="space-y-6">
          {/* Form Tambah Produk */}
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

          {/* Tabel Daftar Produk */}
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
      )}
    </div>
  );
}