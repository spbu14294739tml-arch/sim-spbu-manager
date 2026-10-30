// src/pages/PengaturanSistem.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { 
  Loader2, Save, Plus, Trash2, Upload, Image as ImageIcon, Fuel, ShoppingBag, 
  Droplet, RefreshCw, Edit, History, ArrowUp, ArrowDown, Minus, Briefcase, X, Printer, Hash, Edit2 
} from 'lucide-react';
import KopSurat from '../components/KopSurat';

export default function PengaturanSistem() {
  const [activeTab, setActiveTab] = useState('profil'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notif, setNotif] = useState('');

  // State Profil
  const [profil, setProfil] = useState({ nama_spbu: '', nomor_izin: '', alamat: '', telepon: '', email: '' });
  
  // State Shift
  const [daftarShift, setDaftarShift] = useState([]);
  const [shiftBaru, setShiftBaru] = useState({ nama_shift: '', jam_kerja: '' });
  
  // State Jabatan
  const [daftarJabatan, setDaftarJabatan] = useState([]);
  const [jabatanBaru, setJabatanBaru] = useState('');

  // State Kode Akun (Revisi: Pengelompokan Manual)
  const [daftarKodeAkun, setDaftarKodeAkun] = useState([]);
  const [kodeAkunBaru, setKodeAkunBaru] = useState({ 
    kode_reff: '', 
    nama_transaksi: '', 
    kelompok: '', 
    uraian_kelompok: '', 
    mutasi: 'DEBET' 
  });
  const [editingKodeAkunId, setEditingKodeAkunId] = useState(null);

  // State Produk NFR
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
  
  // State Edit Harga Inline
  const [editingHargaId, setEditingHargaId] = useState(null);
  const [hargaBaruInput, setHargaBaruInput] = useState('');
  const [tanggalEfektif, setTanggalEfektif] = useState(new Date().toISOString().split('T')[0]);
  const [statusHarga, setStatusHarga] = useState('TETAP');
  const [selisihHarga, setSelisihHarga] = useState(0);

  // State MODAL RIWAYAT HARGA
  const [showRiwayatModal, setShowRiwayatModal] = useState(false);
  const [riwayatBulan, setRiwayatBulan] = useState(new Date().getMonth() + 1);
  const [riwayatTahun, setRiwayatTahun] = useState(new Date().getFullYear());
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [isFetchingRiwayat, setIsFetchingRiwayat] = useState(false);

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

    const { data: dataJabatan } = await supabase.from('master_jabatan').select('*').order('nama_jabatan');
    if (dataJabatan) setDaftarJabatan(dataJabatan);

    const { data: dataKodeAkun } = await supabase.from('master_kode_akun').select('*').order('kelompok').order('kode_reff');
    if (dataKodeAkun) setDaftarKodeAkun(dataKodeAkun);

    const { data: dataProduk } = await supabase.from('master_produk_nfr').select('*').order('id', { ascending: false });
    if (dataProduk) setDaftarProduk(dataProduk);

    const { data: dataHargaBBM } = await supabase.from('master_produk_bbm').select('*').order('id');
    if (dataHargaBBM) setDaftarHargaBBM(dataHargaBBM);

    const { data: dataTangki } = await supabase.from('stok_tangki').select('*').order('nomor_tangki');
    if (dataTangki) setDaftarTangki(dataTangki);

    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // FETCH RIWAYAT HARGA
  const fetchRiwayatHarga = async () => {
    setIsFetchingRiwayat(true);
    const startDate = `${riwayatTahun}-${String(riwayatBulan).padStart(2, '0')}-01`;
    const endDate = new Date(riwayatTahun, riwayatBulan, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('riwayat_harga_bbm')
      .select('*')
      .gte('tanggal_efektif', startDate)
      .lte('tanggal_efektif', endDate)
      .order('created_at', { ascending: false });

    if (data) setDataRiwayat(data);
    setIsFetchingRiwayat(false);
  };

  useEffect(() => {
    if (showRiwayatModal) fetchRiwayatHarga();
  }, [showRiwayatModal, riwayatBulan, riwayatTahun]);

  // Simpan Profil
  const handleSimpanProfil = async (e) => {
    e.preventDefault();
    if (isSaving) return; // Cegah double klik
    setIsSaving(true);
    await supabase.from('profil_spbu').update({
      nama_spbu: profil.nama_spbu, nomor_izin: profil.nomor_izin, alamat: profil.alamat, telepon: profil.telepon, email: profil.email
    }).eq('id', 1);
    setIsSaving(false);
    setNotif('Profil SPBU berhasil disimpan!'); setTimeout(() => setNotif(''), 3000);
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

  // MULAI EDIT HARGA
  const handleMulaiEditHarga = (bbm) => {
    setEditingHargaId(bbm.id);
    setHargaBaruInput(bbm.harga_per_liter.toString());
    setTanggalEfektif(new Date().toISOString().split('T')[0]);
    setStatusHarga('TETAP');
    setSelisihHarga(0);
  };

  // SAAT INPUT HARGA BERUBAH
  const handleHargaInputChange = (e, hargaLama) => {
    const val = e.target.value;
    setHargaBaruInput(val);
    
    const baru = parseFloat(val);
    const lama = parseFloat(hargaLama);
    
    if (!isNaN(baru) && !isNaN(lama)) {
      const diff = baru - lama;
      setSelisihHarga(diff);
      if (diff > 0) setStatusHarga('NAIK');
      else if (diff < 0) setStatusHarga('TURUN');
      else setStatusHarga('TETAP');
    } else {
      setSelisihHarga(0);
      setStatusHarga('TETAP');
    }
  };

  // SIMPAN HARGA & RIWAYAT
  const handleSimpanHarga = async (bbm) => {
    const baru = parseFloat(hargaBaruInput);
    if (isNaN(baru) || baru <= 0) return alert('Harga baru tidak valid!');
    if (isSaving) return; // Cegah double klik

    setIsSaving(true);

    try {
      const { error: errUpdate } = await supabase.from('master_produk_bbm').update({ 
        harga_per_liter: baru,
        tanggal_efektif: tanggalEfektif,
        status_harga: statusHarga,
        selisih_harga: selisihHarga
      }).eq('id', bbm.id);
      
      if (errUpdate) throw new Error('Gagal update harga: ' + errUpdate.message);

      if (baru !== bbm.harga_per_liter) {
        const { error: errRiwayat } = await supabase.from('riwayat_harga_bbm').insert([{
          jenis_bbm: bbm.jenis_bbm,
          harga_lama: bbm.harga_per_liter,
          harga_baru: baru,
          tanggal_efektif: tanggalEfektif,
          selisih: selisihHarga,
          status: statusHarga,
          updated_by: 'Manager Operasional'
        }]);

        if (errRiwayat) throw new Error('Gagal simpan riwayat: ' + errRiwayat.message);
      }

      setEditingHargaId(null);
      setNotif(`Harga ${bbm.jenis_bbm} berhasil diupdate!`);
      setTimeout(() => setNotif(''), 3000);
      fetchData();
      
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update Stok & Kapasitas Tangki
  const handleUpdateTangki = async (id) => {
    if (!stokBaru && stokBaru !== 0) return alert('Masukkan jumlah stok baru!');
    if (!kapasitasBaru) return alert('Masukkan kapasitas maksimal!');
    if (isSaving) return; // Cegah double klik
    
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
      setEditingTangkiId(null); setStokBaru(''); setKapasitasBaru(''); setJenisBBMBaru('');
      fetchData(); 
    }
  };

  // Shift
  const handleTambahShift = async () => {
    if (!shiftBaru.nama_shift || !shiftBaru.jam_kerja) return alert('Lengkapi data shift!');
    if (isSaving) return;
    setIsSaving(true);
    await supabase.from('pengaturan_shift').insert([shiftBaru]);
    const { data } = await supabase.from('pengaturan_shift').select('*').order('id');
    setDaftarShift(data); setShiftBaru({ nama_shift: '', jam_kerja: '' });
    setIsSaving(false);
  };

  const handleHapusShift = async (id) => {
    if (!window.confirm('Hapus shift ini?')) return;
    await supabase.from('pengaturan_shift').delete().eq('id', id);
    setDaftarShift(daftarShift.filter(s => s.id !== id));
  };

  // Jabatan
  const handleTambahJabatan = async () => {
    if (!jabatanBaru) return alert('Masukkan nama jabatan!');
    if (isSaving) return;
    setIsSaving(true);
    const { error } = await supabase.from('master_jabatan').insert([{ nama_jabatan: jabatanBaru.toUpperCase() }]);
    if (error) alert('Gagal tambah jabatan: ' + error.message);
    else {
      const { data } = await supabase.from('master_jabatan').select('*').order('nama_jabatan');
      setDaftarJabatan(data); setJabatanBaru('');
      setNotif('Jabatan berhasil ditambahkan!'); setTimeout(() => setNotif(''), 3000);
    }
    setIsSaving(false);
  };

  const handleHapusJabatan = async (id) => {
    if (!window.confirm('Hapus jabatan ini?')) return;
    await supabase.from('master_jabatan').delete().eq('id', id);
    setDaftarJabatan(daftarJabatan.filter(j => j.id !== id));
  };

  // === HANDLERS KODE AKUN ===
  const handleSimpanKodeAkun = async () => {
    if (!kodeAkunBaru.kode_reff || !kodeAkunBaru.nama_transaksi) return alert('Lengkapi Kode Reff dan Nama Transaksi!');
    if (isSaving) return; // Mencegah DOUBLE KLIK
    setIsSaving(true);

    const payload = {
      kode_reff: kodeAkunBaru.kode_reff.toUpperCase(),
      nama_transaksi: kodeAkunBaru.nama_transaksi.toUpperCase(),
      kelompok: kodeAkunBaru.kelompok,
      uraian_kelompok: kodeAkunBaru.uraian_kelompok,
      mutasi: kodeAkunBaru.mutasi
    };

    if (editingKodeAkunId) {
      const { error } = await supabase.from('master_kode_akun').update(payload).eq('id', editingKodeAkunId);
      if (error) alert('Gagal update: ' + error.message);
      else { setNotif('Kode Akun berhasil diupdate!'); setTimeout(() => setNotif(''), 3000); }
    } else {
      const { error } = await supabase.from('master_kode_akun').insert([payload]);
      if (error) alert('Gagal tambah: ' + error.message);
      else { setNotif('Kode Akun berhasil ditambahkan!'); setTimeout(() => setNotif(''), 3000); }
    }

    setKodeAkunBaru({ kode_reff: '', nama_transaksi: '', kelompok: '', uraian_kelompok: '', mutasi: 'DEBET' });
    setEditingKodeAkunId(null);
    fetchData();
    setIsSaving(false);
  };

  const handleEditKodeAkun = (kode) => {
    setEditingKodeAkunId(kode.id);
    setKodeAkunBaru({ 
      kode_reff: kode.kode_reff, 
      nama_transaksi: kode.nama_transaksi, 
      kelompok: kode.kelompok || '',
      uraian_kelompok: kode.uraian_kelompok || '',
      mutasi: kode.mutasi || 'DEBET'
    });
  };

  const handleHapusKodeAkun = async (id) => {
    if (!window.confirm('Hapus Kode Akun ini?')) return;
    await supabase.from('master_kode_akun').delete().eq('id', id);
    fetchData();
  };

  // Produk NFR
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
    <>
      {/* MODAL RIWAYAT HARGA */}
      {showRiwayatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:static print:block print:p-0 print:bg-transparent print:backdrop-blur-none">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:max-h-none print:shadow-none print:rounded-none print:block print:w-full">
            
            <div className="flex justify-between items-center p-5 border-b bg-slate-50 no-print">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History className="text-blue-600"/> Daftar List Perubahan Harga</h2>
                <p className="text-sm text-slate-500 mt-1">Riwayat perubahan harga BBM berdasarkan bulan efektif.</p>
              </div>
              <button onClick={() => setShowRiwayatModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
            </div>

            <div className="p-4 border-b flex gap-4 items-center bg-white no-print">
              <select value={riwayatBulan} onChange={(e) => setRiwayatBulan(Number(e.target.value))} className="px-4 py-2 border border-slate-300 rounded-lg font-medium outline-none focus:ring-2 focus:ring-blue-500">
                {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
              <select value={riwayatTahun} onChange={(e) => setRiwayatTahun(Number(e.target.value))} className="px-4 py-2 border border-slate-300 rounded-lg font-medium outline-none focus:ring-2 focus:ring-blue-500">
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
              <button onClick={() => window.print()} className="ml-auto bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm">
                <Printer size={18}/> Cetak List
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-white print:overflow-visible print:p-0">
              
              <div className="hidden print:block mb-6"><KopSurat /></div>

              <div className="hidden print:block text-center mb-6">
                <h2 className="text-lg font-bold text-black uppercase underline">LAPORAN PERUBAHAN HARGA BBM</h2>
                <p className="text-sm text-black mt-1">Periode: {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][riwayatBulan-1]} {riwayatTahun}</p>
              </div>

              <div className="no-print mb-4">
                <h3 className="font-bold text-slate-800">Daftar List Perubahan Harga untuk Bulan {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][riwayatBulan-1]} {riwayatTahun}</h3>
              </div>

              {isFetchingRiwayat ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
              ) : dataRiwayat.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed">Belum ada perubahan harga di bulan ini.</div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] md:text-xs uppercase print:bg-gray-100 print:text-black">
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-center w-10">No</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black">Tanggal Efektif</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black">Jenis BBM</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-right">Harga Lama</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-right">Harga Baru</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-center">Status</th>
                        <th className="py-3 px-3 border border-slate-200 print:border-black text-right">Selisih (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-black">
                      {dataRiwayat.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50 text-xs md:text-sm print:hover:bg-transparent print:text-[11px]">
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black text-center">{idx + 1}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black font-medium">{new Date(item.tanggal_efektif).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black font-semibold text-slate-800 print:text-black">{item.jenis_bbm}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black text-right font-mono">{formatRupiah(item.harga_lama)}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black text-right font-mono font-bold text-blue-700 print:text-black">{formatRupiah(item.harga_baru)}</td>
                          <td className="py-2.5 px-3 border border-slate-200 print:border-black text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'NAIK' ? 'bg-red-100 text-red-600 print:bg-transparent print:text-black' : 
                              item.status === 'TURUN' ? 'bg-green-100 text-green-600 print:bg-transparent print:text-black' : 'bg-slate-200 text-slate-600 print:bg-transparent print:text-black'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 border border-slate-200 print:border-black text-right font-mono font-medium ${item.selisih > 0 ? 'text-red-600' : 'text-green-600'} print:text-black`}>
                            {item.selisih === 0 ? '-' : formatRupiah(Math.abs(item.selisih))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KONTEN HALAMAN UTAMA */}
      <div className="p-8 max-w-5xl mx-auto print:hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Pengaturan Sistem</h1>
          <p className="text-slate-500 mt-1">Kelola profil SPBU, shift, jabatan, kode akun, produk, dan stok tangki.</p>
        </div>

        {notif && <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded shadow-sm">{notif}</div>}

        {/* TAB NAVIGATION MODERN */}
        <div className="flex flex-wrap gap-2 mb-6 p-2 bg-slate-100 rounded-2xl w-fit">
          <button type="button" onClick={() => setActiveTab('profil')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'profil' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>Profil SPBU</button>
          <button type="button" onClick={() => setActiveTab('shift')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'shift' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>Shift</button>
          <button type="button" onClick={() => setActiveTab('jabatan')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'jabatan' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><Briefcase size={16}/> Jabatan</button>
          <button type="button" onClick={() => setActiveTab('kode_akun')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'kode_akun' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><Hash size={16}/> Kode Akun</button>
          <button type="button" onClick={() => setActiveTab('produk')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'produk' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><ShoppingBag size={16}/> Produk NFR</button>
          <button type="button" onClick={() => setActiveTab('harga_bbm')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'harga_bbm' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><Fuel size={16}/> Harga BBM</button>
          <button type="button" onClick={() => setActiveTab('stok_tangki')} className={`py-2 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'stok_tangki' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><Droplet size={16}/> Stok Tangki</button>
        </div>

        {/* TAB PROFIL */}
        {activeTab === 'profil' && (
          <form onSubmit={handleSimpanProfil} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama SPBU</label>
                <input type="text" value={profil.nama_spbu || ''} onChange={(e) => setProfil({...profil, nama_spbu: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Badan Hukum / Izin</label>
                <input type="text" value={profil.nomor_izin || ''} onChange={(e) => setProfil({...profil, nomor_izin: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                <textarea value={profil.alamat || ''} onChange={(e) => setProfil({...profil, alamat: e.target.value})} rows="2" className="w-full px-4 py-2 border rounded-xl"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label>
                <input type="text" value={profil.telepon || ''} onChange={(e) => setProfil({...profil, telepon: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={profil.email || ''} onChange={(e) => setProfil({...profil, email: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Simpan Profil
              </button>
            </div>
          </form>
        )}

        {/* TAB SHIFT */}
        {activeTab === 'shift' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
            <div className="space-y-3 mb-6">
              {daftarShift.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div><span className="font-semibold text-slate-700">{shift.nama_shift}:</span> <span className="text-slate-600">{shift.jam_kerja}</span></div>
                  <button onClick={() => handleHapusShift(shift.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 items-end bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Nama Shift</label>
                <input type="text" value={shiftBaru.nama_shift} onChange={(e) => setShiftBaru({...shiftBaru, nama_shift: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: Shift 1" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Jam Kerja</label>
                <input type="text" value={shiftBaru.jam_kerja} onChange={(e) => setShiftBaru({...shiftBaru, jam_kerja: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: 08:00 - 16:00" />
              </div>
              <button onClick={handleTambahShift} disabled={isSaving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Tambah
              </button>
            </div>
          </div>
        )}

        {/* TAB JABATAN */}
        {activeTab === 'jabatan' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
            <div className="space-y-3 mb-6">
              {daftarJabatan.map((jabatan) => (
                <div key={jabatan.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">{jabatan.nama_jabatan}</span>
                  <button onClick={() => handleHapusJabatan(jabatan.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 items-end bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Nama Jabatan Baru</label>
                <input type="text" value={jabatanBaru} onChange={(e) => setJabatanBaru(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Cth: SUPERVISOR" />
              </div>
              <button onClick={handleTambahJabatan} disabled={isSaving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Tambah
              </button>
            </div>
          </div>
        )}

        {/* TAB KODE AKUN */}
        {activeTab === 'kode_akun' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row gap-6">
              
              <div className="flex-1 overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b sticky top-0 z-10">
                      <tr className="text-slate-500">
                        <th className="py-3 px-3 font-semibold">Kode Reff</th>
                        <th className="py-3 px-3 font-semibold">Nama Transaksi</th>
                        <th className="py-3 px-3 font-semibold">Kelompok</th>
                        <th className="py-3 px-3 font-semibold text-center">Mutasi</th>
                        <th className="py-3 px-3 font-semibold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {daftarKodeAkun.map((kode) => (
                        <tr key={kode.id} className="hover:bg-slate-50 group">
                          <td className="py-3 px-3 font-mono font-bold text-blue-600">{kode.kode_reff}</td>
                          <td className="py-3 px-3 font-medium text-slate-700">{kode.nama_transaksi}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{kode.kelompok}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${kode.mutasi === 'DEBET' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {kode.mutasi}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {/* TOMBOL SELALU TAMPIL */}
                            <div className="flex justify-center gap-1">
                              <button onClick={() => handleEditKodeAkun(kode)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                              <button onClick={() => handleHapusKodeAkun(kode.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="w-full lg:w-80 shrink-0">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    {editingKodeAkunId ? <><Edit2 size={16}/> Edit Kode Akun</> : <><Plus size={16}/> Tambah Kode Akun</>}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Kode Reff</label>
                      <input type="text" value={kodeAkunBaru.kode_reff} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, kode_reff: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm font-bold" placeholder="Cth: SP 4121" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Transaksi</label>
                      <input type="text" value={kodeAkunBaru.nama_transaksi} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, nama_transaksi: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: Penjualan LPG" />
                    </div>
                    
                    <hr className="border-blue-200 my-2" />
                    
                    <div>
                      <label className="block text-xs font-bold text-blue-700 mb-1">Pengelompokan Akun (Manual)</label>
                      <input type="text" value={kodeAkunBaru.kelompok} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, kelompok: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm" placeholder="Cth: PENDAPATAN" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700 mb-1">Uraian Kelompok</label>
                      <input type="text" value={kodeAkunBaru.uraian_kelompok} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, uraian_kelompok: e.target.value})} className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm" placeholder="Cth: Pendapatan BBM" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700 mb-1">Mutasi Normal</label>
                      <div className="flex gap-4 mt-1">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input type="radio" value="DEBET" checked={kodeAkunBaru.mutasi === 'DEBET'} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, mutasi: e.target.value})} className="w-4 h-4 text-green-600 focus:ring-green-500" /> Debet
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input type="radio" value="KREDIT" checked={kodeAkunBaru.mutasi === 'KREDIT'} onChange={(e) => setKodeAkunBaru({...kodeAkunBaru, mutasi: e.target.value})} className="w-4 h-4 text-red-600 focus:ring-red-500" /> Kredit
                        </label>
                      </div>
                    </div>

                    <div className="pt-3 flex gap-2">
                      {editingKodeAkunId && (
                        <button onClick={() => { setEditingKodeAkunId(null); setKodeAkunBaru({ kode_reff: '', nama_transaksi: '', kelompok: '', uraian_kelompok: '', mutasi: 'DEBET' }); }} className="flex-1 bg-white border text-slate-600 py-2 rounded-lg text-sm font-medium">Batal</button>
                      )}
                      <button onClick={handleSimpanKodeAkun} disabled={isSaving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex justify-center items-center gap-2">
                        {isSaving ? <><Loader2 className="animate-spin" size={16} /> Menyimpan...</> : <><Save size={16} /> Simpan</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB PRODUK NFR */}
        {activeTab === 'produk' && (
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
        )}

        {/* TAB HARGA BBM */}
        {activeTab === 'harga_bbm' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><History size={20} className="text-blue-600"/> Harga BBM per Produk</h2>
                <p className="text-sm text-slate-500 mt-1">Update harga BBM + tanggal efektif. History otomatis tercatat.</p>
              </div>
              <button onClick={() => setShowRiwayatModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                <History size={16}/> Lihat Riwayat
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-500 text-white text-sm uppercase">
                    <th className="py-4 px-4 font-semibold w-12 text-center">No</th>
                    <th className="py-4 px-4 font-semibold">Produk BBM</th>
                    <th className="py-4 px-4 font-semibold text-center bg-orange-600">Harga Sebelumnya</th>
                    <th className="py-4 px-4 font-semibold text-center bg-blue-600">Harga Sekarang</th>
                    <th className="py-4 px-4 font-semibold text-center bg-blue-700">Efektif Tanggal</th>
                    <th className="py-4 px-4 font-semibold text-center bg-orange-600">Status</th>
                    <th className="py-4 px-4 font-semibold text-center bg-orange-600">Selisih</th>
                    <th className="py-4 px-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {daftarHargaBBM.map((bbm, index) => {
                    const isEditing = editingHargaId === bbm.id;
                    return (
                      <tr key={bbm.id} className="hover:bg-slate-50">
                        <td className="py-4 px-4 text-center text-slate-500">{index + 1}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center border border-slate-200 overflow-hidden">
                              {bbm.logo_url ? <img src={bbm.logo_url} alt="logo" className="w-full h-full object-contain" /> : <Fuel className="text-slate-400" size={18} />}
                            </div>
                            <span className="font-semibold text-slate-800">{bbm.jenis_bbm}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center bg-slate-50">
                          <span className="text-slate-600 font-medium">{bbm.harga_per_liter}</span>
                        </td>
                        <td className="py-4 px-4 text-center bg-blue-50">
                          {isEditing ? (
                            <input 
                              type="number" 
                              value={hargaBaruInput} 
                              onChange={(e) => handleHargaInputChange(e, bbm.harga_per_liter)}
                              className="w-24 px-2 py-1.5 border-2 border-blue-400 rounded-lg text-center font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600" 
                            />
                          ) : (
                            <span className="text-slate-800 font-bold text-lg">{bbm.harga_per_liter}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center bg-blue-50">
                          {isEditing ? (
                            <input 
                              type="date" 
                              value={tanggalEfektif} 
                              onChange={(e) => setTanggalEfektif(e.target.value)}
                              className="px-2 py-1.5 border-2 border-blue-400 rounded-lg text-sm font-medium text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600" 
                            />
                          ) : (
                            <span className="text-slate-500 text-sm">{bbm.tanggal_efektif || '-'}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isEditing ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto ${
                              statusHarga === 'NAIK' ? 'bg-red-100 text-red-600' : 
                              statusHarga === 'TURUN' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {statusHarga === 'NAIK' && <ArrowUp size={14} />}
                              {statusHarga === 'TURUN' && <ArrowDown size={14} />}
                              {statusHarga === 'TETAP' && <Minus size={14} />}
                              {statusHarga}
                            </span>
                          ) : (
                            bbm.status_harga ? (
                              <span className={`px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto ${
                                bbm.status_harga === 'NAIK' ? 'bg-red-100 text-red-600' : 
                                bbm.status_harga === 'TURUN' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {bbm.status_harga === 'NAIK' && <ArrowUp size={14} />}
                                {bbm.status_harga === 'TURUN' && <ArrowDown size={14} />}
                                {bbm.status_harga === 'TETAP' && <Minus size={14} />}
                                {bbm.status_harga}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Belum ada</span>
                            )
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isEditing ? (
                            <span className={`font-medium ${selisihHarga > 0 ? 'text-red-600' : selisihHarga < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                              {selisihHarga === 0 ? '-' : formatRupiah(Math.abs(selisihHarga))}
                            </span>
                          ) : (
                            bbm.selisih_harga ? (
                              <span className={`font-medium ${bbm.selisih_harga > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatRupiah(Math.abs(bbm.selisih_harga))}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">-</span>
                            )
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isEditing ? (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => setEditingHargaId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border rounded-lg">Batal</button>
                              <button onClick={() => handleSimpanHarga(bbm)} disabled={isSaving} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                {isSaving ? <Loader2 className="animate-spin" size={14} /> : 'Simpan'}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => handleMulaiEditHarga(bbm)} className="px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                              Edit Harga
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-blue-50 text-sm text-blue-800 flex items-center gap-2">
              <History size={16} /> Terakhir update: <strong>Hari ini</strong> oleh <strong>Manager Operasional</strong>
            </div>
          </div>
        )}

        {/* TAB STOK TANGKI */}
        {activeTab === 'stok_tangki' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
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

      {/* GLOBAL PRINT STYLE */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          ::-webkit-scrollbar { display: none !important; }
          body { 
            background: white; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
        }
      `}} />
    </>
  );
}