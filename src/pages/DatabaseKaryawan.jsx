// src/pages/DatabaseKaryawan.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Trash2, X, Loader2, Upload, User, Printer, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah, exportToCSV } from '../lib/formatHelper';
import KopSurat from '../components/KopSurat';

const InputField = ({ label, name, type = "text", placeholder = "", formData, setFormData, onChange, value }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      value={value !== undefined ? value : (formData[name] || '')}
      onChange={onChange ? onChange : (e) => {
        const isEmailOrLink = name === 'email' || name.includes('link');
        const nilaiBaru = isEmailOrLink ? e.target.value : e.target.value.toUpperCase();
        setFormData({...formData, [name]: nilaiBaru});
      }}
      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      placeholder={placeholder}
    />
  </div>
);

export default function DatabaseKaryawan() {
  const [karyawanList, setKaryawanList] = useState([]);
  const [listShift, setListShift] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [editingId, setEditingId] = useState(null);

  const [fileFoto, setFileFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const dataWilayah = {
    'BATAM KOTA': { 'BALOI PERMAI': '29431', 'BALOI': '29432', 'SUKAJADI': '29432', 'TAMAN BALOI': '29432', 'SUNGAI PANAS': '29433', 'TELUK TERING': '29461', 'BELIAN': '29464' },
    'NONGSA': { 'SAMBAU': '29465', 'BATU BESAR': '29466', 'KABIL': '29467', 'NGENANG': '29468' },
    'BENGKONG': { 'SADAI': '29432', 'TANJUNG BUNTUNG': '29432', 'BENGKONG HARAPAN': '29457', 'BENGKONG INDAH': '29458', 'BENGKONG LAUT': '29458' },
    'BATU AMPAR': { 'BUKIT SENYUM': '29451', 'BATU MERAH': '29452', 'SUNGAI JODOH': '29453', 'TANJUNG SENGKUANG': '29453', 'KAMPUNG SERAYA': '29454', 'HARAPAN BARU': '29455', 'BUKIT JODOH': '29456' },
    'SEKUPANG': { 'SUNGAI HARAPAN': '29421', 'TANJUNG PINGGIR': '29421', 'TIBAN BARU': '29421', 'TIBAN INDAH': '29421', 'PATAM LESTARI': '29421', 'SUNGAI PULUH': '29421' },
    'BELAKANG PADANG': { 'PEMPING': '29412', 'KASU': '29413', 'PECONG': '29414', 'PULAU TERONG': '29416', 'SEKANAK RAYA': '29416', 'TANJUNG SARI': '29416' },
    'BULANG': { 'BULANG LINTANG': '29471', 'PULAU BULUH': '29472', 'PANTAI GELAM': '29473', 'BATU LEGONG': '29474', 'TEMOYONG': '29475', 'PULAU SETOKOK': '29476' },
    'SAGULUNG': { 'SAGULUNG KOTA': '29439', 'SUNGAI BINTI': '29439', 'SUNGAI LANGKAI': '29439', 'SUNGAI LEKOP': '29439', 'SUNGAI PELENGGUT': '29439', 'TEMBESI': '29439' },
    'GALANG': { 'PULAU SEMBULANG': '29481', 'REMPANG CATE': '29482', 'AIR RAJA': '29483', 'SUBANG MAS': '29483', 'GALANG BARU': '29484', 'SIJANTUNG': '29485', 'PULAU KARAS': '29486', 'PULAU ABANG': '29487' },
    'LUBUK BAJA': { 'BALOI INDAH': '29432', 'BATU SELICIN': '29441', 'PANGKALAN PETAI': '29442', 'KAMPUNG PELITA': '29443', 'LUBUK BAJA KOTA': '29444', 'TANJUNG UMA': '29445' },
    'SUNGAI BEDUK': { 'MUKA KUNING': '29433', 'DURIANGKA': '29437', 'MANGSA': '29437', 'TANJUNG PIAYU': '29437' },
    'BATU AJI': { 'KIBING': '29422', 'TANJUNG UNCANG': '29424', 'BATU AJI': '29438', 'BUKIT TEMPAYAN': '29438', 'BULANG': '29438' }
  };

  const listKecamatan = Object.keys(dataWilayah);
  const [listKelurahanTampil, setListKelurahanTampil] = useState([]);

  const [formData, setFormData] = useState({
    nama: '', nomor_karyawan: '', posisi: '', shift: 'Pagi', status: 'Aktif',
    no_hp: '', email: '', tanggal_lahir: '', jenis_kelamin: '', 
    tanggal_masuk: '', tanggal_keluar: '', status_pernikahan: '', 
    alamat: '', kecamatan: '', kelurahan: '', kode_pos: '',
    no_ktp: '', no_kk: '',
    gaji_pokok: '', nama_rekening: '', nomor_rekening: '', npwp: '',
    no_bpjs_kesehatan: '', no_bpjs_ketenagakerjaan: '',
    foto_url: '', link_e_ktp: '', link_kk: '', link_kontrak: '', link_catatan: ''
  });

  const [displayGaji, setDisplayGaji] = useState('');

  const fetchKaryawan = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('karyawan').select('*').order('id', { ascending: true });
    if (error) console.error(error);
    else setKaryawanList(data);
    setIsLoading(false);
  };

  const fetchShift = async () => {
    const { data } = await supabase.from('pengaturan_shift').select('nama_shift').order('id', { ascending: true });
    if (data && data.length > 0) setListShift(data.map(s => s.nama_shift));
    else setListShift(['Pagi', 'Siang', 'Malam', '-']);
  };

  useEffect(() => { fetchKaryawan(); fetchShift(); }, []);

  const hitungMasaKerja = (tanggalMasuk, tanggalKeluar) => {
    if (!tanggalMasuk) return '-';
    const start = new Date(tanggalMasuk);
    const end = tanggalKeluar ? new Date(tanggalKeluar) : new Date();
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return `${years} Tahun, ${months} Bulan, ${days} Hari`;
  };

  const generateNomorKaryawan = (posisiDipilih) => {
    if (!posisiDipilih) return '';
    let prefix = 'KRY.SPBU';
    const pos = posisiDipilih.toLowerCase();
    if (pos.includes('kasir')) prefix = 'KAS.SPBU';
    else if (pos.includes('manager')) prefix = 'MGR.SPBU';
    else if (pos.includes('accounting')) prefix = 'ACC.SPBU';
    else if (pos.includes('operator')) prefix = 'OPR.SPBU';
    else if (pos.includes('foreman')) prefix = 'FOR.SPBU';
    else if (pos.includes('security') || pos.includes('sekuriti')) prefix = 'PAM.SPBU';
    else if (pos.includes('cleaning')) prefix = 'CS.SPBU';

    const listPosisiSama = karyawanList.filter(k => k.posisi && k.posisi.toLowerCase().includes(pos.includes('kasir') ? 'kasir' : pos));
    let maxNumber = 0;
    
    listPosisiSama.forEach(k => {
      if (k.nomor_karyawan && k.nomor_karyawan.includes(prefix)) {
        const numStr = k.nomor_karyawan.split('-')[1];
        if (numStr) {
          const num = parseInt(numStr, 10);
          if (num > maxNumber) maxNumber = num;
        }
      }
    });
    const nextNumber = String(maxNumber + 1).padStart(3, '0');
    return `${prefix}-${nextNumber}`;
  };

  const handlePosisiChange = (e) => {
    const posisiBaru = e.target.value.toUpperCase();
    if (!editingId || !formData.nomor_karyawan) {
      const nomorOtomatis = generateNomorKaryawan(posisiBaru);
      setFormData({ ...formData, posisi: posisiBaru, nomor_karyawan: nomorOtomatis });
    } else {
      setFormData({ ...formData, posisi: posisiBaru });
    }
  };

  const handleKecamatanChange = (e) => {
    const kecamatanDipilih = e.target.value.toUpperCase();
    const kelurahanTersedia = dataWilayah[kecamatanDipilih] ? Object.keys(dataWilayah[kecamatanDipilih]) : [];
    setListKelurahanTampil(kelurahanTersedia);
    setFormData({ ...formData, kecamatan: kecamatanDipilih, kelurahan: '', kode_pos: '' });
  };

  const handleKelurahanChange = (e) => {
    const kelurahanDipilih = e.target.value.toUpperCase();
    const kodePosOtomatis = dataWilayah[formData.kecamatan]?.[kelurahanDipilih] || '';
    setFormData({ ...formData, kelurahan: kelurahanDipilih, kode_pos: kodePosOtomatis });
  };

  const handleGajiChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, gaji_pokok: rawValue });
    setDisplayGaji(rawValue ? formatRupiah(rawValue) : '');
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setFileFoto(file); setPreviewFoto(URL.createObjectURL(file)); }
  };

  const handleEdit = (karyawan) => {
    const dataKaryawan = { ...karyawan, shift: karyawan.shift || '-' };
    setFormData(dataKaryawan);
    setDisplayGaji(karyawan.gaji_pokok ? formatRupiah(karyawan.gaji_pokok) : '');
    setPreviewFoto(karyawan.foto_url || '');
    setFileFoto(null);
    setEditingId(karyawan.id);
    if (dataKaryawan.kecamatan && dataWilayah[dataKaryawan.kecamatan]) {
      setListKelurahanTampil(Object.keys(dataWilayah[dataKaryawan.kecamatan]));
    } else {
      setListKelurahanTampil([]);
    }
    setIsModalOpen(true);
    setActiveTab(1);
  };

  const handleTutupModal = () => {
    setFormData({
      nama: '', nomor_karyawan: '', posisi: '', shift: listShift[0] || 'Pagi', status: 'Aktif',
      no_hp: '', email: '', tanggal_lahir: '', jenis_kelamin: '', 
      tanggal_masuk: '', tanggal_keluar: '', status_pernikahan: '', 
      alamat: '', kecamatan: '', kelurahan: '', kode_pos: '',
      no_ktp: '', no_kk: '',
      gaji_pokok: '', nama_rekening: '', nomor_rekening: '', npwp: '',
      no_bpjs_kesehatan: '', no_bpjs_ketenagakerjaan: '',
      foto_url: '', link_e_ktp: '', link_kk: '', link_kontrak: '', link_catatan: ''
    });
    setDisplayGaji('');
    setFileFoto(null);
    setPreviewFoto('');
    setListKelurahanTampil([]);
    setEditingId(null);
    setIsModalOpen(false);
    setActiveTab(1);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    let finalFotoUrl = formData.foto_url;

    if (fileFoto) {
      const fileExt = fileFoto.name.split('.').pop();
      const fileName = `${Date.now()}_${formData.nama.replace(/\s+/g, '_')}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('foto_karyawan').upload(fileName, fileFoto);
      if (uploadError) { alert('Gagal upload foto: ' + uploadError.message); setIsUploading(false); return; }
      const { data: publicUrlData } = supabase.storage.from('foto_karyawan').getPublicUrl(fileName);
      finalFotoUrl = publicUrlData.publicUrl;
    }

    let finalStatus = formData.status;
    if (formData.tanggal_keluar) finalStatus = 'Tidak Aktif';

    const dataToInsert = {
      ...formData,
      status: finalStatus,
      foto_url: finalFotoUrl,
      tanggal_lahir: formData.tanggal_lahir || null,
      tanggal_masuk: formData.tanggal_masuk || null,
      tanggal_keluar: formData.tanggal_keluar || null,
      gaji_pokok: formData.gaji_pokok ? parseFloat(formData.gaji_pokok) : null
    };

    if (editingId) {
      const { error } = await supabase.from('karyawan').update(dataToInsert).eq('id', editingId);
      if (error) alert('Gagal update data: ' + error.message);
      else { handleTutupModal(); fetchKaryawan(); }
    } else {
      const { error } = await supabase.from('karyawan').insert([dataToInsert]);
      if (error) alert('Gagal menyimpan: ' + error.message);
      else { handleTutupModal(); fetchKaryawan(); }
    }
    setIsUploading(false);
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Yakin hapus karyawan ini?')) return;
    await supabase.from('karyawan').delete().eq('id', id);
    fetchKaryawan();
  };

  const filteredKaryawan = karyawanList.filter((k) => {
    const matchSearch = k.nama.toLowerCase().includes(searchTerm.toLowerCase()) || (k.posisi && k.posisi.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = filterStatus === 'Semua' || k.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status) => {
    if (status === 'Aktif') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Cuti') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200'; 
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Database Karyawan</h1>
          <p className="text-slate-500 mt-1">Kelola data seluruh staf SPBU 14.294.739</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const dataEkspor = filteredKaryawan.map((k, i) => ({
                No: i + 1, 'Nama Lengkap': k.nama, 'No. Karyawan': k.nomor_karyawan, Posisi: k.posisi, Shift: k.shift, Status: k.status, 'No. HP': k.no_hp, Email: k.email, 'Gaji Pokok': k.gaji_pokok, Alamat: k.alamat, Kecamatan: k.kecamatan, Kelurahan: k.kelurahan, 'Kode Pos': k.kode_pos
              }));
              exportToCSV(dataEkspor, `Data_Karyawan_SPBU_${new Date().toISOString().split('T')[0]}`);
            }} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <FileSpreadsheet size={20} /> Ekspor Excel
          </button>
          <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={20} /> Cetak
          </button>
          <button onClick={() => { handleTutupModal(); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm">
            <Plus size={20} /> Tambah Karyawan
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center no-print">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-slate-400" /></div>
          <input type="text" placeholder="Cari nama atau posisi..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full md:w-auto px-4 py-2.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-600">
          <option value="Semua">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Tidak Aktif">Tidak Aktif</option>
          <option value="Cuti">Cuti</option>
        </select>
      </div>

      <KopSurat judul="Data Karyawan" periode={`Tahun ${new Date().getFullYear()}`} />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="py-4 px-4 font-semibold w-12 text-center">Foto</th>
                <th className="py-4 px-4 font-semibold">Nama & No. Karyawan</th>
                <th className="py-4 px-4 font-semibold">Posisi & Shift</th>
                <th className="py-4 px-4 font-semibold">Gaji Pokok</th>
                <th className="py-4 px-4 font-semibold text-center">Masa Kerja</th>
                <th className="py-4 px-4 font-semibold text-center">Status</th>
                <th className="py-4 px-4 font-semibold text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="7" className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={24} /></td></tr>
              ) : filteredKaryawan.map((k, index) => (
                <tr key={k.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-4 text-center">
                    {k.foto_url ? <img src={k.foto_url} alt={k.nama} className="w-10 h-10 rounded-full object-cover border border-slate-200 mx-auto" /> : <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 mx-auto"><User className="text-slate-400" size={20} /></div>}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-slate-800">{k.nama}</div>
                    <div className="text-xs text-slate-500">{k.nomor_karyawan || '-'}</div>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="font-medium text-slate-700">{k.posisi}</div>
                    <div className="text-xs text-slate-500">Shift: {k.shift}</div>
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-700">{k.gaji_pokok ? formatRupiah(k.gaji_pokok) : '-'}</td>
                  <td className="py-4 px-4 text-sm text-slate-600 text-center font-medium">
                    {hitungMasaKerja(k.tanggal_masuk, k.tanggal_keluar)}
                  </td>
                  <td className="py-4 px-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(k.status)}`}>{k.status}</span></td>
                  <td className="py-4 px-4 text-center no-print">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(k)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
                      <button onClick={() => handleHapus(k.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 3 TAB (DENGAN DESAIN PIL MODERN) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h2>
              <button onClick={handleTutupModal} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            {/* TAB NAVIGATION MODERN (Pill Shape) */}
            <div className="p-4 bg-white border-b border-slate-100">
              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                <button type="button" onClick={() => setActiveTab(1)} className={`py-2 px-5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 1 ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>Data Pribadi</button>
                <button type="button" onClick={() => setActiveTab(2)} className={`py-2 px-5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 2 ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>Kepegawaian</button>
                <button type="button" onClick={() => setActiveTab(3)} className={`py-2 px-5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 3 ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>Berkas</button>
              </div>
            </div>

            <form onSubmit={handleSimpan} className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="md:col-span-2 flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                    <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                      {previewFoto ? <img src={previewFoto} alt="Preview" className="w-full h-full object-cover" /> : <User className="text-slate-400" size={40} />}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Pas Photo Karyawan</label>
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFotoChange} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current.click()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 shadow-sm"><Upload size={16} /> Pilih Foto</button>
                      <p className="text-xs text-slate-500 mt-2">Format: JPG/PNG. Maks 2MB.</p>
                    </div>
                  </div>
                  <InputField label="Nama Lengkap *" name="nama" placeholder="Sesuai KTP" formData={formData} setFormData={setFormData} />
                  <InputField label="No. Handphone" name="no_hp" placeholder="0812..." formData={formData} setFormData={setFormData} />
                  <InputField label="Email" name="email" type="email" placeholder="nama@email.com" formData={formData} setFormData={setFormData} />
                  <InputField label="Nomor e-KTP (NIK)" name="no_ktp" placeholder="16 Digit NIK" formData={formData} setFormData={setFormData} />
                  <InputField label="Nomor Kartu Keluarga (KK)" name="no_kk" placeholder="16 Digit No KK" formData={formData} setFormData={setFormData} />
                  <InputField label="Tanggal Lahir" name="tanggal_lahir" type="date" formData={formData} setFormData={setFormData} />
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label><select value={formData.jenis_kelamin || ''} onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white"><option value="">Pilih...</option><option value="Laki-Laki">Laki-Laki</option><option value="Perempuan">Perempuan</option></select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Status Pernikahan</label><select value={formData.status_pernikahan || ''} onChange={(e) => setFormData({...formData, status_pernikahan: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white"><option value="">Pilih...</option><option value="TK/0">TK/0 (Belum Menikah)</option><option value="K/0">K/0 (Menikah, 0 Anak)</option><option value="K/1">K/1 (Menikah, 1 Anak)</option><option value="K/2">K/2 (Menikah, 2 Anak)</option><option value="K/3">K/3 (Menikah, 3 Anak)</option></select></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap (Jalan/Dusun)</label><textarea value={formData.alamat || ''} onChange={(e) => setFormData({...formData, alamat: e.target.value})} rows="2" className="w-full px-4 py-2 border rounded-xl resize-none"></textarea></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Kecamatan</label><select value={formData.kecamatan || ''} onChange={handleKecamatanChange} className="w-full px-4 py-2 border rounded-xl bg-white"><option value="">Pilih Kecamatan...</option>{listKecamatan.map((kec, idx) => (<option key={idx} value={kec}>{kec}</option>))}</select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Kelurahan / Desa</label><select value={formData.kelurahan || ''} onChange={handleKelurahanChange} disabled={!formData.kecamatan} className="w-full px-4 py-2 border rounded-xl bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"><option value="">Pilih Kelurahan...</option>{listKelurahanTampil.map((kel, idx) => (<option key={idx} value={kel}>{kel}</option>))}</select></div>
                  <InputField label="Kode Pos" name="kode_pos" placeholder="Otomatis / Ketik manual" formData={formData} setFormData={setFormData} />
                </div>
              )}
              
              {activeTab === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Posisi / Jabatan *</label><input type="text" value={formData.posisi || ''} onChange={handlePosisiChange} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 uppercase" placeholder="Cth: KASIR, OPERATOR" /></div>
                  <InputField label="Nomor Karyawan" name="nomor_karyawan" placeholder="Terisi otomatis" formData={formData} setFormData={setFormData} />
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Shift</label><select value={formData.shift || ''} onChange={(e) => setFormData({...formData, shift: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white">{listShift.map((shift, idx) => (<option key={idx} value={shift}>{shift}</option>))}<option value="-">-</option></select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={formData.status || 'Aktif'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white"><option value="Aktif">Aktif</option><option value="Cuti">Cuti</option><option value="Tidak Aktif">Tidak Aktif</option></select></div>
                  <InputField label="Tanggal Masuk" name="tanggal_masuk" type="date" formData={formData} setFormData={setFormData} />
                  <InputField label="Tanggal Keluar" name="tanggal_keluar" type="date" formData={formData} setFormData={setFormData} />
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Gaji Pokok</label><input type="text" value={displayGaji} onChange={handleGajiChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rp 0" /></div>
                  <InputField label="BPJS Kesehatan" name="no_bpjs_kesehatan" formData={formData} setFormData={setFormData} />
                  <InputField label="BPJS Ketenagakerjaan" name="no_bpjs_ketenagakerjaan" formData={formData} setFormData={setFormData} />
                  <InputField label="NPWP" name="npwp" formData={formData} setFormData={setFormData} />
                  <InputField label="Nama Rekening" name="nama_rekening" formData={formData} setFormData={setFormData} />
                  <InputField label="Nomor Rekening" name="nomor_rekening" formData={formData} setFormData={setFormData} />
                </div>
              )}
              
              {activeTab === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <InputField label="Link e-KTP" name="link_e_ktp" placeholder="https://..." formData={formData} setFormData={setFormData} />
                  <InputField label="Link Kartu Keluarga" name="link_kk" placeholder="https://..." formData={formData} setFormData={setFormData} />
                  <InputField label="Link Kontrak Kerja" name="link_kontrak" placeholder="https://..." formData={formData} setFormData={setFormData} />
                  <div className="md:col-span-2">
                    <InputField label="Link Catatan / Dokumen Lain" name="link_catatan" placeholder="https://..." formData={formData} setFormData={setFormData} />
                  </div>
                </div>
              )}
            </form>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={handleTutupModal} className="px-5 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">Batal</button>
              <button type="button" onClick={handleSimpan} disabled={isUploading} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {isUploading ? <><Loader2 className="animate-spin" size={18} /> Menyimpan...</> : (editingId ? 'Update Data' : 'Simpan Data')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}