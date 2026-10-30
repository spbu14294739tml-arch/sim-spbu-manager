// src/pages/JurnalTransaksiKasir.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Printer, BookOpen } from 'lucide-react';
import KopSurat from '../components/KopSurat';

// Helper
import {
  hitungTotalLembar as hitungTotalLembarHelper,
  generateNomorLembar,
  getFilteredKodeAkun as getFilteredKodeAkunHelper,
  hitungTotalKategori,
} from '../lib/jurnalHelpers';

// Komponen (dari Sesi 1-5A)
import TabNavigator from '../components/jurnal/TabNavigator';
import FormBBM from '../components/jurnal/FormBBM';
import FormVoucher from '../components/jurnal/FormVoucher';
import FormNFR from '../components/jurnal/FormNFR';
import FormLainnya from '../components/jurnal/FormLainnya';
import FormKoreksi from '../components/jurnal/FormKoreksi';
import TabelJurnal from '../components/jurnal/TabelJurnal';
import TabelVoucher from '../components/jurnal/TabelVoucher';

export default function JurnalTransaksiKasir() {
  const [activeTab, setActiveTab] = useState('BBM');
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

  // State Form Lainnya
  const [lainnyaData, setLainnyaData] = useState({ dari_ke: '', uraian_kegiatan: '', reff: '', debet: '', kredit: '' });

  // State Form Koreksi
  const [koreksiData, setKoreksiData] = useState({
    tanggal_asli: new Date().toISOString().split('T')[0],
    shift_asli: '',
    jenis: 'BBM',
    uraian_asli: '',
    nominal_asli: '',
    nominal_benar: '',
    reff: '',
    alasan: '',
  });

  const listDispenser = ['DISPENSER 1', 'DISPENSER 2', 'DISPENSER 3', 'DISPENSER 4', 'DISPENSER 5'];

  const fetchData = async () => {
    setIsLoading(true);

    const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
    if (shiftData && shiftData.length > 0) {
      setListShift(shiftData.map(s => s.nama_shift));
      if (!formData.shift) setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
    }

    const { data: bbmDataRes } = await supabase.from('master_produk_bbm').select('*');
    if (bbmDataRes) setMasterProdukBBM(bbmDataRes);

    const { data: nfrDataRes } = await supabase.from('master_produk_nfr').select('*');
    if (nfrDataRes) setMasterProdukNFR(nfrDataRes);

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

    // Auto-lanjut nomor voucher
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

  // === HANDLERS NFR ===
  const handleNFRProdukClick = (produk, tabAktif) => {
    let defaultReff = '';
    if (tabAktif === 'LPG') defaultReff = 'SP 4121';
    if (tabAktif === 'OLI') defaultReff = 'SP 4122';
    setNfrData({ ...nfrData, produk, total_harga: nfrData.jumlah ? nfrData.jumlah * produk.harga_jual : 0, reff: defaultReff });
  };

  const handleNFRJumlahChange = (e) => {
    const jumlah = e.target.value;
    let total = 0;
    if (nfrData.produk && jumlah) total = parseFloat(jumlah) * nfrData.produk.harga_jual;
    setNfrData({ ...nfrData, jumlah, total_harga: total });
  };

  // === VOUCHER ===
  const totalLembar = hitungTotalLembarHelper(voucherData.no_awal, voucherData.no_akhir);
  const totalNominalVoucher = totalLembar * (parseFloat(voucherData.nominal) || 0);

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

  const toggleChecklist = (voucherId, noLembar) => {
    setChecklistSementara(prev => {
      const currentList = prev[voucherId] || [];
      if (currentList.includes(noLembar)) {
        return { ...prev, [voucherId]: currentList.filter(n => n !== noLembar) };
      }
      return { ...prev, [voucherId]: [...currentList, noLembar] };
    });
  };

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

    setChecklistSementara(prev => { const n = { ...prev }; delete n[bundel.id]; return n; });
    fetchData();
    setIsSaving(false);
  };

  // === SIMPAN TRANSAKSI (BBM, LPG, OLI, LAINNYA) ===
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

      const selectedAkun = masterKodeAkun.find(k => k.kode_reff === lainnyaData.reff);
      let debetNum = 0, kreditNum = 0;
      if (selectedAkun) {
        if (selectedAkun.mutasi === 'DEBET') debetNum = parseFloat(lainnyaData.debet || 0);
        else kreditNum = parseFloat(lainnyaData.kredit || 0);
      }
      payloadJurnal = {
        dari_ke: lainnyaData.dari_ke.toUpperCase(),
        uraian_kegiatan: lainnyaData.uraian_kegiatan.toUpperCase(),
        reff: lainnyaData.reff.toUpperCase(),
        debet: debetNum, kredit: kreditNum
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

  // === HAPUS JURNAL ===
  const handleHapusJurnal = async (jurnal) => {
    const hariIni = new Date().toISOString().split('T')[0];
    if (jurnal.tanggal !== hariIni) {
      return alert(
        `❌ Tidak bisa hapus data tanggal ${jurnal.tanggal}.\n\n` +
        `Data lampau hanya boleh dikoreksi lewat Jurnal Koreksi (input transaksi balik).\n` +
        `Alasan: menjaga jejak audit laporan.`
      );
    }

    const yakin = window.confirm(
      `Yakin ingin menghapus catatan berikut?\n\n` +
      `Uraian : ${jurnal.uraian_kegiatan}\n` +
      `Nominal: ${formatRupiah(jurnal.debet > 0 ? jurnal.debet : jurnal.kredit)}\n\n` +
      `Data terkait (penjualan BBM/NFR) juga akan dihapus, dan total laporan dihitung ulang.\n` +
      `Tindakan ini TIDAK bisa dibatalkan.`
    );
    if (!yakin) return;

    setIsSaving(true);
    try {
      if (jurnal.uraian_kegiatan.includes('PENJUALAN BBM')) {
        await supabase.from('penjualan_bbm').delete().eq('tanggal', jurnal.tanggal).eq('shift', jurnal.shift).eq('total_harga', jurnal.debet);
      } else if (jurnal.uraian_kegiatan.includes('PENJUALAN LPG') || jurnal.uraian_kegiatan.includes('PENJUALAN OLI')) {
        await supabase.from('penjualan_nfr').delete().eq('tanggal', jurnal.tanggal).eq('shift', jurnal.shift).eq('total_harga', jurnal.debet);
      }
      const { error } = await supabase.from('jurnal_kasir').delete().eq('id', jurnal.id);
      if (error) throw error;
      alert('✅ Transaksi berhasil dihapus. Silakan input ulang data yang benar.');
      fetchData();
    } catch (error) {
      alert('Gagal hapus: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // === SIMPAN KOREKSI ===
  const handleSimpanKoreksi = async (e) => {
    e.preventDefault();
    if (!koreksiData.tanggal_asli || !koreksiData.shift_asli) return alert('Lengkapi tanggal dan shift transaksi asli!');
    if (!koreksiData.uraian_asli.trim()) return alert('Isi uraian transaksi asli yang salah!');
    if (!koreksiData.nominal_asli || !koreksiData.nominal_benar) return alert('Isi nominal salah dan nominal benar!');
    if (!koreksiData.reff) return alert('Pilih kode akun / reff transaksi!');
    if (!koreksiData.alasan.trim()) return alert('Isi alasan koreksi untuk jejak audit!');

    const nominalAsli = parseFloat(koreksiData.nominal_asli);
    const nominalBenar = parseFloat(koreksiData.nominal_benar);
    if (nominalAsli <= 0 || nominalBenar <= 0) return alert('Nominal harus lebih dari 0!');
    if (nominalAsli === nominalBenar) return alert('Nominal salah dan benar tidak boleh sama. Tidak ada yang perlu dikoreksi.');

    const ringkasAlasan = koreksiData.alasan.trim().toUpperCase();
    const uraianAsliUpper = koreksiData.uraian_asli.trim().toUpperCase();

    const yakin = window.confirm(
      `Konfirmasi Jurnal Koreksi:\n\n` +
      `Tanggal Asli : ${koreksiData.tanggal_asli}\n` +
      `Shift Asli   : ${koreksiData.shift_asli}\n` +
      `Uraian Asli  : ${uraianAsliUpper}\n` +
      `Salah        : ${formatRupiah(nominalAsli)}\n` +
      `Benar        : ${formatRupiah(nominalBenar)}\n` +
      `Selisih      : ${formatRupiah(Math.abs(nominalBenar - nominalAsli))}\n` +
      `Alasan       : ${ringkasAlasan}\n\n` +
      `Sistem akan membuat 2 baris jurnal koreksi. Lanjutkan?`
    );
    if (!yakin) return;

    setIsSaving(true);
    try {
      const tanggalKoreksi = new Date().toISOString().split('T')[0];
      const { data: jurnalTglIni } = await supabase
        .from('jurnal_kasir').select('saldo').eq('tanggal', tanggalKoreksi)
        .order('created_at', { ascending: false }).limit(1);

      let saldoBerjalan = jurnalTglIni && jurnalTglIni.length > 0 ? jurnalTglIni[0].saldo : 0;

      // Baris 1: balik transaksi salah
      await supabase.from('jurnal_kasir').insert([{
        tanggal: tanggalKoreksi,
        shift: formData.shift || koreksiData.shift_asli,
        dari_ke: `KOREKSI - ${koreksiData.jenis}`,
        uraian_kegiatan: `[KOREKSI] ${uraianAsliUpper} (BALIK TRANSAKSI SALAH)`,
        reff: koreksiData.reff,
        debet: 0, kredit: nominalAsli,
        saldo: saldoBerjalan - nominalAsli,
        created_by: 'Kasir',
      }]);
      saldoBerjalan = saldoBerjalan - nominalAsli;

      // Baris 2: catat nilai benar
      await supabase.from('jurnal_kasir').insert([{
        tanggal: tanggalKoreksi,
        shift: formData.shift || koreksiData.shift_asli,
        dari_ke: `KOREKSI - ${koreksiData.jenis}`,
        uraian_kegiatan: `[KOREKSI] ${uraianAsliUpper} (NILAI BENAR) | Alasan: ${ringkasAlasan}`,
        reff: koreksiData.reff,
        debet: nominalBenar, kredit: 0,
        saldo: saldoBerjalan + nominalBenar,
        created_by: 'Kasir',
      }]);

      alert(
        `✅ Jurnal Koreksi berhasil dibuat!\n\n` +
        `2 baris jurnal ditambahkan tanggal ${tanggalKoreksi}.\n` +
        `Net efek: ${formatRupiah(nominalBenar - nominalAsli)} (selisih koreksi).`
      );

      setKoreksiData({
        tanggal_asli: new Date().toISOString().split('T')[0],
        shift_asli: '', jenis: 'BBM', uraian_asli: '',
        nominal_asli: '', nominal_benar: '', reff: '', alasan: '',
      });
      fetchData();
    } catch (error) {
      alert('Gagal simpan koreksi: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // === TURUNAN ===
  const { totalDebetBBM, totalDebetNFR, totalDebetVoucher, totalKeseluruhan } = hitungTotalKategori(jurnalHariIni);
  const produkLPG = masterProdukNFR.filter(p => p.kategori === 'LPG');
  const produkOLI = masterProdukNFR.filter(p => p.kategori === 'OLI');
  const filteredKodeAkun = getFilteredKodeAkunHelper(masterKodeAkun, activeTab);

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>;

    return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Jurnal Transaksi Harian Kasir</h1>
          <p className="text-slate-500 text-sm mt-1">Catat penjualan di sini. Data otomatis masuk ke Buku Jurnal dan Setoran.</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
          <Printer size={18} /> Cetak Jurnal
        </button>
      </div>

      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 no-print">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Total BBM</p>
          <p className="text-sm font-bold text-blue-600">{formatRupiah(totalDebetBBM)}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Total NFR (LPG/Oli)</p>
          <p className="text-sm font-bold text-orange-600">{formatRupiah(totalDebetNFR)}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Total Voucher (Masuk)</p>
          <p className="text-sm font-bold text-purple-600">{formatRupiah(totalDebetVoucher)}</p>
        </div>
        <div className="bg-slate-800 p-3 rounded-xl shadow-md">
          <p className="text-[10px] text-slate-300 font-bold uppercase">Total Pendapatan</p>
          <p className="text-sm font-bold text-green-400">{formatRupiah(totalKeseluruhan)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ================= KOLOM KIRI: FORM INPUT ================= */}
        {activeTab !== 'JURNAL' && (
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit no-print animate-in fade-in slide-in-from-left-4">
            <TabNavigator activeTab={activeTab} onChange={setActiveTab} />

            <form onSubmit={activeTab === 'VOUCHER' ? handleSimpanVoucher : handleSimpanTransaksi} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Tanggal</label>
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

              {/* ---- FORM BBM ---- */}
              {activeTab === 'BBM' && (
                <FormBBM
                  bbmData={bbmData}
                  setBbmData={setBbmData}
                  masterProdukBBM={masterProdukBBM}
                  listDispenser={listDispenser}
                  filteredKodeAkun={filteredKodeAkun}
                  onSelectBBM={handleBBMSelect}
                  onJumlahChange={handleBBMJumlahChange}
                />
              )}

              {/* ---- FORM VOUCHER ---- */}
              {activeTab === 'VOUCHER' && (
                <FormVoucher
                  voucherData={voucherData}
                  setVoucherData={setVoucherData}
                  totalLembar={totalLembar}
                  totalNominalVoucher={totalNominalVoucher}
                  daftarCustomer={daftarCustomer}
                />
              )}

              {/* ---- FORM LPG / OLI ---- */}
              {(activeTab === 'LPG' || activeTab === 'OLI') && (
                <FormNFR
                  activeTab={activeTab}
                  nfrData={nfrData}
                  setNfrData={setNfrData}
                  produkList={activeTab === 'LPG' ? produkLPG : produkOLI}
                  filteredKodeAkun={filteredKodeAkun}
                  onProdukClick={(p) => handleNFRProdukClick(p, activeTab)}
                  onJumlahChange={handleNFRJumlahChange}
                />
              )}

              {/* ---- FORM LAINNYA ---- */}
              {activeTab === 'LAINNYA' && (
                <FormLainnya
                  lainnyaData={lainnyaData}
                  setLainnyaData={setLainnyaData}
                  masterKodeAkun={masterKodeAkun}
                />
              )}

              {/* ---- FORM KOREKSI ---- */}
              {activeTab === 'KOREKSI' && (
                <FormKoreksi
                  koreksiData={koreksiData}
                  setKoreksiData={setKoreksiData}
                  listShift={listShift}
                  masterKodeAkun={masterKodeAkun}
                />
              )}

              {/* ---- TOMBOL SUBMIT (disembunyikan di tab Koreksi karena punya alur sendiri) ---- */}
              {activeTab !== 'KOREKSI' && (
                <button type="submit" disabled={isSaving} className="w-full bg-slate-800 text-white font-semibold py-2.5 rounded-xl hover:bg-slate-900 transition-colors shadow-sm text-xs mt-2 disabled:opacity-50">
                  {isSaving ? 'Menyimpan...' : activeTab === 'VOUCHER' ? 'Simpan Data Voucher (Pending)' : 'Simpan & Masukkan ke Jurnal'}
                </button>
              )}

              {/* Tombol khusus Koreksi (handler terpisah) */}
              {activeTab === 'KOREKSI' && (
                <button
                  type="button"
                  onClick={handleSimpanKoreksi}
                  disabled={isSaving}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm text-xs mt-2 disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : '🔄 Simpan Jurnal Koreksi (2 Baris)'}
                </button>
              )}
            </form>
          </div>
        )}

        {/* ================= KOLOM KANAN: TABEL ================= */}
        <div className={`${activeTab === 'JURNAL' ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-6 no-print`}>

          {/* Tombol switch Input vs Jurnal */}
          <div className="flex bg-slate-200 p-1 rounded-xl w-fit mb-2">
            <button onClick={() => setActiveTab('BBM')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${['BBM','VOUCHER','LPG','OLI','LAINNYA','KOREKSI'].includes(activeTab) ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Input Transaksi</button>
            <button onClick={() => setActiveTab('JURNAL')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'JURNAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
              <BookOpen size={14}/> Jurnal Harian Kasir
            </button>
          </div>

          {/* ---- TABEL VOUCHER (muncul saat tab VOUCHER) ---- */}
          {activeTab === 'VOUCHER' && (
            <TabelVoucher
              daftarVoucherHariIni={daftarVoucherHariIni}
              checklistSementara={checklistSementara}
              onToggleChecklist={toggleChecklist}
              onSimpanChecklist={handleSimpanChecklist}
              isSaving={isSaving}
            />
          )}

          {/* ---- TABEL JURNAL (muncul saat JURNAL, BBM, LPG, OLI, LAINNYA) ---- */}
          {(activeTab === 'JURNAL' || ['BBM','LPG','OLI','LAINNYA','KOREKSI'].includes(activeTab)) && (
            <TabelJurnal
              jurnalHariIni={jurnalHariIni}
              onHapus={handleHapusJurnal}
              isSaving={isSaving}
            />
          )}

        </div>
      </div>

      {/* ================= PRINT AREA ================= */}
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
