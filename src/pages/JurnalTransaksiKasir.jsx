// src/pages/JurnalTransaksiKasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Save, Fuel, Ticket, ShoppingBag, Droplet, BookOpen, Printer, Image as ImageIcon, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import KopSurat from '../components/KopSurat';

export default function JurnalTransaksiKasir() {
  const [activeTab, setActiveTab] = useState('BBM'); // 'BBM', 'VOUCHER', 'LPG', 'OLI', 'LAINNYA', 'JURNAL'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listShift, setListShift] = useState([]);
  const [masterProdukBBM, setMasterProdukBBM] = useState([]);
  const [masterProdukNFR, setMasterProdukNFR] = useState([]);
  const [masterKodeAkun, setMasterKodeAkun] = useState([]);
  const [jurnalHariIni, setJurnalHariIni] = useState([]);
  
  // State Voucher
  const [daftarVoucherHariIni, setDaftarVoucherHariIni] = useState([]);
  const [daftarCustomer, setDaftarCustomer] = useState([]);
  const [checklistSementara, setChecklistSementara] = useState({});
  const [lastVoucherNumber, setLastVoucherNumber] = useState(0);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    shift: '',
  });

  // State Form BBM
  const [bbmData, setBbmData] = useState({ dispenser: 'DISPENSER 1', jenis_bbm: '', jumlah_liter: '', operator: '', total_harga: '', reff: '' });
  
  // State Form Voucher
  const [voucherData, setVoucherData] = useState({ no_awal: '', no_akhir: '', customer: '', nominal: '' });

  // State Form LPG & Oli
  const [nfrData, setNfrData] = useState({ produk: null, jumlah: '', total_harga: '', reff: '' });

  // State Form Transaksi Lainnya
  const [lainnyaData, setLainnyaData] = useState({ dari_ke: '', uraian_kegiatan: '', reff: '', debet: '', kredit: '' });

  const listDispenser = ['DISPENSER 1', 'DISPENSER 2', 'DISPENSER 3', 'DISPENSER 4', 'DISPENSER 5'];

  const fetchData = async () => {
    setIsLoading(true);

    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData && shiftData.length > 0) {
      setListShift(shiftData.map(s => s.nama_shift));
      if (!formData.shift) setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
    }

    const { data: bbmData } = await supabase.from('master_produk_bbm').select('*');
    if (bbmData) setMasterProdukBBM(bbmData);

    const { data: nfrData } = await supabase.from('master_produk_nfr').select('*');
    if (nfrData) setMasterProdukNFR(nfrData);

    const { data: kodeAkunData } = await supabase.from('master_kode_akun').select('*');
    if (kodeAkunData) setMasterKodeAkun(kodeAkunData);

    let qJurnal = supabase.from('jurnal_kasir').select('*').eq('tanggal', formData.tanggal).order('created_at', { ascending: true });
    if (formData.shift) qJurnal = qJurnal.eq('shift', formData.shift);
    const { data: dataJurnal } = await qJurnal;
    if (dataJurnal) setJurnalHariIni(dataJurnal);

    let qVoucher = supabase.from('penjualan_voucher').select(`
      *,
      voucher_masuk (id, no_voucher_lembar, nominal, tanggal_masuk)
    `).eq('tanggal', formData.tanggal).order('created_at', { ascending: true });
    
    if (formData.shift) qVoucher = qVoucher.eq('shift', formData.shift);
    
    const { data: dataVoucher } = await qVoucher;
    if (dataVoucher) {
      setDaftarVoucherHariIni(dataVoucher);
      const uniqueCustomers = [...new Set(dataVoucher.map(v => v.nama_customer).filter(Boolean))];
      setDaftarCustomer(uniqueCustomers);
    }

    // Ambil Nomor Voucher Terakhir (Auto-Lanjut)
    const { data: lastVoucher } = await supabase
      .from('penjualan_voucher')
      .select('no_voucher')
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastVoucher && lastVoucher.length > 0) {
      const parts = lastVoucher[0].no_voucher.split('-');
      const lastAkhir = parseInt(parts[1] || parts[0]);
      if (!isNaN(lastAkhir)) {
        setLastVoucherNumber(lastAkhir);
        setVoucherData(prev => ({ ...prev, no_awal: (lastAkhir + 1).toString() }));
      }
    } else {
      setLastVoucherNumber(0);
      setVoucherData(prev => ({ ...prev, no_awal: '1' }));
    }

    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [formData.tanggal, formData.shift]);

  // === HANDLERS BBM ===
  const handleBBMJumlahChange = (e) => {
    const jumlah = e.target.value;
    let total = 0;
    if (jumlah && bbmData.jenis_bbm) {
      const selectedBBM = masterProdukBBM.find(b => b.jenis_bbm === bbmData.jenis_bbm);
      if (selectedBBM) total = parseFloat(jumlah) * selectedBBM.harga_per_liter;
    }
    setBbmData({ ...bbmData, jumlah_liter: jumlah, total_harga: total });
  };

  const handleBBMSelect = (jenis_bbm) => {
    const selectedBBM = masterProdukBBM.find(b => b.jenis_bbm === jenis_bbm);
    const total = (bbmData.jumlah_liter && selectedBBM) ? parseFloat(bbmData.jumlah_liter) * selectedBBM.harga_per_liter : 0;
    setBbmData({ ...bbmData, jenis_bbm, total_harga: total });
  };

  // === HANDLERS NFR (LPG/OLI) ===
  const handleNFRProdukClick = (produk, tabAktif) => {
    let defaultReff = '';
    if (tabAktif === 'LPG') defaultReff = 'SP 4121';
    if (tabAktif === 'OLI') defaultReff = 'SP 4122';
    setNfrData({ ...nfrData, produk: produk, total_harga: nfrData.jumlah ? nfrData.jumlah * produk.harga_jual : 0, reff: defaultReff });
  };

  const handleNFRJumlahChange = (e) => {
    const jumlah = e.target.value;
    let total = 0;
    if (nfrData.produk && jumlah) total = parseFloat(jumlah) * nfrData.produk.harga_jual;
    setNfrData({ ...nfrData, jumlah: jumlah, total_harga: total });
  };

  // === HITUNG SELISIH VOUCHER ===
  const hitungTotalLembar = () => {
    const awal = parseInt(voucherData.no_awal);
    const akhir = parseInt(voucherData.no_akhir);
    if (!isNaN(awal) && !isNaN(akhir) && akhir >= awal) return (akhir - awal) + 1;
    return 0;
  };

  const totalLembar = hitungTotalLembar();
  const totalNominalVoucher = totalLembar * (parseFloat(voucherData.nominal) || 0);

  // === SIMPAN VOUCHER BARU ===
  const handleSimpanVoucher = async (e) => {
    e.preventDefault();
    const noAwal = parseInt(voucherData.no_awal);
    const noAkhir = parseInt(voucherData.no_akhir);

    if (noAwal <= lastVoucherNumber) return alert(`Nomor Awal harus lebih besar dari nomor terakhir (${lastVoucherNumber}). Tidak boleh ada nomor ganda!`);
    if (noAkhir < noAwal) return alert('Nomor Akhir harus lebih besar atau sama dengan Nomor Awal!');
    if (!voucherData.customer || !voucherData.nominal) return alert('Lengkapi Nama Customer dan Nominal Voucher!');

    setIsSaving(true);
    const formatNo = `${noAwal} - ${noAkhir}`;

    const { error } = await supabase.from('penjualan_voucher').insert([{
      tanggal: formData.tanggal, shift: formData.shift, no_voucher: formatNo,
      nama_customer: voucherData.customer.toUpperCase(), nominal: parseFloat(voucherData.nominal),
      total_harga: totalNominalVoucher, status_voucher: 'PENDING', operator: 'KASIR', jenis_bbm: '-', jumlah_liter: 0
    }]);

    if (error) alert('Gagal simpan voucher: ' + error.message);
    else { setVoucherData({ no_awal: '', no_akhir: '', customer: '', nominal: '' }); fetchData(); }
    setIsSaving(false);
  };

  // === CENTANG CHECKLIST SEMENTARA ===
  const toggleChecklist = (voucherId, noLembar) => {
    setChecklistSementara(prev => {
      const currentList = prev[voucherId] || [];
      if (currentList.includes(noLembar)) {
        return { ...prev, [voucherId]: currentList.filter(n => n !== noLembar) };
      } else {
        return { ...prev, [voucherId]: [...currentList, noLembar] };
      }
    });
  };

  // === SIMPAN CHECKLIST MASSAL ===
  const handleSimpanChecklist = async (bundel) => {
    const selectedLembar = checklistSementara[bundel.id] || [];
    if (selectedLembar.length === 0) return alert('Pilih minimal satu nomor voucher yang akan di-checklist!');
    if (!window.confirm(`Apakah Anda Yakin Sudah Selesai Checklist ${selectedLembar.length} Lembar untuk Voucher ${bundel.no_voucher}?`)) return;

    setIsSaving(true);
    const today = new Date();
    today.setMonth(today.getMonth() + 6);
    const tglKedaluwarsa = today.toISOString().split('T')[0];
    const totalNominalMasuk = selectedLembar.length * bundel.nominal;

    for (const noLembar of selectedLembar) {
      await supabase.from('voucher_masuk').insert([{
        voucher_bundel_id: bundel.id, no_voucher_lembar: noLembar, nominal: bundel.nominal, tanggal_masuk: today.toISOString().split('T')[0]
      }]);
    }

    const saldoSebelumnya = jurnalHariIni.length > 0 ? jurnalHariIni[jurnalHariIni.length - 1].saldo : 0;
    const saldoBaru = saldoSebelumnya + totalNominalMasuk;

    await supabase.from('jurnal_kasir').insert([{
      tanggal: bundel.tanggal, shift: bundel.shift, dari_ke: `VOUCHER - ${bundel.nama_customer}`,
      uraian_kegiatan: `Penerimaan Voucher BBM ${selectedLembar.length} Lembar`, reff: 'SP-2100',
      debet: totalNominalMasuk, kredit: 0, saldo: saldoBaru, created_by: 'Kasir'
    }]);

    await supabase.from('penjualan_voucher').update({ 
      status_voucher: 'MASUK', tanggal_kedaluwarsa: bundel.tanggal_kedaluwarsa || tglKedaluwarsa
    }).eq('id', bundel.id);

    setChecklistSementara(prev => { const newState = { ...prev }; delete newState[bundel.id]; return newState; });
    fetchData();
    setIsSaving(false);
  };

  // === SIMPAN BBM, LPG, OLI, LAINNYA KE JURNAL ===
  const handleSimpanTransaksi = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    let payloadJurnal = {};

    if (activeTab === 'BBM') {
      if (!bbmData.jenis_bbm || !bbmData.jumlah_liter) { alert('Lengkapi data BBM!'); setIsSaving(false); return; }
      payloadJurnal = { dari_ke: 'SPBU 14.294.739', uraian_kegiatan: `PENJUALAN BBM ${bbmData.jenis_bbm}`, reff: bbmData.reff || 'SP-4100', debet: bbmData.total_harga, kredit: 0 };
      await supabase.from('penjualan_bbm').insert([{ tanggal: formData.tanggal, shift: formData.shift, dispenser: bbmData.dispenser, jenis_bbm: bbmData.jenis_bbm, jumlah_liter: parseFloat(bbmData.jumlah_liter), total_harga: bbmData.total_harga, operator: bbmData.operator.toUpperCase() || 'OPERATOR' }]);
      setBbmData({ ...bbmData, jumlah_liter: '', operator: '', total_harga: '', jenis_bbm: '' });

    } else if (activeTab === 'LPG' || activeTab === 'OLI') {
      if (!nfrData.produk || !nfrData.jumlah) { alert('Lengkapi data Produk!'); setIsSaving(false); return; }
      payloadJurnal = { dari_ke: `PENJUALAN ${activeTab}`, uraian_kegiatan: `Produk: ${nfrData.produk.nama_produk}`, reff: nfrData.reff, debet: nfrData.total_harga, kredit: 0 };
      await supabase.from('penjualan_nfr').insert([{ tanggal: formData.tanggal, shift: formData.shift, produk_nfr: nfrData.produk.nama_produk, jumlah: parseFloat(nfrData.jumlah), total_harga: nfrData.total_harga, kasir_foreman: 'KASIR' }]);
      setNfrData({ produk: null, jumlah: '', total_harga: '', reff: '' });

    } else if (activeTab === 'LAINNYA') {
      if (!lainnyaData.dari_ke || !lainnyaData.uraian_kegiatan) { alert('Lengkapi Dari/Ke dan Uraian!'); setIsSaving(false); return; }
      if (!lainnyaData.debet && !lainnyaData.kredit) { alert('Isi salah satu: Debet atau Kredit!'); setIsSaving(false); return; }
      
      const debetNum = parseFloat(lainnyaData.debet) || 0;
      const kreditNum = parseFloat(lainnyaData.kredit) || 0;
      
      payloadJurnal = { 
        dari_ke: lainnyaData.dari_ke.toUpperCase(), 
        uraian_kegiatan: lainnyaData.uraian_kegiatan.toUpperCase(), 
        reff: lainnyaData.reff.toUpperCase(), 
        debet: debetNum, 
        kredit: kreditNum 
      };
    }

    const saldoSebelumnya = jurnalHariIni.length > 0 ? jurnalHariIni[jurnalHariIni.length - 1].saldo : 0;
    const saldoBaru = saldoSebelumnya + payloadJurnal.debet - payloadJurnal.kredit;

    const { error } = await supabase.from('jurnal_kasir').insert([{
      tanggal: formData.tanggal, shift: formData.shift, dari_ke: payloadJurnal.dari_ke, uraian_kegiatan: payloadJurnal.uraian_kegiatan, reff: payloadJurnal.reff, debet: payloadJurnal.debet, kredit: payloadJurnal.kredit, saldo: saldoBaru, created_by: 'Kasir'
    }]);

    if (error) alert('Gagal simpan ke jurnal: ' + error.message);
    else {
      if (activeTab === 'LAINNYA') setLainnyaData({ dari_ke: '', uraian_kegiatan: '', reff: '', debet: '', kredit: '' });
      fetchData();
    }
    setIsSaving(false);
  };

  const totalDebetBBM = jurnalHariIni.filter(j => j.dari_ke.includes('SPBU') && j.uraian_kegiatan.includes('BBM')).reduce((a, b) => a + b.debet, 0);
  const totalDebetNFR = jurnalHariIni.filter(j => j.dari_ke.includes('LPG') || j.dari_ke.includes('OLI')).reduce((a, b) => a + b.debet, 0);
  const totalDebetVoucher = jurnalHariIni.filter(j => j.dari_ke.includes('VOUCHER')).reduce((a, b) => a + b.debet, 0);
  const totalKeseluruhan = totalDebetBBM + totalDebetNFR + totalDebetVoucher;

  const produkLPG = masterProdukNFR.filter(p => p.kategori === 'LPG');
  const produkOLI = masterProdukNFR.filter(p => p.kategori === 'OLI');

  // FILTER KODE AKUN BERDASARKAN TAB
  const getFilteredKodeAkun = () => {
    if (activeTab === 'LPG') return masterKodeAkun.filter(k => k.nama_transaksi.toLowerCase().includes('lpg'));
    if (activeTab === 'OLI') return masterKodeAkun.filter(k => k.nama_transaksi.toLowerCase().includes('oli'));
    if (activeTab === 'BBM') return masterKodeAkun.filter(k => k.nama_transaksi.toLowerCase().includes('bbm'));
    return masterKodeAkun;
  };

  const generateNomorLembar = (bundel) => {
    const [awal, akhir] = bundel.no_voucher.split('-').map(s => parseInt(s.trim()));
    const nomorLembar = [];
    if (!isNaN(awal) && !isNaN(akhir)) {
      for (let i = awal; i <= akhir; i++) {
        const noStr = i.toString().padStart(4, '0');
        const sudahMasuk = bundel.voucher_masuk?.some(v => v.no_voucher_lembar === noStr);
        nomorLembar.push({ no: noStr, sudahMasuk });
      }
    }
    return nomorLembar;
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Jurnal Transaksi Harian Kasir</h1>
          <p className="text-slate-500 text-sm mt-1">Catat penjualan di sini. Data otomatis masuk ke Buku Jurnal dan Setoran.</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
          <Printer size={18} /> Cetak Jurnal
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 no-print">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><p className="text-[10px] text-slate-500 font-bold uppercase">Total BBM</p><p className="text-sm font-bold text-blue-600">{formatRupiah(totalDebetBBM)}</p></div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><p className="text-[10px] text-slate-500 font-bold uppercase">Total NFR (LPG/Oli)</p><p className="text-sm font-bold text-orange-600">{formatRupiah(totalDebetNFR)}</p></div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><p className="text-[10px] text-slate-500 font-bold uppercase">Total Voucher (Masuk)</p><p className="text-sm font-bold text-purple-600">{formatRupiah(totalDebetVoucher)}</p></div>
        <div className="bg-slate-800 p-3 rounded-xl shadow-md"><p className="text-[10px] text-slate-300 font-bold uppercase">Total Pendapatan</p><p className="text-sm font-bold text-green-400">{formatRupiah(totalKeseluruhan)}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: FORM INPUT */}
        {activeTab !== 'JURNAL' && (
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit no-print animate-in fade-in slide-in-from-left-4">
            <div className="flex flex-wrap gap-1 mb-4 p-1 bg-slate-100 rounded-xl">
              <button type="button" onClick={() => setActiveTab('BBM')} className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'BBM' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Fuel size={12} className="inline mr-1"/> BBM</button>
              <button type="button" onClick={() => setActiveTab('VOUCHER')} className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'VOUCHER' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}><Ticket size={12} className="inline mr-1"/> Voucher</button>
              <button type="button" onClick={() => setActiveTab('LPG')} className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'LPG' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}><Droplet size={12} className="inline mr-1"/> LPG</button>
              <button type="button" onClick={() => setActiveTab('OLI')} className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'OLI' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}><ShoppingBag size={12} className="inline mr-1"/> Oli</button>
              <button type="button" onClick={() => setActiveTab('LAINNYA')} className={`w-full mt-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex justify-center items-center ${activeTab === 'LAINNYA' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><FileText size={12} className="inline mr-1"/> Lainnya</button>
            </div>

            <form onSubmit={activeTab === 'VOUCHER' ? handleSimpanVoucher : handleSimpanTransaksi} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Tanggal</label>
                  {/* INI BAGIAN YANG DIPERBAIKI AGAR BISA DI-EDIT */}
                  <input 
                    type="date" 
                    value={formData.tanggal} 
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} 
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Shift</label>
                  <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs">
                    {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {activeTab === 'BBM' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Pompa / Dispenser</label>
                    <select value={bbmData.dispenser} onChange={(e) => setBbmData({ ...bbmData, dispenser: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs">
                      {listDispenser.map((d, i) => <option key={i} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Jenis BBM</label>
                    <div className="grid grid-cols-2 gap-2">
                      {masterProdukBBM.map((bbm) => (
                        <div key={bbm.id} onClick={() => handleBBMSelect(bbm.jenis_bbm)} className={`cursor-pointer border rounded-xl p-2 flex flex-col items-center justify-center transition-all ${bbmData.jenis_bbm === bbm.jenis_bbm ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                          {bbm.logo_url ? <img src={bbm.logo_url} alt={bbm.jenis_bbm} className="h-8 object-contain mb-1" /> : <Fuel size={20} className="mb-1 text-slate-400" />}
                          <span className="text-[10px] font-bold text-center leading-tight">{bbm.jenis_bbm}</span>
                          <span className="text-[10px] font-bold mt-1 text-slate-600">{formatRupiah(bbm.harga_per_liter)}/L</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Jumlah (Liter)</label>
                      <input type="number" step="0.01" required value={bbmData.jumlah_liter} onChange={handleBBMJumlahChange} className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold" placeholder="0.0" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Operator</label>
                      <input type="text" required value={bbmData.operator} onChange={(e) => setBbmData({ ...bbmData, operator: e.target.value.toUpperCase() })} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="Nama..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Kode Akun / Reff</label>
                    <select value={bbmData.reff} onChange={(e) => setBbmData({ ...bbmData, reff: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs">
                      <option value="">-- Pilih Kode Akun --</option>
                      {getFilteredKodeAkun().map((k, i) => <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>)}
                    </select>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-bold mb-0.5">Total Harga:</p>
                    <p className="text-lg font-black text-blue-700">{formatRupiah(bbmData.total_harga)}</p>
                  </div>
                </>
              )}

              {activeTab === 'VOUCHER' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Awal No. Voucher</label>
                      <input type="number" required value={voucherData.no_awal} onChange={(e) => setVoucherData({ ...voucherData, no_awal: e.target.value })} className="w-full px-2 py-1.5 border-2 border-purple-300 rounded-lg text-xs font-bold text-purple-700" placeholder="Cth: 1" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Akhir No. Voucher</label>
                      <input type="number" required value={voucherData.no_akhir} onChange={(e) => setVoucherData({ ...voucherData, no_akhir: e.target.value })} className="w-full px-2 py-1.5 border-2 border-purple-300 rounded-lg text-xs font-bold text-purple-700" placeholder="Cth: 10" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">*Nomor awal terisi otomatis melanjutkan nomor terakhir.</p>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Customer / Instansi</label>
                    <input type="text" list="customer-list" required value={voucherData.customer} onChange={(e) => setVoucherData({ ...voucherData, customer: e.target.value.toUpperCase() })} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="Ketik atau Pilih..." />
                    <datalist id="customer-list">
                      {daftarCustomer.map((c, i) => <option key={i} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nominal / Lembar (Rp)</label>
                    <input type="number" required value={voucherData.nominal} onChange={(e) => setVoucherData({ ...voucherData, nominal: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold" placeholder="Cth: 50000" />
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                    <div className="flex justify-between text-[10px] font-bold text-purple-600 mb-0.5">
                      <span>Total Lembar:</span>
                      <span>{totalLembar} Lembar</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-purple-600 font-bold">Total Tagihan:</p>
                      <p className="text-lg font-black text-purple-700">{formatRupiah(totalNominalVoucher)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">*Status PENDING. Ceklis per lembar jika fisik voucher diterima.</p>
                </>
              )}

              {(activeTab === 'LPG' || activeTab === 'OLI') && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Produk {activeTab}</label>
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                      {(activeTab === 'LPG' ? produkLPG : produkOLI).map(p => (
                        <div key={p.id} onClick={() => handleNFRProdukClick(p, activeTab)} className={`cursor-pointer border rounded-lg p-1.5 flex flex-col items-center transition-all ${nfrData.produk?.id === p.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200'}`}>
                          {p.foto_url ? <img src={p.foto_url} alt={p.nama_produk} className="w-8 h-8 object-cover rounded-md mb-1" /> : <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center mb-1"><ImageIcon size={14} className="text-slate-400" /></div>}
                          <span className="text-[10px] font-semibold text-center leading-tight mb-1">{p.nama_produk}</span>
                          <span className="text-[9px] text-green-600 font-bold">{formatRupiah(p.harga_jual)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Jumlah (Pcs/Tabung)</label>
                    <input type="number" required value={nfrData.jumlah} onChange={handleNFRJumlahChange} className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Kode Akun / Reff</label>
                    <select value={nfrData.reff} onChange={(e) => setNfrData({ ...nfrData, reff: e.target.value })} className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs">
                      <option value="">-- Pilih Kode Akun --</option>
                      {getFilteredKodeAkun().map((k, i) => <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>)}
                    </select>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-bold mb-0.5">Total Harga:</p>
                    <p className="text-lg font-black text-emerald-700">{formatRupiah(nfrData.total_harga)}</p>
                  </div>
                </>
              )}

              {activeTab === 'LAINNYA' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Dari / Ke</label>
                    <select value={lainnyaData.dari_ke} onChange={(e) => setLainnyaData({...lainnyaData, dari_ke: e.target.value})} className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs">
                      <option value="">-- Pilih --</option>
                      <option value="KASIR">KASIR</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="ACCOUNTING">ACCOUNTING</option>
                      <option value="BANK BJB">BANK BJB</option>
                      <option value="BANK BRI">BANK BRI</option>
                      <option value="TMB (TATA MURTAYA BERSAMA)">TMB (TATA MURTAYA BERSAMA)</option>
                      <option value="OPERASIONAL">OPERASIONAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Uraian Kegiatan</label>
                    <input type="text" required value={lainnyaData.uraian_kegiatan} onChange={(e) => setLainnyaData({...lainnyaData, uraian_kegiatan: e.target.value.toUpperCase()})} className="w-full px-2 py-1.5 border rounded-lg text-xs" placeholder="Cth: Beli Air Minum" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Kode Akun / Reff</label>
                    <select value={lainnyaData.reff} onChange={(e) => setLainnyaData({...lainnyaData, reff: e.target.value})} className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs">
                      <option value="">-- Pilih Kode Akun --</option>
                      {masterKodeAkun.map((k, i) => <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-green-700 mb-1">Debet (Masuk)</label>
                      <input type="number" value={lainnyaData.debet} onChange={(e) => setLainnyaData({...lainnyaData, debet: e.target.value, kredit: ''})} className="w-full px-2 py-1.5 border-2 border-green-200 rounded-lg text-xs font-bold text-green-700 focus:ring-2 focus:ring-green-500" placeholder="Rp" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-red-700 mb-1">Kredit (Keluar)</label>
                      <input type="number" value={lainnyaData.kredit} onChange={(e) => setLainnyaData({...lainnyaData, kredit: e.target.value, debet: ''})} className="w-full px-2 py-1.5 border-2 border-red-200 rounded-lg text-xs font-bold text-red-700 focus:ring-2 focus:ring-red-500" placeholder="Rp" />
                    </div>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 mt-2">
                    <p className="text-[10px] text-slate-600 font-bold mb-0.5">Total:</p>
                    <p className="text-lg font-black text-slate-800">{formatRupiah(lainnyaData.debet ? lainnyaData.debet : lainnyaData.kredit ? -lainnyaData.kredit : 0)}</p>
                  </div>
                </>
              )}

              <button type="submit" disabled={isSaving} className="w-full bg-slate-800 text-white font-semibold py-2.5 rounded-xl hover:bg-slate-900 transition-colors shadow-sm text-xs mt-2 disabled:opacity-50">
                {isSaving ? 'Menyimpan...' : activeTab === 'VOUCHER' ? 'Simpan Data Voucher (Pending)' : 'Simpan & Masukkan ke Jurnal'}
              </button>
            </form>
          </div>
        )}

        <div className={`${activeTab === 'JURNAL' ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-6 no-print`}>
          
          <div className="flex bg-slate-200 p-1 rounded-xl w-fit mb-2">
            <button onClick={() => setActiveTab('BBM')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${['BBM','VOUCHER','LPG','OLI','LAINNYA'].includes(activeTab) ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Input Transaksi</button>
            <button onClick={() => setActiveTab('JURNAL')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'JURNAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><BookOpen size={14}/> Jurnal Harian Kasir</button>
          </div>

          {activeTab === 'VOUCHER' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
              <div className="p-4 border-b border-slate-100 bg-purple-50 flex justify-between items-center">
                <h2 className="text-sm font-bold text-purple-900 flex items-center gap-2"><Ticket size={16} className="text-purple-600"/> Daftar Bundel Voucher</h2>
                <p className="text-xs text-purple-600 font-medium">Centang nomor lembar, lalu klik Aksi</p>
              </div>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-xs">
                  <thead className="bg-white text-slate-500 sticky top-0 z-10 border-b">
                    <tr>
                      <th className="px-3 py-3 text-left">No Voucher</th>
                      <th className="px-3 py-3 text-left">Customer</th>
                      <th className="px-3 py-3 text-right">Nominal/Lembar</th>
                      <th className="px-3 py-3 text-center">Checklist Masuk</th>
                      <th className="px-3 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daftarVoucherHariIni.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">Belum ada input voucher hari ini.</td></tr>
                    ) : daftarVoucherHariIni.map((v) => {
                      const lembaran = generateNomorLembar(v);
                      const isExpired = v.tanggal_kedaluwarsa && new Date(v.tanggal_kedaluwarsa) < new Date();
                      const checkedList = checklistSementara[v.id] || [];
                      
                      return (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="px-3 py-3 font-bold text-slate-700">
                            {v.no_voucher}
                            {isExpired && <span className="block text-[9px] text-red-500 mt-1"><AlertTriangle size={10} className="inline"/> HANGUS</span>}
                          </td>
                          <td className="px-3 py-3 text-slate-600">{v.nama_customer}</td>
                          <td className="px-3 py-3 text-right font-mono font-semibold text-purple-700">{formatRupiah(v.nominal)}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {lembaran.map((l, i) => {
                                const isChecked = checkedList.includes(l.no);
                                return (
                                  <label
                                    key={i}
                                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                      l.sudahMasuk 
                                        ? 'bg-green-100 text-green-700 border-green-300 cursor-not-allowed' 
                                        : isExpired 
                                          ? 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed'
                                          : isChecked
                                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      className="hidden"
                                      disabled={l.sudahMasuk || isExpired}
                                      checked={l.sudahMasuk || isChecked}
                                      onChange={() => toggleChecklist(v.id, l.no)}
                                    />
                                    {l.no} {l.sudahMasuk && '✓'}
                                  </label>
                                )
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button 
                              onClick={() => handleSimpanChecklist(v)}
                              disabled={checkedList.length === 0 || isSaving}
                              className={`px-3 py-1.5 rounded-lg font-semibold text-[10px] shadow-sm transition-colors ${
                                checkedList.length > 0 
                                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Proses Checklist ({checkedList.length})
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(activeTab === 'JURNAL' || ['BBM','LPG','OLI','LAINNYA'].includes(activeTab)) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BookOpen size={16} className="text-slate-500"/> Buku Jurnal Harian Kasir</h2>
                <p className="text-xs text-slate-500">{jurnalHariIni.length} transaksi</p>
              </div>

              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-3 text-left">Dari / Ke</th>
                      <th className="px-3 py-3 text-left">Uraian</th>
                      <th className="px-3 py-3 text-center">Reff</th>
                      <th className="px-3 py-3 text-right">Debet (Rp)</th>
                      <th className="px-3 py-3 text-right">Kredit (Rp)</th>
                      <th className="px-3 py-3 text-right">Saldo (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jurnalHariIni.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">Belum ada transaksi hari ini.</td></tr>
                    ) : jurnalHariIni.map((item, idx) => (
                      <tr key={item.id} className={`hover:bg-slate-50 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-3 py-2 font-semibold text-slate-800">{item.dari_ke}</td>
                        <td className="px-3 py-2 text-slate-600">{item.uraian_kegiatan}</td>
                        <td className="px-3 py-2 text-center text-slate-400">{item.reff || '-'}</td>
                        <td className="px-3 py-2 text-right font-medium text-green-600">{item.debet > 0 ? formatRupiah(item.debet) : '-'}</td>
                        <td className="px-3 py-2 text-right font-medium text-red-600">{item.kredit > 0 ? formatRupiah(item.kredit) : '-'}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-800 bg-slate-50/50">{formatRupiah(item.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="hidden print:block print-area w-full">
        <KopSurat judul="JURNAL TRANSAKSI HARIAN KASIR" periode={`Tanggal: ${new Date(formData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - Shift: ${formData.shift}`} />
        
        <table className="w-full text-xs border-collapse mt-4">
          <thead>
            <tr className="bg-slate-100 border-y-2 border-black">
              <th className="border border-black px-2 py-2 text-left">Dari / Ke</th>
              <th className="border border-black px-2 py-2 text-left">Uraian Kegiatan</th>
              <th className="border border-black px-2 py-2 text-center">Reff</th>
              <th className="border border-black px-2 py-2 text-right">Debet (Rp)</th>
              <th className="border border-black px-2 py-2 text-right">Kredit (Rp)</th>
              <th className="border border-black px-2 py-2 text-right">Saldo (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {jurnalHariIni.map((item) => (
              <tr key={item.id}>
                <td className="border border-black px-2 py-1.5 font-semibold">{item.dari_ke}</td>
                <td className="border border-black px-2 py-1.5">{item.uraian_kegiatan}</td>
                <td className="border border-black px-2 py-1.5 text-center">{item.reff || '-'}</td>
                <td className="border border-black px-2 py-1.5 text-right">{item.debet > 0 ? formatRupiah(item.debet) : '-'}</td>
                <td className="border border-black px-2 py-1.5 text-right">{item.kredit > 0 ? formatRupiah(item.kredit) : '-'}</td>
                <td className="border border-black px-2 py-1.5 text-right font-bold">{formatRupiah(item.saldo)}</td>
              </tr>
            ))}
            <tr className="bg-slate-200 border-t-2 border-black font-bold">
              <td colSpan={3} className="border border-black px-2 py-2 text-right uppercase">Total</td>
              <td className="border border-black px-2 py-2 text-right">{formatRupiah(totalDebetBBM + totalDebetNFR + totalDebetVoucher)}</td>
              <td className="border border-black px-2 py-2 text-right">Rp 0</td>
              <td className="border border-black px-2 py-2 text-right">{formatRupiah(jurnalHariIni.length > 0 ? jurnalHariIni[jurnalHariIni.length - 1].saldo : 0)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between mt-12 px-8 text-sm font-semibold text-black">
          <div className="text-center flex flex-col justify-between h-28">
            <p>Kasir</p>
            <p className="mt-16">(...................................)</p>
          </div>
          <div className="text-center flex flex-col justify-between h-28">
            <p>Diperiksa Oleh,<br/>Accounting</p>
            <p className="mt-12">(...................................)</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-area { display: block !important; }
          .bg-slate-100 { background-color: #f3f4f6 !important; }
          .bg-slate-200 { background-color: #e5e7eb !important; }
          th, td { color: black !important; }
        }
      `}} />
    </div>
  );
}