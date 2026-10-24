// src/pages/PengaturanSistem.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Save, Plus, Trash2, Upload, Image as ImageIcon, Fuel, ShoppingBag, Droplet, RefreshCw, Edit } from 'lucide-react';

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

  // State Stok Tangki
  const [daftarTangki, setDaftarTangki] = useState([]);
  const [editingTangkiId, setEditingTangkiId] = useState(null);
  const [stokBaru, setStokBaru] = useState('');
  const [kapasitasBaru, setKapasitasBaru] = useState('');
  const [jenisBBMBaru, setJenisBBMBaru] = useState('');

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

  // Update Stok & Kapasitas Tangki
  const handleUpdateTangki = async (id) => {
    if (!stokBaru && stokBaru !== 0) return alert('Masukkan jumlah stok baru!');
    if (!kapasitasBaru) return alert('Masukkan kapasitas maksimal!');
    
    const { error } = await supabase.from('stok_tangki').update({ 
      stok_saat_ini: parseFloat(stokBaru), 
      kapasitas_maksimal: parseFloat(kapasitasBaru),
      jenis_bbm: jenisBBMBaru,
      updated_at: new Date() 
    }).eq('id', id);
    
    if (error) alert('Gagal update tangki: ' + error.message);
    else { 
      setNotif('Data tangki berhasil diupdate!'); 
      setTimeout(() => setNotif(''), 3000); 
      setEditingTangkiId(null); 
      setStokBaru(''); 
      setKapasitasBaru('');
      setJenisBBMBaru('');
      fetchData(); 
    }
  };

  // Shift & Produk NFR
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

      {/* ... TAB PROFIL, SHIFT, PRODUK, HARGA BBM (Sama seperti sebelumnya, disingkat) ... */}

      {/* TAB STOK TANGKI (DENGAN EDIT KAPASITAS) */}
      {activeTab === 'stok_tangki' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Monitor Stok Tangki Pendam</h2>
              <p className="text-sm text-slate-500 mt-1">Update stok dan kapasitas maksimal tangki.</p>
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

                  <div className="ml-2 mb-4">
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative">
                      <div className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : isMedium ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${persentase}%` }}></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800">
                        {persentase.toFixed(1)}% dari {tangki.kapasitas_maksimal} L
                      </div>
                    </div>
                  </div>

                  <div className="ml-2 mt-4">
                    {editingTangkiId === tangki.id ? (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Jenis BBM</label>
                            <select value={jenisBBMBaru} onChange={(e) => setJenisBBMBaru(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm">
                              {['PERTALITE', 'PERTAMAX', 'PERTAMAX TURBO', 'BIOSOLAR', 'DEXLITE'].map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Kapasitas (L)</label>
                            <input type="number" value={kapasitasBaru} onChange={(e) => setKapasitasBaru(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Stok Saat Ini (L)</label>
                          <input type="number" value={stokBaru} onChange={(e) => setStokBaru(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                          <button onClick={() => setEditingTangkiId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border rounded-lg">Batal</button>
                          <button onClick={() => handleUpdateTangki(tangki.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Simpan</button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { 
                          setEditingTangkiId(tangki.id); 
                          setStokBaru(tangki.stok_saat_ini); 
                          setKapasitasBaru(tangki.kapasitas_maksimal);
                          setJenisBBMBaru(tangki.jenis_bbm);
                        }} 
                        className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                      >
                        <Edit size={16} /> Edit Tangki
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