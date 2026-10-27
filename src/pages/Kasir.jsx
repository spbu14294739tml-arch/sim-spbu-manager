// src/pages/Kasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Trash2, DollarSign, Fuel, ShoppingBag, Image as ImageIcon, Ticket, Printer } from 'lucide-react';
import KopSurat from '../components/KopSurat';

// ==== Kelas utilitas seragam (biar konsisten dengan halaman lain) ====
const cardClass = 'bg-white rounded-2xl shadow-sm border border-slate-100';
const thClass = 'px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 bg-slate-50 sticky top-0 z-10';
const tdClass = 'px-4 py-3 text-sm text-slate-700';

export default function Kasir() {
  const [activeTab, setActiveTab] = useState('BBM');
  const [isLoading, setIsLoading] = useState(true);
  const [listShift, setListShift] = useState([]);
  const [listProdukNFR, setListProdukNFR] = useState([]);
  const [listHargaBBM, setListHargaBBM] = useState([]);

  const [transaksiBBM, setTransaksiBBM] = useState([]);
  const [transaksiNFR, setTransaksiNFR] = useState([]);
  const [transaksiVoucher, setTransaksiVoucher] = useState([]);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    shift: '',
  });

  const [bbmData, setBbmData] = useState({ dispenser: 'DISPENSER 1', jenis_bbm: '', jumlah_liter: '', operator: '', total_harga: '' });
  const [nfrData, setNfrData] = useState({ produk: null, jumlah: '', kasir_foreman: '', total_harga: '' });
  const [voucherData, setVoucherData] = useState({ no_voucher: '', jenis_bbm: '', jumlah_liter: '', operator: '', total_harga: '' });
  const [closingData, setClosingData] = useState({ shiftClosing: '', uangFisik: '', keterangan: '' });
  const [isClosingSaving, setIsClosingSaving] = useState(false);

  const listDispenser = ['DISPENSER 1', 'DISPENSER 2', 'DISPENSER 3', 'DISPENSER 4', 'DISPENSER 5'];
  const listKasirForeman = ['KASIR', 'FOREMAN'];

  // ================= FETCH =================
  const fetchData = async () => {
    setIsLoading(true);
    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData && shiftData.length > 0) {
      setListShift(shiftData.map(s => s.nama_shift));
      if (!formData.shift) setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
      if (!closingData.shiftClosing) setClosingData(prev => ({ ...prev, shiftClosing: shiftData[0].nama_shift }));
    }
    const { data: produkData } = await supabase.from('master_produk_nfr').select('*').order('nama_produk');
    if (produkData) setListProdukNFR(produkData);
    const { data: hargaBBMData } = await supabase.from('master_produk_bbm').select('*').order('id');
    if (hargaBBMData && hargaBBMData.length > 0) {
      setListHargaBBM(hargaBBMData);
      if (!bbmData.jenis_bbm) setBbmData(prev => ({ ...prev, jenis_bbm: hargaBBMData[0].jenis_bbm }));
      if (!voucherData.jenis_bbm) setVoucherData(prev => ({ ...prev, jenis_bbm: hargaBBMData[0].jenis_bbm }));
    }
    const { data: dataBBM } = await supabase.from('penjualan_bbm').select('*').eq('tanggal', formData.tanggal).order('id', { ascending: false });
    if (dataBBM) setTransaksiBBM(dataBBM);
    const { data: dataNFR } = await supabase.from('penjualan_nfr').select('*').eq('tanggal', formData.tanggal).order('id', { ascending: false });
    if (dataNFR) setTransaksiNFR(dataNFR);
    const { data: dataVoucher } = await supabase.from('penjualan_voucher').select('*').eq('tanggal', formData.tanggal).order('id', { ascending: false });
    if (dataVoucher) setTransaksiVoucher(dataVoucher);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [formData.tanggal]);

  const totalPendapatanBBM = transaksiBBM.reduce((acc, curr) => acc + curr.total_harga, 0);
  const totalPendapatanNFR = transaksiNFR.reduce((acc, curr) => acc + curr.total_harga, 0);
  const totalPendapatanVoucher = transaksiVoucher.reduce((acc, curr) => acc + curr.total_harga, 0);
  const totalKeseluruhan = totalPendapatanBBM + totalPendapatanNFR + totalPendapatanVoucher;

  const uangFisikNum = parseFloat(closingData.uangFisik) || 0;
  const selisih = uangFisikNum - totalKeseluruhan;

  // ================= HANDLER BBM =================
  const handleBBMJumlahChange = (e) => {
    const jumlah = e.target.value;
    let total = 0;
    if (jumlah && bbmData.jenis_bbm) {
      const selectedBBM = listHargaBBM.find(b => b.jenis_bbm === bbmData.jenis_bbm);
      if (selectedBBM) total = parseFloat(jumlah) * selectedBBM.harga_per_liter;
    }
    setBbmData({ ...bbmData, jumlah_liter: jumlah, total_harga: total });
  };
  const handleBBMSelect = (jenis_bbm) => {
    const selectedBBM = listHargaBBM.find(b => b.jenis_bbm === jenis_bbm);
    const total = (bbmData.jumlah_liter && selectedBBM) ? parseFloat(bbmData.jumlah_liter) * selectedBBM.harga_per_liter : 0;
    setBbmData({ ...bbmData, jenis_bbm, total_harga: total });
  };

  // ================= HANDLER NFR =================
  const handleNFRProdukClick = (produk) => {
    setNfrData({ ...nfrData, produk: produk, total_harga: nfrData.jumlah ? nfrData.jumlah * produk.harga_jual : 0 });
  };
  const handleNFRJumlahChange = (e) => {
    const jumlah = e.target.value;
    let total = 0;
    if (nfrData.produk && jumlah) total = parseFloat(jumlah) * nfrData.produk.harga_jual;
    setNfrData({ ...nfrData, jumlah: jumlah, total_harga: total });
  };

  // ================= HANDLER VOUCHER =================
  const handleVoucherJumlahChange = (e) => {
    const jumlah = e.target.value;
    let total = 0;
    if (jumlah && voucherData.jenis_bbm) {
      const selectedBBM = listHargaBBM.find(b => b.jenis_bbm === voucherData.jenis_bbm);
      if (selectedBBM) total = parseFloat(jumlah) * selectedBBM.harga_per_liter;
    }
    setVoucherData({ ...voucherData, jumlah_liter: jumlah, total_harga: total });
  };
  const handleVoucherBBMSelect = (jenis_bbm) => {
    const selectedBBM = listHargaBBM.find(b => b.jenis_bbm === jenis_bbm);
    const total = (voucherData.jumlah_liter && selectedBBM) ? parseFloat(voucherData.jumlah_liter) * selectedBBM.harga_per_liter : 0;
    setVoucherData({ ...voucherData, jenis_bbm, total_harga: total });
  };

  // ================= SIMPAN =================
  const handleSimpanTransaksi = async (e) => {
    e.preventDefault();
    if (activeTab === 'BBM') {
      if (!bbmData.jenis_bbm) return alert('Pilih Jenis BBM terlebih dahulu!');
      if (!bbmData.jumlah_liter || !bbmData.operator) return alert('Lengkapi Jumlah Liter dan Nama Operator!');
      const { error } = await supabase.from('penjualan_bbm').insert([{
        tanggal: formData.tanggal, shift: formData.shift, dispenser: bbmData.dispenser,
        jenis_bbm: bbmData.jenis_bbm, jumlah_liter: parseFloat(bbmData.jumlah_liter),
        total_harga: bbmData.total_harga, operator: bbmData.operator.toUpperCase()
      }]);
      if (error) alert('Gagal: ' + error.message);
      else { setBbmData({ ...bbmData, jumlah_liter: '', operator: '', total_harga: '' }); fetchData(); }
    } else if (activeTab === 'NFR') {
      if (!nfrData.produk || !nfrData.jumlah || !nfrData.kasir_foreman) return alert('Lengkapi Produk, Jumlah, dan Kasir/Foreman!');
      const { error } = await supabase.from('penjualan_nfr').insert([{
        tanggal: formData.tanggal, shift: formData.shift, produk_nfr: nfrData.produk.nama_produk,
        jumlah: parseFloat(nfrData.jumlah), total_harga: nfrData.total_harga, kasir_foreman: nfrData.kasir_foreman
      }]);
      if (error) alert('Gagal: ' + error.message);
      else { setNfrData({ produk: null, jumlah: '', kasir_foreman: '', total_harga: '' }); fetchData(); }
    } else if (activeTab === 'VOUCHER') {
      if (!voucherData.no_voucher || !voucherData.jenis_bbm) return alert('Lengkapi No Voucher dan Jenis BBM!');
      if (!voucherData.jumlah_liter || !voucherData.operator) return alert('Lengkapi Jumlah Liter dan Nama Operator!');
      const { error } = await supabase.from('penjualan_voucher').insert([{
        tanggal: formData.tanggal, shift: formData.shift, no_voucher: voucherData.no_voucher.toUpperCase(),
        jenis_bbm: voucherData.jenis_bbm, jumlah_liter: parseFloat(voucherData.jumlah_liter),
        total_harga: voucherData.total_harga, operator: voucherData.operator.toUpperCase()
      }]);
      if (error) alert('Gagal: ' + error.message);
      else { setVoucherData({ ...voucherData, no_voucher: '', jumlah_liter: '', operator: '', total_harga: '' }); fetchData(); }
    }
  };

  const handleSimpanClosing = async (e) => {
    e.preventDefault();
    if (!closingData.uangFisik) return alert('Masukkan Uang Fisik terlebih dahulu!');
    setIsClosingSaving(true);
    const { error } = await supabase.from('tutup_kasir').insert([{
      tanggal: formData.tanggal, shift: closingData.shiftClosing,
      total_bbm: totalPendapatanBBM, total_nfr: totalPendapatanNFR,
      total_sistem: totalKeseluruhan, uang_fisik: uangFisikNum,
      selisih: selisih, keterangan: closingData.keterangan.toUpperCase(),
      kasir: 'Kasir/Manager'
    }]);
    if (error) alert('Gagal simpan tutup kasir: ' + error.message);
    else { alert('Laporan Tutup Kasir Berhasil Disimpan!'); setClosingData({ ...closingData, uangFisik: '', keterangan: '' }); setActiveTab('BBM'); }
    setIsClosingSaving(false);
  };

  const handleHapusBBM = async (id) => { if (!window.confirm('Hapus transaksi BBM ini?')) return; await supabase.from('penjualan_bbm').delete().eq('id', id); fetchData(); };
  const handleHapusNFR = async (id) => { if (!window.confirm('Hapus transaksi NFR ini?')) return; await supabase.from('penjualan_nfr').delete().eq('id', id); fetchData(); };
  const handleHapusVoucher = async (id) => { if (!window.confirm('Hapus transaksi Voucher ini?')) return; await supabase.from('penjualan_voucher').delete().eq('id', id); fetchData(); };
  const handleCetak = () => { window.print(); };

  const produkLPG = listProdukNFR.filter(p => p.kategori === 'LPG');
  const produkOLI = listProdukNFR.filter(p => p.kategori === 'OLI');

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={40} className="animate-spin text-blue-600" />
          <p className="text-sm font-medium">Memuat data kasir...</p>
        </div>
      </div>
    );
  }

  const ringkasan = [
    { label: 'Total Pendapatan', value: totalKeseluruhan, icon: DollarSign, color: 'green' },
    { label: 'Pendapatan BBM', value: totalPendapatanBBM, icon: Fuel, color: 'blue' },
    { label: 'Pendapatan NFR', value: totalPendapatanNFR, icon: ShoppingBag, color: 'orange' },
    { label: 'Pendapatan Voucher', value: totalPendapatanVoucher, icon: Ticket, color: 'purple' },
  ];

  // ================= RENDER =================
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Kasir & Penjualan</h1>
          <p className="text-slate-500 mt-1 text-sm">Catat penjualan dan lakukan tutup kasir.</p>
        </div>
        <button onClick={handleCetak} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <Printer size={16} /> Cetak Laporan
        </button>
      </div>

      {/* AREA CETAK */}
      <div className="hidden print:block mb-6">
        <KopSurat />
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">LAPORAN KASIR HARIAN</h2>
          <p className="text-sm">Tanggal: {formData.tanggal}</p>
        </div>
      </div>

      {/* DASHBOARD MINI — kartu seragam */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
        {ringkasan.map((r) => {
          const Icon = r.icon;
          const colorMap = {
            green: 'bg-green-100 text-green-600', blue: 'bg-blue-100 text-blue-600',
            orange: 'bg-orange-100 text-orange-600', purple: 'bg-purple-100 text-purple-600',
          };
          return (
            <div key={r.label} className={`${cardClass} p-4 flex items-center gap-3`}>
              <div className={`p-2.5 rounded-xl ${colorMap[r.color]}`}><Icon size={22} /></div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">{r.label}</p>
                <p className="text-lg font-bold text-slate-800 truncate">{formatRupiah(r.value)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM INPUT */}
        <div className={`lg:col-span-1 ${cardClass} p-6 h-fit no-print`}>
          {/* TAB */}
          <div className="flex flex-wrap gap-1 mb-4 p-1 bg-slate-100 rounded-xl">
            <button type="button" onClick={() => setActiveTab('BBM')} className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${activeTab === 'BBM' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}><Fuel size={14} className="inline mr-1" /> BBM</button>
            <button type="button" onClick={() => setActiveTab('NFR')} className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${activeTab === 'NFR' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}><ShoppingBag size={14} className="inline mr-1" /> NFR</button>
            <button type="button" onClick={() => setActiveTab('VOUCHER')} className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${activeTab === 'VOUCHER' ? 'bg-white text-purple-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}><Ticket size={14} className="inline mr-1" /> Voucher</button>
            <button type="button" onClick={() => setActiveTab('CLOSING')} className={`w-full mt-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${activeTab === 'CLOSING' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'text-slate-500 hover:text-slate-800'}`}>Tutup Kasir</button>
          </div>

          {activeTab !== 'CLOSING' ? (
            <form onSubmit={handleSimpanTransaksi} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                  <input type="date" value={formData.tanggal} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Shift</label>
                  <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm">
                    {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {activeTab === 'BBM' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Pompa / Dispenser</label>
                    <select value={bbmData.dispenser} onChange={(e) => setBbmData({ ...bbmData, dispenser: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm">
                      {listDispenser.map((d, i) => <option key={i} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Pilih Jenis BBM</label>
                    <div className="grid grid-cols-2 gap-2">
                      {listHargaBBM.map((bbm) => (
                        <div key={bbm.id} onClick={() => handleBBMSelect(bbm.jenis_bbm)} className={`cursor-pointer border rounded-xl p-2 flex flex-col items-center justify-center transition-all ${bbmData.jenis_bbm === bbm.jenis_bbm ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                          {bbm.logo_url ? <img src={bbm.logo_url} alt={bbm.jenis_bbm} className="h-8 object-contain mb-1" /> : <Fuel size={20} className="mb-1 text-slate-400" />}
                          <span className="text-[10px] font-bold text-center leading-tight">{bbm.jenis_bbm}</span>
                          <span className="text-[10px] font-bold mt-1 text-slate-600">{formatRupiah(bbm.harga_per_liter)}/L</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah (Liter)</label>
                    <input type="number" step="0.01" required value={bbmData.jumlah_liter} onChange={handleBBMJumlahChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-lg" placeholder="0.0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nama Operator</label>
                    <input type="text" required value={bbmData.operator} onChange={(e) => setBbmData({ ...bbmData, operator: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Nama Operator" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Total Harga (Otomatis)</label>
                    <input type="text" readOnly value={bbmData.total_harga ? formatRupiah(bbmData.total_harga) : 'Rp 0'} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold text-blue-600" />
                  </div>
                </>
              )}

              {activeTab === 'NFR' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Pilih Produk NFR</label>
                    <p className="text-[10px] font-bold text-slate-500 mb-1 mt-2">KATEGORI LPG</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {produkLPG.map(p => (
                        <div key={p.id} onClick={() => handleNFRProdukClick(p)} className={`cursor-pointer border rounded-lg p-2 flex flex-col items-center transition-all ${nfrData.produk?.id === p.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}>
                          {p.foto_url ? <img src={p.foto_url} alt={p.nama_produk} className="w-8 h-8 object-cover rounded-md mb-1" /> : <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center mb-1"><ImageIcon size={14} className="text-slate-400" /></div>}
                          <span className="text-[10px] font-semibold text-center leading-tight">{p.nama_produk}</span>
                          <span className="text-[10px] text-green-600 font-bold">{formatRupiah(p.harga_jual)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1 mt-4">KATEGORI OLI / PELUMAS</p>
                    <div className="grid grid-cols-2 gap-2 mb-3 max-h-48 overflow-y-auto pr-1">
                      {produkOLI.map(p => (
                        <div key={p.id} onClick={() => handleNFRProdukClick(p)} className={`cursor-pointer border rounded-lg p-2 flex flex-col items-center transition-all ${nfrData.produk?.id === p.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}>
                          {p.foto_url ? <img src={p.foto_url} alt={p.nama_produk} className="w-8 h-8 object-cover rounded-md mb-1" /> : <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center mb-1"><ImageIcon size={14} className="text-slate-400" /></div>}
                          <span className="text-[10px] font-semibold text-center leading-tight">{p.nama_produk}</span>
                          <span className="text-[10px] text-green-600 font-bold">{formatRupiah(p.harga_jual)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah (Pcs/Tabung)</label>
                    <input type="number" required value={nfrData.jumlah} onChange={handleNFRJumlahChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Jumlah" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nama Kasir / Foreman</label>
                    <select value={nfrData.kasir_foreman} onChange={(e) => setNfrData({ ...nfrData, kasir_foreman: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm">
                      <option value="">Pilih...</option>
                      {listKasirForeman.map((kf, i) => <option key={i} value={kf}>{kf}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Total Harga (Otomatis)</label>
                    <input type="text" readOnly value={nfrData.total_harga ? formatRupiah(nfrData.total_harga) : 'Rp 0'} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold text-blue-600" />
                  </div>
                </>
              )}

              {activeTab === 'VOUCHER' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Voucher</label>
                    <input type="text" required value={voucherData.no_voucher} onChange={(e) => setVoucherData({ ...voucherData, no_voucher: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg text-sm font-bold text-purple-700 focus:ring-2 focus:ring-purple-500" placeholder="Masukkan No. Voucher..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Jenis BBM (Voucher)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {listHargaBBM.map((bbm) => (
                        <div key={bbm.id} onClick={() => handleVoucherBBMSelect(bbm.jenis_bbm)} className={`cursor-pointer border rounded-xl p-2 flex flex-col items-center justify-center transition-all ${voucherData.jenis_bbm === bbm.jenis_bbm ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-200' : 'bg-white border-slate-200 hover:border-purple-300'}`}>
                          {bbm.logo_url ? <img src={bbm.logo_url} alt={bbm.jenis_bbm} className="h-8 object-contain mb-1" /> : <Fuel size={20} className="mb-1 text-slate-400" />}
                          <span className="text-[10px] font-bold text-center leading-tight">{bbm.jenis_bbm}</span>
                          <span className="text-[10px] font-bold mt-1 text-slate-600">{formatRupiah(bbm.harga_per_liter)}/L</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Jumlah (Liter)</label>
                    <input type="number" step="0.01" required value={voucherData.jumlah_liter} onChange={handleVoucherJumlahChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-lg" placeholder="0.0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nama Operator</label>
                    <input type="text" required value={voucherData.operator} onChange={(e) => setVoucherData({ ...voucherData, operator: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Nama Operator" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Total Harga (Otomatis)</label>
                    <input type="text" readOnly value={voucherData.total_harga ? formatRupiah(voucherData.total_harga) : 'Rp 0'} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold text-purple-600" />
                  </div>
                </>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm mt-2 text-sm">
                Simpan Transaksi {activeTab}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSimpanClosing} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
                <input type="date" value={formData.tanggal} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Shift</label>
                <select value={closingData.shiftClosing} onChange={(e) => setClosingData({ ...closingData, shiftClosing: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm">
                  {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-2 space-y-2">
                <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Total BBM</span><span className="font-semibold text-slate-800">{formatRupiah(totalPendapatanBBM)}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Total NFR</span><span className="font-semibold text-slate-800">{formatRupiah(totalPendapatanNFR)}</span></div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200"><span className="text-sm text-slate-600">Total Voucher</span><span className="font-semibold text-slate-800">{formatRupiah(totalPendapatanVoucher)}</span></div>
                <div className="flex justify-between items-center pt-1"><span className="text-sm font-bold text-slate-700">Total Sistem</span><span className="font-bold text-blue-600 text-lg">{formatRupiah(totalKeseluruhan)}</span></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Uang Fisik Diserahkan (Rp)</label>
                <input type="number" required value={closingData.uangFisik} onChange={(e) => setClosingData({ ...closingData, uangFisik: e.target.value })} className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold text-lg focus:ring-2 focus:ring-blue-500" placeholder="Masukkan uang fisik..." />
              </div>
              <div className={`p-4 rounded-xl border ${selisih === 0 ? 'bg-green-50 border-green-200' : selisih > 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-bold ${selisih === 0 ? 'text-green-700' : selisih > 0 ? 'text-blue-700' : 'text-red-700'}`}>Selisih</span>
                  <span className={`font-bold text-xl ${selisih === 0 ? 'text-green-700' : selisih > 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatRupiah(selisih)}</span>
                </div>
                <p className={`text-xs mt-1 ${selisih === 0 ? 'text-green-600' : selisih > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {selisih === 0 ? 'Uang sesuai dengan sistem.' : selisih > 0 ? 'Uang LEBIH dari sistem.' : 'Uang KURANG dari sistem.'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Keterangan (Opsional)</label>
                <textarea value={closingData.keterangan} onChange={(e) => setClosingData({ ...closingData, keterangan: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none" placeholder="Catatan tambahan..." />
              </div>
              <button type="submit" disabled={isClosingSaving} className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-sm mt-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                {isClosingSaving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : 'Simpan Tutup Kasir'}
              </button>
            </form>
          )}
        </div>

        {/* RIWAYAT TRANSAKSI */}
        <div className={`lg:col-span-2 ${cardClass} overflow-hidden no-print`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-bold text-slate-800">Riwayat Transaksi {activeTab === 'CLOSING' ? 'BBM' : activeTab} — {formData.tanggal}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'NFR' ? `${transaksiNFR.length} transaksi` : activeTab === 'VOUCHER' ? `${transaksiVoucher.length} transaksi` : `${transaksiBBM.length} transaksi`}
            </p>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            {(activeTab === 'BBM' || activeTab === 'CLOSING') && (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={`${thClass} text-left`}>Dispenser</th>
                    <th className={`${thClass} text-left`}>Jenis BBM</th>
                    <th className={`${thClass} text-right`}>Liter</th>
                    <th className={`${thClass} text-left`}>Operator</th>
                    <th className={`${thClass} text-right`}>Total</th>
                    <th className={`${thClass} text-center`}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksiBBM.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Belum ada transaksi BBM hari ini.</td></tr>
                  ) : transaksiBBM.map((t, idx) => (
                    <tr key={t.id} className={`border-b border-slate-100 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className={tdClass}>{t.dispenser}</td>
                      <td className={`${tdClass} font-medium`}>{t.jenis_bbm}</td>
                      <td className={`${tdClass} text-right tabular-nums`}>{t.jumlah_liter} L</td>
                      <td className={tdClass}>{t.operator}</td>
                      <td className={`${tdClass} text-right font-semibold text-blue-600 tabular-nums`}>{formatRupiah(t.total_harga)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleHapusBBM(t.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'NFR' && (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={`${thClass} text-left`}>Produk</th>
                    <th className={`${thClass} text-right`}>Jumlah</th>
                    <th className={`${thClass} text-left`}>Kasir/Foreman</th>
                    <th className={`${thClass} text-right`}>Total</th>
                    <th className={`${thClass} text-center`}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksiNFR.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Belum ada transaksi NFR hari ini.</td></tr>
                  ) : transaksiNFR.map((t, idx) => (
                    <tr key={t.id} className={`border-b border-slate-100 hover:bg-orange-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className={`${tdClass} font-medium`}>{t.produk_nfr}</td>
                      <td className={`${tdClass} text-right tabular-nums`}>{t.jumlah}</td>
                      <td className={tdClass}>{t.kasir_foreman}</td>
                      <td className={`${tdClass} text-right font-semibold text-orange-600 tabular-nums`}>{formatRupiah(t.total_harga)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleHapusNFR(t.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'VOUCHER' && (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={`${thClass} text-left`}>No Voucher</th>
                    <th className={`${thClass} text-left`}>Jenis BBM</th>
                    <th className={`${thClass} text-right`}>Liter</th>
                    <th className={`${thClass} text-left`}>Operator</th>
                    <th className={`${thClass} text-right`}>Total</th>
                    <th className={`${thClass} text-center`}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksiVoucher.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Belum ada transaksi Voucher hari ini.</td></tr>
                  ) : transaksiVoucher.map((t, idx) => (
                    <tr key={t.id} className={`border-b border-slate-100 hover:bg-purple-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                      <td className={`${tdClass} font-mono font-medium`}>{t.no_voucher}</td>
                      <td className={tdClass}>{t.jenis_bbm}</td>
                      <td className={`${tdClass} text-right tabular-nums`}>{t.jumlah_liter} L</td>
                      <td className={tdClass}>{t.operator}</td>
                      <td className={`${tdClass} text-right font-semibold text-purple-600 tabular-nums`}>{formatRupiah(t.total_harga)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleHapusVoucher(t.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* FOOTER TOTAL */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total {activeTab === 'CLOSING' ? 'BBM' : activeTab}</span>
            <span className="text-base font-bold text-blue-600 tabular-nums">
              {formatRupiah(activeTab === 'NFR' ? totalPendapatanNFR : activeTab === 'VOUCHER' ? totalPendapatanVoucher : totalPendapatanBBM)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}