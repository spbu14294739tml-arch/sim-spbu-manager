// src/pages/PengaturanSistem.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Save, Plus, Trash2, Upload, Image as ImageIcon, Fuel, ShoppingBag, Droplet, RefreshCw } from 'lucide-react';

export default function PengaturanSistem() {
  const [activeTab, setActiveTab] = useState('profil'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notif, setNotif] = useState('');

  const [profil, setProfil] = useState({ nama_spbu: '', nomor_izin: '', alamat: '', telepon: '', email: '' });
  const [daftarShift, setDaftarShift] = useState([]);
  const [shiftBaru, setShiftBaru] = useState({ nama_shift: '', jam_kerja: '' });
  const [daftarProduk, setDaftarProduk] = useState([]);
  const [produkBaru, setProdukBaru] = useState({ kategori: 'LPG', nama_produk: '', harga_jual: '' });
  const [displayHargaProduk, setDisplayHargaProduk] = useState('');
  const [fileFotoProduk, setFileFotoProduk] = useState(null);
  const [previewFotoProduk, setPreviewFotoProduk] = useState('');
  const [isUploadingProduk, setIsUploadingProduk] = useState(false);
  const fileInputRefProduk = useRef(null);
  
  // State Harga BBM & Upload Logo
  const [daftarHargaBBM, setDaftarHargaBBM] = useState([]);
  const [uploadingLogoId, setUploadingLogoId] = useState(null);

  // State Stok Tangki (BARU)
  const [daftarTangki, setDaftarTangki] = useState([]);
  const [editingTangkiId, setEditingTangkiId] = useState(null);
  const [stokBaru, setStokBaru] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data: dataProfil } = await supabase.from('profil_spbu').select('*').eq('id', 1).single();
    if (dataProfil) setProfil(dataProfil);

    const { data: dataShift } = await supabase.from('pengaturan_shift').select('*').order('id');
    if (dataShift) setDaftarShift(dataShift);

    const { data: dataProduk } = await supabase.from('master_produk_nfr').select('*').order('id', { ascending: false });
    if (dataProduk) setDaftarProduk(dataProduk);

    const { data: dataHargaBBM } = await supabase.from('master_produk_bbm').select('*').order('id');
    if (dataHargaBBM) setDaftarHargaBBM(dataHargaBBM);

    const { data: dataTangki } = await supabase.from('stok_tangki').select('*').order('nomor_tangki');
    if (dataTangki) setDaftarTangki(dataTangki);

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

  // Update Harga BBM
  const handleUpdateHargaBBM = async (id, hargaBaru) => {
    const { error } = await supabase.from('master_produk_bbm').update({ harga_per_liter: parseFloat(hargaBaru) }).eq('id', id);
    if (error) alert('Gagal update harga: ' + error.message);
    else { setNotif('Harga BBM berhasil diupdate!'); setTimeout(() => setNotif(''), 3000); fetchData(); }
  };

  // Upload Logo BBM
  const handleLogoBBMUpload = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogoId(id);
    const fileExt = file.name.split('.').pop();
    const fileName = `bbm_logo_${id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('foto_produk').upload(fileName, file);
    if (uploadError) { alert('Gagal upload logo: ' + uploadError.message); setUploadingLogoId(null); return; }

    const { data: publicUrlData } = supabase.storage.from('foto_produk').getPublicUrl(fileName);
    const { error: updateError } = await supabase.from('master_produk_bbm').update({ logo_url: publicUrlData.publicUrl }).eq('id', id);
    
    if (updateError) alert('Gagal simpan URL logo: ' + updateError.message);
    else { fetchData(); setNotif('Logo BBM berhasil diupdate!'); setTimeout(() => setNotif(''), 3000); }
    setUploadingLogoId(null);
  };

  // Update Stok Tangki
  const handleUpdateStokTangki = async (id) => {
    if (!stokBaru && stokBaru !== 0) return alert('Masukkan jumlah stok baru!');
    const { error } = await supabase.from('stok_tangki').update({ stok_saat_ini: parseFloat(stokBaru), updated_at: new Date() }).eq('id', id);
    if (error) alert('Gagal update stok: ' + error.message);
    else { setNotif('Stok tangki berhasil diupdate!'); setTimeout(() => setNotif(''), 3000); setEditingTangkiId(null); setStokBaru(''); fetchData(); }
  };

  // Shift & Produk NFR (Sama seperti sebelumnya)
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

    const { error } = await supabase.from('master_produk_nfr').insert([{
      kategori: produkBaru.kategori, nama_produk: produkBaru.nama_produk.toUpperCase(), harga_jual: parseFloat(produkBaru.harga_jual), foto_url: fotoUrl
    }]);

    if (error) alert('Gagal simpan produk: ' + error.message);
    else {
      setProdukBaru({ kategori: 'LPG', nama_produk: '', harga_jual: '' }); setDisplayHargaProduk('');
      setFileFotoProduk(null); setPreviewFotoProduk(''); fetchData();
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
        <p className="text-slate-500 mt-1">Kelola profil SPBU, shift, produk, dan stok tangki.</p>
      </div>

      {notif && <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded shadow-sm">{notif}</div>}

      <div className="flex flex-wrap border-b mb-6 border-slate-200">
        <button type="button" onClick={() => setActiveTab('profil')} className={`py-3 px-6 font-medium text-sm border-b-2 ${activeTab === 'profil' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Profil SPBU</button>
        <button type="button" onClick={() => setActiveTab('shift')} className={`py-3 px-6 font-medium text-sm border-b-2 ${activeTab === 'shift' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Shift Operasional</button>
        <button type="button" onClick={() => setActiveTab('produk')} className={`py-3 px-6 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'produk' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><ShoppingBag size={18}/> Produk NFR</button>
        <button type="button" onClick={() => setActiveTab('harga_bbm')} className={`py-3 px-6 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'harga_bbm' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Fuel size={18}/> Harga & Logo BBM</button>
        <button type="button" onClick={() => setActiveTab('stok_tangki')} className={`py-3 px-6 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'stok_tangki' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Droplet size={18}/> Stok Tangki</button>
      </div>

      {/* TAB PROFIL, SHIFT, PRODUK (Sama seperti sebelumnya) */}
      {activeTab === 'profil' && ( /* ... form profil ... */ <form onSubmit={handleSimpanProfil} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Nama SPBU</label><input type="text" value={profil.nama_spbu || ''} onChange={(e) => setProfil({...profil, nama_spbu: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Badan Hukum / Izin</label><input type="text" value={profil.nomor_izin || ''} onChange={(e) => setProfil({...profil, nomor_izin: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div><div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label><textarea value={profil.alamat || ''} onChange={(e) => setProfil({...profil, alamat: e.target.value})} rows="2" className="w-full px-4 py-2 border rounded-xl"></textarea></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label><input type="text" value={profil.telepon || ''} onChange={(e) => setProfil({...profil, telepon: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={profil.email || ''} onChange={(e) => setProfil({...profil, email: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div></div><div className="mt-6 flex justify-end"><button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700">{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Simpan Profil</button></div></form>) }

      {activeTab === 'shift' && ( /* ... form shift ... */ <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"><div className="space-y-3 mb-6">{daftarShift.map((shift) => (<div key={shift.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200"><div><span className="font-semibold text-slate-700">{shift.nama_shift}:</span> <span className="text-slate-600">{shift.jam_kerja}</span></div><button onClick={() => handleHapusShift(shift.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18} /></button></div>))}</div><div className="flex gap-3 items-end bg-blue-50 p-4 rounded-lg border border-blue-100"><div className="flex-1"><label className="block text-xs font-medium text-slate-600 mb-1">Nama Shift</label><input type="text" value={shiftBaru.nama_shift} onChange={(e) => setShiftBaru({...shiftBaru, nama_shift: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: Shift 1" /></div><div className="flex-1"><label className="block text-xs font-medium text-slate-600 mb-1">Jam Kerja</label><input type="text" value={shiftBaru.jam_kerja} onChange={(e) => setShiftBaru({...shiftBaru, jam_kerja: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: 08:00 - 16:00" /></div><button onClick={handleTambahShift} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Tambah</button></div></div>) }

      {activeTab === 'produk' && ( /* ... form produk NFR ... */ <div className="space-y-6"><div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"><h2 className="text-lg font-bold text-slate-800 mb-4">Tambah Produk NFR Baru</h2><form onSubmit={handleTambahProduk} className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label><select value={produkBaru.kategori} onChange={(e) => setProdukBaru({...produkBaru, kategori: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white"><option value="LPG">LPG</option><option value="OLI">Oli / Pelumas</option></select></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label><input type="text" required value={produkBaru.nama_produk} onChange={(e) => setProdukBaru({...produkBaru, nama_produk: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="Cth: LPG 3 KG / Mesran" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Harga Jual (Rp)</label><input type="text" required value={displayHargaProduk} onChange={handleHargaProdukChange} className="w-full px-4 py-2 border rounded-xl" placeholder="Rp 0" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Foto Produk (Opsional)</label><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">{previewFotoProduk ? <img src={previewFotoProduk} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-400" size={24} />}</div><input type="file" accept="image/*" ref={fileInputRefProduk} onChange={handleFotoProdukChange} className="hidden" /><button type="button" onClick={() => fileInputRefProduk.current.click()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><Upload size={16} /> Pilih Foto</button></div></div><div className="md:col-span-2 flex justify-end mt-2"><button type="submit" disabled={isUploadingProduk} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">{isUploadingProduk ? <><Loader2 className="animate-spin" size={18} /> Menyimpan...</> : <><Plus size={18} /> Tambah Produk</>}</button></div></form></div><div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b"><tr className="text-slate-500 text-sm"><th className="py-4 px-6 font-semibold">Foto</th><th className="py-4 px-6 font-semibold">Kategori</th><th className="py-4 px-6 font-semibold">Nama Produk</th><th className="py-4 px-6 font-semibold">Harga Jual</th><th className="py-4 px-6 font-semibold text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{daftarProduk.length > 0 ? daftarProduk.map(prod => (<tr key={prod.id} className="hover:bg-slate-50/50"><td className="py-3 px-6">{prod.foto_url ? <img src={prod.foto_url} alt={prod.nama_produk} className="w-12 h-12 rounded-lg object-cover border" /> : <div className="w-12 h-12 rounded-lg bg-slate-100 border flex items-center justify-center"><ImageIcon className="text-slate-400" size={20} /></div>}</td><td className="py-3 px-6"><span className={`px-2 py-1 rounded text-xs font-semibold ${prod.kategori === 'LPG' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{prod.kategori}</span></td><td className="py-3 px-6 font-medium text-slate-800">{prod.nama_produk}</td><td className="py-3 px-6 font-semibold text-green-600">{formatRupiah(prod.harga_jual)}</td><td className="py-3 px-6 text-center"><button onClick={() => handleHapusProduk(prod.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></td></tr>)) : <tr><td colSpan="5" className="py-8 text-center text-slate-500">Belum ada produk NFR.</td></tr>}</tbody></table></div></div>) }

      {activeTab === 'harga_bbm' && ( /* ... form harga bbm ... */ <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"><div className="p-6 border-b border-slate-100 bg-slate-50"><h2 className="text-lg font-bold text-slate-800">Update Harga & Logo BBM</h2><p className="text-sm text-slate-500 mt-1">Perubahan harga di sini akan langsung diterapkan di halaman Kasir.</p></div><table className="w-full text-left"><thead className="bg-white border-b"><tr className="text-slate-500 text-sm"><th className="py-4 px-6 font-semibold">Logo</th><th className="py-4 px-6 font-semibold">Jenis BBM</th><th className="py-4 px-6 font-semibold">Harga Per Liter</th><th className="py-4 px-6 font-semibold text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{daftarHargaBBM.map((bbm) => {let hargaState = bbm.harga_per_liter; return (<tr key={bbm.id} className="hover:bg-slate-50/50"><td className="py-4 px-6"><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">{bbm.logo_url ? <img src={bbm.logo_url} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-400" size={24} />}</div><input type="file" accept="image/*" id={`upload-bbm-${bbm.id}`} className="hidden" onChange={(e) => handleLogoBBMUpload(e, bbm.id)} /><label htmlFor={`upload-bbm-${bbm.id}`} className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 flex items-center gap-1">{uploadingLogoId === bbm.id ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />} Upload</label></div></td><td className="py-4 px-6 font-bold text-blue-700">{bbm.jenis_bbm}</td><td className="py-4 px-6"><input type="number" defaultValue={hargaState} onBlur={(e) => handleUpdateHargaBBM(bbm.id, e.target.value)} className="w-40 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800" /></td><td className="py-4 px-6 text-center text-xs text-slate-500 italic">Klik di luar kotak harga untuk simpan otomatis</td></tr>);})}</tbody></table></div>) }

      {/* TAB STOK TANGKI (BARU) */}
      {activeTab === 'stok_tangki' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Monitor Stok Tangki Pendam</h2>
              <p className="text-sm text-slate-500 mt-1">Update stok setiap kali ada pengisian ulang dari truk tangki.</p>
            </div>
            <button onClick={fetchData} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><RefreshCw size={16} /> Refresh</button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {daftarTangki.map((tangki) => {
              const persentase = (tangki.stok_saat_ini / tangki.kapasitas_maksimal) * 100;
              const isLow = persentase < 30;
              const isMedium = persentase >= 30 && persentase < 60;

              return (
                <div key={tangki.id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-2 h-full ${isLow ? 'bg-red-500' : isMedium ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  
                  <div className="flex justify-between items-start mb-4 ml-2">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{tangki.nomor_tangki}</h3>
                      <p className="text-blue-600 font-semibold text-sm">{tangki.jenis_bbm}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Stok Saat Ini</p>
                      <p className={`font-bold text-xl ${isLow ? 'text-red-600' : isMedium ? 'text-yellow-600' : 'text-green-600'}`}>{tangki.stok_saat_ini} L</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="ml-2 mb-4">
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : isMedium ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${persentase}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800">
                        {persentase.toFixed(1)}% dari {tangki.kapasitas_maksimal} L
                      </div>
                    </div>
                  </div>

                  {/* Form Update Stok */}
                  <div className="ml-2 flex items-center gap-2 mt-4">
                    {editingTangkiId === tangki.id ? (
                      <>
                        <input 
                          type="number" 
                          value={stokBaru} 
                          onChange={(e) => setStokBaru(e.target.value)} 
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" 
                          placeholder="Stok baru (L)"
                        />
                        <button onClick={() => handleUpdateStokTangki(tangki.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Simpan</button>
                        <button onClick={() => setEditingTangkiId(null)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300">Batal</button>
                      </>
                    ) : (
                      <button onClick={() => { setEditingTangkiId(tangki.id); setStokBaru(tangki.stok_saat_ini); }} className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                        Update Stok
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}