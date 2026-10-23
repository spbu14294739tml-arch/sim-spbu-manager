// src/pages/Kasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Trash2, DollarSign, Fuel, ShoppingBag, Droplet } from 'lucide-react';

export default function Kasir() {
  const [activeTab, setActiveTab] = useState('BBM'); // 'BBM', 'NFR', 'OLI'
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [transaksiHariIni, setTransaksiHariIni] = useState([]);
  
  // State Form Umum
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    shift: '',
    operator: '',
    total_harga: ''
  });

  // State Khusus BBM
  const [bbmData, setBbmData] = useState({
    dispenser: 'DISPENSER 1',
    jenis_bbm: 'PERTALITE',
    jumlah: ''
  });

  // State Khusus NFR
  const [nfrData, setNfrData] = useState({
    produk_nfr: 'LPG 3 KG',
    jumlah: ''
  });

  // State Khusus OLI
  const [oliData, setOliData] = useState({
    produk_nfr: 'MESRAN SUPREME SAE 20W-50', // Jenis Oli
    jumlah: '' // Jumlah Pcs
  });

  const [displayHarga, setDisplayHarga] = useState('');

  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };
  const hariIni = getTodayDate();

  const fetchData = async () => {
    setIsLoading(true);
    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData && shiftData.length > 0) {
      setListShift(shiftData.map(s => s.nama_shift));
      if (!formData.shift) setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
    }

    const { data: transaksiData } = await supabase
      .from('penjualan').select('*').eq('tanggal', hariIni).order('id', { ascending: false });
    if (transaksiData) setTransaksiHariIni(transaksiData);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleHargaChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, total_harga: rawValue });
    setDisplayHarga(rawValue ? formatRupiah(rawValue) : '');
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!formData.operator || !formData.total_harga) {
      alert('Mohon lengkapi Nama Operator dan Total Harga!');
      return;
    }

    let dataToInsert = {
      tanggal: formData.tanggal,
      shift: formData.shift,
      operator: formData.operator.toUpperCase(),
      total_harga: parseFloat(formData.total_harga),
      kategori: activeTab
    };

    if (activeTab === 'BBM') {
      if (!bbmData.jumlah) return alert('Jumlah Liter harus diisi!');
      dataToInsert = { ...dataToInsert, dispenser: bbmData.dispenser, jenis_bbm: bbmData.jenis_bbm, jumlah: parseFloat(bbmData.jumlah) };
    } else if (activeTab === 'NFR') {
      if (!nfrData.jumlah) return alert('Jumlah harus diisi!');
      dataToInsert = { ...dataToInsert, produk_nfr: nfrData.produk_nfr, jumlah: parseFloat(nfrData.jumlah) };
    } else if (activeTab === 'OLI') {
      if (!oliData.jumlah) return alert('Jumlah Pcs harus diisi!');
      dataToInsert = { ...dataToInsert, produk_nfr: oliData.produk_nfr, jumlah: parseFloat(oliData.jumlah) };
    }

    const { error } = await supabase.from('penjualan').insert([dataToInsert]);

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      setFormData({ ...formData, total_harga: '', operator: '' });
      setBbmData({ ...bbmData, jumlah: '' });
      setNfrData({ ...nfrData, jumlah: '' });
      setOliData({ ...oliData, jumlah: '' });
      setDisplayHarga('');
      fetchData();
    }
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Hapus transaksi ini?')) return;
    await supabase.from('penjualan').delete().eq('id', id);
    fetchData();
  };

  // Hitung Total Pendapatan Hari Ini
  const totalPendapatan = transaksiHariIni.reduce((acc, curr) => acc + curr.total_harga, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Kasir & Penjualan</h1>
        <p className="text-slate-500 mt-1">Catat penjualan BBM, NFR, dan Oli harian.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Total Pendapatan Hari Ini</p><p className="text-xl font-bold text-slate-800">{formatRupiah(totalPendapatan)}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          
          {/* TAB NAVIGATION */}
          <div className="flex border-b mb-4">
            <button type="button" onClick={() => setActiveTab('BBM')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'BBM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}><Fuel size={16} className="inline mr-1"/> BBM</button>
            <button type="button" onClick={() => setActiveTab('NFR')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'NFR' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}><ShoppingBag size={16} className="inline mr-1"/> NFR</button>
            <button type="button" onClick={() => setActiveTab('OLI')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'OLI' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}><Droplet size={16} className="inline mr-1"/> Oli</button>
          </div>

          <form onSubmit={handleSimpan} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                <input type="date" value={formData.tanggal} readOnly className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Shift</label>
                <select value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                  {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* FORM BBM */}
            {activeTab === 'BBM' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pompa / Dispenser</label>
                  <select value={bbmData.dispenser} onChange={(e) => setBbmData({...bbmData, dispenser: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                    <option value="DISPENSER 1">DISPENSER 1</option>
                    <option value="DISPENSER 2">DISPENSER 2</option>
                    <option value="DISPENSER 3">DISPENSER 3</option>
                    <option value="DISPENSER 4">DISPENSER 4</option>
                    <option value="DISPENSER 5">DISPENSER 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jenis BBM</label>
                  <select value={bbmData.jenis_bbm} onChange={(e) => setBbmData({...bbmData, jenis_bbm: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                    <option value="PERTALITE">PERTALITE</option>
                    <option value="PERTAMAX">PERTAMAX</option>
                    <option value="PERTAMAX TURBO">PERTAMAX TURBO</option>
                    <option value="BIOSOLAR">BIOSOLAR</option>
                    <option value="DEXLITE">DEXLITE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah (Liter)</label>
                  <input type="number" step="0.01" required value={bbmData.jumlah} onChange={(e) => setBbmData({...bbmData, jumlah: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: 10.5" />
                </div>
              </>
            )}

            {/* FORM NFR */}
            {activeTab === 'NFR' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jenis NFR</label>
                  <select value={nfrData.produk_nfr} onChange={(e) => setNfrData({...nfrData, produk_nfr: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                    <option value="LPG 3 KG">LPG 3 KG</option>
                    <option value="LPG 5.5 KG">LPG 5.5 KG</option>
                    <option value="LPG 12 KG">LPG 12 KG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah (Tabung)</label>
                  <input type="number" required value={nfrData.jumlah} onChange={(e) => setNfrData({...nfrData, jumlah: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: 5" />
                </div>
              </>
            )}

            {/* FORM OLI */}
            {activeTab === 'OLI' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jenis Oli / Pelumas</label>
                  <select value={oliData.produk_nfr} onChange={(e) => setOliData({...oliData, produk_nfr: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                    <option value="MESRAN SUPREME SAE 20W-50">MESRAN SUPREME SAE 20W-50</option>
                    <option value="MESRAN SUPREME SAE 10W-30">MESRAN SUPREME SAE 10W-30</option>
                    <option value="PRIMA XP SAE 20W-50">PRIMA XP SAE 20W-50</option>
                    <option value="ENDURA M3 SAE 15W-40">ENDURA M3 SAE 15W-40</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah (Pcs)</label>
                  <input type="number" required value={oliData.jumlah} onChange={(e) => setOliData({...oliData, jumlah: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: 2" />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Total Harga (Rp)</label>
              <input type="text" required value={displayHarga} onChange={handleHargaChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Rp 0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nama Operator</label>
              <input type="text" required value={formData.operator} onChange={(e) => setFormData({...formData, operator: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nama Operator" />
            </div>
            
            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm mt-2 text-sm">
              Simpan Transaksi {activeTab}
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: TABEL TRANSAKSI HARI INI */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">Transaksi Hari Ini ({hariIni})</h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase">
                    <th className="py-4 px-6 font-semibold">Kategori</th>
                    <th className="py-4 px-6 font-semibold">Shift</th>
                    <th className="py-4 px-6 font-semibold">Detail Produk</th>
                    <th className="py-4 px-6 font-semibold">Jumlah</th>
                    <th className="py-4 px-6 font-semibold">Total Harga</th>
                    <th className="py-4 px-6 font-semibold">Operator</th>
                    <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaksiHariIni.length > 0 ? (
                    transaksiHariIni.map((trx) => (
                      <tr key={trx.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-semibold text-blue-600">{trx.kategori}</td>
                        <td className="py-4 px-6 text-slate-600 font-medium">{trx.shift}</td>
                        <td className="py-4 px-6">
                          {trx.kategori === 'BBM' && <span className="font-semibold">{trx.dispenser} - {trx.jenis_bbm}</span>}
                          {trx.kategori === 'NFR' && <span className="font-semibold">{trx.produk_nfr}</span>}
                          {trx.kategori === 'OLI' && <span className="font-semibold">{trx.produk_nfr}</span>}
                        </td>
                        <td className="py-4 px-6 text-slate-600">{trx.jumlah} {trx.kategori === 'BBM' ? 'L' : (trx.kategori === 'NFR' ? 'Tabung' : 'Pcs')}</td>
                        <td className="py-4 px-6 font-medium text-slate-800">{formatRupiah(trx.total_harga)}</td>
                        <td className="py-4 px-6 text-slate-600 uppercase text-xs">{trx.operator}</td>
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => handleHapus(trx.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="py-8 text-center text-slate-500">Belum ada transaksi hari ini.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}