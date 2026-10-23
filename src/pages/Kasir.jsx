// src/pages/Kasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Trash2, DollarSign, Fuel, ShoppingBag, Image as ImageIcon } from 'lucide-react';

export default function Kasir() {
  const [activeTab, setActiveTab] = useState('BBM'); // 'BBM' atau 'NFR'
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [listProdukNFR, setListProdukNFR] = useState([]); // State untuk produk NFR
  
  const [transaksiBBM, setTransaksiBBM] = useState([]);
  const [transaksiNFR, setTransaksiNFR] = useState([]);
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    shift: '',
    total_harga: ''
  });

  // State Form BBM
  const [bbmData, setBbmData] = useState({
    dispenser: 'DISPENSER 1', jenis_bbm: 'PERTALITE', jumlah_liter: '', operator: ''
  });

  // State Form NFR
  const [nfrData, setNfrData] = useState({
    produk_id: '', // Menyimpan ID produk dari database
    jumlah: '',
    kasir_foreman: ''
  });

  const [displayHarga, setDisplayHarga] = useState('');

  const listDispenser = ['DISPENSER 1', 'DISPENSER 2', 'DISPENSER 3', 'DISPENSER 4', 'DISPENSER 5'];
  const listBBM = ['PERTALITE', 'PERTAMAX', 'PERTAMAX TURBO', 'BIOSOLAR', 'DEXLITE'];
  const listKasirForeman = ['KASIR', 'FOREMAN'];

  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };
  const hariIni = getTodayDate();

  const fetchData = async () => {
    setIsLoading(true);
    
    // 1. Ambil Shift
    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData && shiftData.length > 0) {
      setListShift(shiftData.map(s => s.nama_shift));
      if (!formData.shift) setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
    }

    // 2. Ambil Produk NFR dari Database
    const { data: produkData } = await supabase.from('master_produk_nfr').select('*').order('nama_produk');
    if (produkData) setListProdukNFR(produkData);

    // 3. Ambil Transaksi BBM Hari Ini
    const { data: dataBBM } = await supabase.from('penjualan_bbm').select('*').eq('tanggal', hariIni).order('id', { ascending: false });
    if (dataBBM) setTransaksiBBM(dataBBM);

    // 4. Ambil Transaksi NFR Hari Ini
    const { data: dataNFR } = await supabase.from('penjualan_nfr').select('*').eq('tanggal', hariIni).order('id', { ascending: false });
    if (dataNFR) setTransaksiNFR(dataNFR);

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
    if (!formData.total_harga) return alert('Total Harga harus diisi!');

    if (activeTab === 'BBM') {
      if (!bbmData.jumlah_liter || !bbmData.operator) return alert('Lengkapi Jumlah Liter dan Nama Operator!');
      
      const { error } = await supabase.from('penjualan_bbm').insert([{
        tanggal: formData.tanggal,
        shift: formData.shift,
        dispenser: bbmData.dispenser,
        jenis_bbm: bbmData.jenis_bbm,
        jumlah_liter: parseFloat(bbmData.jumlah_liter),
        total_harga: parseFloat(formData.total_harga),
        operator: bbmData.operator.toUpperCase()
      }]);

      if (error) alert('Gagal: ' + error.message);
      else {
        setBbmData({ ...bbmData, jumlah_liter: '', operator: '' });
        setFormData({ ...formData, total_harga: '' });
        setDisplayHarga('');
        fetchData();
      }

    } else if (activeTab === 'NFR') {
      if (!nfrData.produk_id || !nfrData.jumlah || !nfrData.kasir_foreman) return alert('Lengkapi Produk, Jumlah, dan Kasir/Foreman!');
      
      // Cari nama produk yang dipilih untuk disimpan
      const selectedProduk = listProdukNFR.find(p => p.id.toString() === nfrData.produk_id.toString());

      const { error } = await supabase.from('penjualan_nfr').insert([{
        tanggal: formData.tanggal,
        shift: formData.shift,
        produk_nfr: selectedProduk ? selectedProduk.nama_produk : 'Produk Tidak Diketahui',
        jumlah: parseFloat(nfrData.jumlah),
        total_harga: parseFloat(formData.total_harga),
        kasir_foreman: nfrData.kasir_foreman
      }]);

      if (error) alert('Gagal: ' + error.message);
      else {
        setNfrData({ ...nfrData, produk_id: '', jumlah: '', kasir_foreman: '' });
        setFormData({ ...formData, total_harga: '' });
        setDisplayHarga('');
        fetchData();
      }
    }
  };

  const handleHapusBBM = async (id) => {
    if (!window.confirm('Hapus transaksi BBM ini?')) return;
    await supabase.from('penjualan_bbm').delete().eq('id', id);
    fetchData();
  };

  const handleHapusNFR = async (id) => {
    if (!window.confirm('Hapus transaksi NFR ini?')) return;
    await supabase.from('penjualan_nfr').delete().eq('id', id);
    fetchData();
  };

  const totalPendapatanBBM = transaksiBBM.reduce((acc, curr) => acc + curr.total_harga, 0);
  const totalPendapatanNFR = transaksiNFR.reduce((acc, curr) => acc + curr.total_harga, 0);

  // Filter produk berdasarkan kategori (LPG / OLI)
  const produkLPG = listProdukNFR.filter(p => p.kategori === 'LPG');
  const produkOLI = listProdukNFR.filter(p => p.kategori === 'OLI');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Kasir & Penjualan</h1>
        <p className="text-slate-500 mt-1">Catat penjualan Fuel Retail (BBM) dan Non-Fuel Retail (NFR).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Total Pendapatan Hari Ini</p><p className="text-xl font-bold text-slate-800">{formatRupiah(totalPendapatanBBM + totalPendapatanNFR)}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Fuel size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Pendapatan BBM</p><p className="text-xl font-bold text-slate-800">{formatRupiah(totalPendapatanBBM)}</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><ShoppingBag size={24} /></div>
          <div><p className="text-xs text-slate-500 font-medium">Pendapatan NFR</p><p className="text-xl font-bold text-slate-800">{formatRupiah(totalPendapatanNFR)}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <div className="flex border-b mb-4">
            <button type="button" onClick={() => setActiveTab('BBM')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'BBM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}><Fuel size={16} className="inline mr-1"/> Fuel Retail (BBM)</button>
            <button type="button" onClick={() => setActiveTab('NFR')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'NFR' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}><ShoppingBag size={16} className="inline mr-1"/> NFR (LPG & Oli)</button>
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

            {activeTab === 'BBM' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pompa / Dispenser</label>
                  <select value={bbmData.dispenser} onChange={(e) => setBbmData({...bbmData, dispenser: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                    {listDispenser.map((d, i) => <option key={i} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jenis BBM</label>
                  <select value={bbmData.jenis_bbm} onChange={(e) => setBbmData({...bbmData, jenis_bbm: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                    {listBBM.map((b, i) => <option key={i} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah (Liter)</label>
                  <input type="number" step="0.01" required value={bbmData.jumlah_liter} onChange={(e) => setBbmData({...bbmData, jumlah_liter: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Cth: 10.5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nama Operator</label>
                  <input type="text" required value={bbmData.operator} onChange={(e) => setBbmData({...bbmData, operator: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nama Operator" />
                </div>
              </>
            )}

            {activeTab === 'NFR' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pilih Produk NFR</label>
                  <select value={nfrData.produk_id} onChange={(e) => setNfrData({...nfrData, produk_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                    <option value="">-- Pilih Produk --</option>
                    <optgroup label="LPG">
                      {produkLPG.map(p => <option key={p.id} value={p.id}>{p.nama_produk} - {formatRupiah(p.harga_jual)}</option>)}
                    </optgroup>
                    <optgroup label="Oli / Pelumas">
                      {produkOLI.map(p => <option key={p.id} value={p.id}>{p.nama_produk} - {formatRupiah(p.harga_jual)}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah (Pcs/Tabung)</label>
                  <input type="number" required value={nfrData.jumlah} onChange={(e) => setNfrData({...nfrData, jumlah: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Jumlah" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nama Kasir / Foreman</label>
                  <select value={nfrData.kasir_foreman} onChange={(e) => setNfrData({...nfrData, kasir_foreman: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                    <option value="">Pilih...</option>
                    {listKasirForeman.map((kf, i) => <option key={i} value={kf}>{kf}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Total Harga (Rp)</label>
              <input type="text" required value={displayHarga} onChange={handleHargaChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Rp 0" />
            </div>
            
            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm mt-2 text-sm">
              Simpan Transaksi
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
            ) : activeTab === 'BBM' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase">
                    <th className="py-4 px-6 font-semibold">Shift</th>
                    <th className="py-4 px-6 font-semibold">Dispenser</th>
                    <th className="py-4 px-6 font-semibold">Jenis BBM</th>
                    <th className="py-4 px-6 font-semibold">Jumlah (L)</th>
                    <th className="py-4 px-6 font-semibold">Total Harga</th>
                    <th className="py-4 px-6 font-semibold">Operator</th>
                    <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaksiBBM.length > 0 ? transaksiBBM.map(trx => (
                    <tr key={trx.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 text-slate-600 font-medium">{trx.shift}</td>
                      <td className="py-4 px-6 font-semibold text-blue-600">{trx.dispenser}</td>
                      <td className="py-4 px-6 text-slate-600">{trx.jenis_bbm}</td>
                      <td className="py-4 px-6 text-slate-600">{trx.jumlah_liter} L</td>
                      <td className="py-4 px-6 font-medium text-slate-800">{formatRupiah(trx.total_harga)}</td>
                      <td className="py-4 px-6 text-slate-600 uppercase text-xs">{trx.operator}</td>
                      <td className="py-4 px-6 text-center"><button onClick={() => handleHapusBBM(trx.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></td>
                    </tr>
                  )) : <tr><td colSpan="7" className="py-8 text-center text-slate-500">Belum ada transaksi BBM hari ini.</td></tr>}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase">
                    <th className="py-4 px-6 font-semibold">Shift</th>
                    <th className="py-4 px-6 font-semibold">Produk NFR</th>
                    <th className="py-4 px-6 font-semibold">Jumlah</th>
                    <th className="py-4 px-6 font-semibold">Total Harga</th>
                    <th className="py-4 px-6 font-semibold">Kasir/Foreman</th>
                    <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaksiNFR.length > 0 ? transaksiNFR.map(trx => (
                    <tr key={trx.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 text-slate-600 font-medium">{trx.shift}</td>
                      <td className="py-4 px-6 font-semibold text-blue-600">{trx.produk_nfr}</td>
                      <td className="py-4 px-6 text-slate-600">{trx.jumlah} Pcs/Tabung</td>
                      <td className="py-4 px-6 font-medium text-slate-800">{formatRupiah(trx.total_harga)}</td>
                      <td className="py-4 px-6 text-slate-600 uppercase text-xs">{trx.kasir_foreman}</td>
                      <td className="py-4 px-6 text-center"><button onClick={() => handleHapusNFR(trx.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></td>
                    </tr>
                  )) : <tr><td colSpan="6" className="py-8 text-center text-slate-500">Belum ada transaksi NFR hari ini.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}