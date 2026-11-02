// src/pages/Gaji/index.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import { Loader2, Printer, Calendar, Plus, Save, X, FileText } from 'lucide-react';
import KopSurat from '../../components/KopSurat';

export default function GajiKaryawan() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [daftarGaji, setDaftarGaji] = useState([]);
  const [daftarKaryawan, setDaftarKaryawan] = useState([]);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showForm, setShowForm] = useState(false);
  
  // Gunakan string kosong '' agar form benar-benar kosong saat baru diketik
  const [formData, setFormData] = useState({
    karyawan_id: '', 
    gaji_pokok: '', tunjangan_komunikasi: '', tunjangan_jabatan: '', upah_sundulan: '', thr: '', lembur: '', masuk_shift_malam: '', reward_pasti_pas: '',
    astek_jht: '', astek_jp: '', bpjs_kes: '', pph_21: '', absen: '', adm: '', pot_lainnya: ''
  });
  const [selectedKaryawanInfo, setSelectedKaryawanInfo] = useState(null);

  const [selectedSlip, setSelectedSlip] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: dataGaji } = await supabase
      .from('gaji_karyawan')
      .select(`*, karyawan (nama, posisi)`)
      .eq('bulan', selectedMonth)
      .eq('tahun', selectedYear)
      .order('created_at', { ascending: true });

    if (dataGaji) setDaftarGaji(dataGaji);

    const { data: dataKaryawan } = await supabase.from('karyawan').select('*').eq('status', 'Aktif');
    if (dataKaryawan) setDaftarKaryawan(dataKaryawan);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const formatTanggalIndo = (bulan, tahun) => {
    const date = new Date(tahun, bulan - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const parseNum = (val) => {
    if (!val) return 0;
    const clean = val.toString().replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const hitungTotal = (data) => {
    const totalTunjangan = 
      parseNum(data.tunjangan_komunikasi) + 
      parseNum(data.tunjangan_jabatan) + 
      parseNum(data.upah_sundulan) + 
      parseNum(data.thr) + 
      parseNum(data.lembur) + 
      parseNum(data.masuk_shift_malam) + 
      parseNum(data.reward_pasti_pas);
      
    const gajiPokok = parseNum(data.gaji_pokok);
    const totalPendapatan = gajiPokok + totalTunjangan;

    const totalPotongan = 
      parseNum(data.astek_jht) + 
      parseNum(data.astek_jp) + 
      parseNum(data.bpjs_kes) + 
      parseNum(data.pph_21) + 
      parseNum(data.absen) + 
      parseNum(data.adm) +
      parseNum(data.pot_lainnya);

    const totalBersih = totalPendapatan - totalPotongan;

    return { totalPendapatan, totalPotongan, totalBersih };
  };

  // Simpan apa yang diketik, hapus titik/koma agar tidak error saat disimpan
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Hanya izinkan angka dan titik
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setFormData({ ...formData, [name]: cleanValue });
  };

  const handlePilihKaryawan = (e) => {
    const selectedId = e.target.value;
    const karyawanData = daftarKaryawan.find(k => k.id.toString() === selectedId);
    
    if (karyawanData) {
      setSelectedKaryawanInfo(karyawanData);
      setFormData({
        ...formData,
        karyawan_id: selectedId,
        gaji_pokok: karyawanData.gaji_pokok ? karyawanData.gaji_pokok.toString() : '',
        tunjangan_jabatan: karyawanData.tunjangan_jabatan ? karyawanData.tunjangan_jabatan.toString() : '',
      });
    } else {
      setSelectedKaryawanInfo(null);
      setFormData({ ...formData, karyawan_id: '', gaji_pokok: '', tunjangan_jabatan: '' });
    }
  };

  const handleSimpanGaji = async (e) => {
    e.preventDefault();
    if (!formData.karyawan_id) return alert('Pilih Karyawan terlebih dahulu!');
    setIsSaving(true);

    const { totalPendapatan, totalPotongan, totalBersih } = hitungTotal(formData);

    const payload = {
      karyawan_id: formData.karyawan_id,
      bulan: selectedMonth,
      tahun: selectedYear,
      gaji_pokok: parseNum(formData.gaji_pokok),
      tunjangan_komunikasi: parseNum(formData.tunjangan_komunikasi),
      tunjangan_jabatan: parseNum(formData.tunjangan_jabatan),
      upah_sundulan: parseNum(formData.upah_sundulan),
      thr: parseNum(formData.thr),
      lembur: parseNum(formData.lembur),
      masuk_shift_malam: parseNum(formData.masuk_shift_malam),
      reward_pasti_pas: parseNum(formData.reward_pasti_pas),
      astek_jht: parseNum(formData.astek_jht),
      astek_jp: parseNum(formData.astek_jp),
      bpjs_kes: parseNum(formData.bpjs_kes),
      pph_21: parseNum(formData.pph_21),
      absen: parseNum(formData.absen),
      adm: parseNum(formData.adm),
      pot_lainnya: parseNum(formData.pot_lainnya),
      tunjangan: totalPendapatan,
      potongan: totalPotongan,
      total_bersih: totalBersih,
      status: 'DRAFT'
    };

    const { error } = await supabase.from('gaji_karyawan').insert([payload]);

    if (error) {
      alert('Gagal simpan gaji: ' + error.message);
    } else {
      alert('✅ Data Gaji berhasil disimpan!');
      setShowForm(false);
      setFormData({
        karyawan_id: '', gaji_pokok: '', tunjangan_komunikasi: '', tunjangan_jabatan: '', upah_sundulan: '', thr: '', lembur: '', masuk_shift_malam: '', reward_pasti_pas: '',
        astek_jht: '', astek_jp: '', bpjs_kes: '', pph_21: '', absen: '', adm: '', pot_lainnya: ''
      });
      setSelectedKaryawanInfo(null);
      fetchData();
    }
    setIsSaving(false);
  };

  const handleCetakSlip = (gaji) => {
    setSelectedSlip(gaji);
    setTimeout(() => { window.print(); }, 300);
  };

  // Komponen Input Tanpa ReadOnly Aneh
  const FormInput = ({ label, name, value, onChange, isReadOnly = false, labelColor = 'text-slate-700' }) => (
    <div className="mb-4">
      <label className={`block text-sm font-bold mb-1.5 ${labelColor}`}>{label}</label>
      <input 
        type="text" 
        inputMode="decimal"
        name={name} 
        value={value} 
        onChange={onChange} 
        readOnly={isReadOnly}
        className={`w-full px-4 py-3 border border-slate-300 rounded-xl text-xl text-right font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none
          ${isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'}
        `} 
        placeholder="0"
      />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Gaji Karyawan</h1>
          <p className="text-slate-500 mt-1">Kelola, cetak rekap, dan buat slip gaji bulanan.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
            <Plus size={18} /> Input Gaji Baru
          </button>
          <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all">
            <Printer size={18} /> Cetak Rekap
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center print:hidden">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar size={18} className="text-slate-500" />
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
            {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700">
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      <KopSurat judul="LAPORAN GAJI KARYAWAN" periode={`Bulan: ${formatTanggalIndo(selectedMonth, selectedYear)}`} />

      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print-area overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="py-3 px-4 text-left">Nama Karyawan</th>
                <th className="py-3 px-4 text-left">Jabatan</th>
                <th className="py-3 px-4 text-right">Gaji Pokok</th>
                <th className="py-3 px-4 text-right">Total Pendapatan</th>
                <th className="py-3 px-4 text-right">Total Potongan</th>
                <th className="py-3 px-4 text-right bg-slate-900">Total Bersih</th>
                <th className="py-3 px-4 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daftarGaji.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500 italic">Belum ada data gaji untuk bulan ini.</td></tr>
              ) : daftarGaji.map((gaji, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{gaji.karyawan?.nama || '-'}</td>
                  <td className="py-3 px-4 text-slate-600">{gaji.karyawan?.posisi || '-'}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(gaji.gaji_pokok)}</td>
                  <td className="py-3 px-4 text-right font-mono text-green-600">+{formatRupiah(gaji.tunjangan)}</td>
                  <td className="py-3 px-4 text-right font-mono text-red-600">-{formatRupiah(gaji.potongan)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{formatRupiah(gaji.total_bersih)}</td>
                  <td className="py-3 px-4 text-center print:hidden">
                    <button onClick={() => setSelectedSlip(gaji)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors">
                      <FileText size={14} /> Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8">
            <div className="flex justify-between items-center p-5 border-b bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">Input Gaji Karyawan</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={24} className="text-slate-500" /></button>
            </div>

            <form onSubmit={handleSimpanGaji} className="p-6">
              
              {selectedKaryawanInfo && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-6 text-sm">
                  <div><span className="text-slate-500 block text-xs">Nama</span> <span className="font-bold text-slate-800">{selectedKaryawanInfo.nama}</span></div>
                  <div><span className="text-slate-500 block text-xs">Jabatan</span> <span className="font-bold text-slate-800">{selectedKaryawanInfo.posisi}</span></div>
                  <div><span className="text-slate-500 block text-xs">Tgl Masuk</span> <span className="font-bold text-slate-800">{new Date(selectedKaryawanInfo.tanggal_masuk || selectedKaryawanInfo.created_at).toLocaleDateString('id-ID')}</span></div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Pilih Karyawan</label>
                    <select name="karyawan_id" value={formData.karyawan_id} onChange={handlePilihKaryawan} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base font-semibold focus:ring-2 focus:ring-blue-500" required>
                      <option value="">-- Pilih Karyawan --</option>
                      {daftarKaryawan.map(k => (
                        <option key={k.id} value={k.id}>{k.nama} ({k.posisi})</option>
                      ))}
                    </select>
                  </div>
                  <FormInput label="Gaji Pokok (Rp)" name="gaji_pokok" value={formData.gaji_pokok} onChange={handleChange} isReadOnly={true} labelColor="text-slate-700" />
                </div>

                <div className="space-y-1 bg-green-50 p-5 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-4 text-lg border-b border-green-200 pb-2">Pendapatan (+)</h3>
                  <FormInput label="Tunj. Komunikasi" name="tunjangan_komunikasi" value={formData.tunjangan_komunikasi} onChange={handleChange} labelColor="text-green-700" />
                  <FormInput label="Tunj. Jabatan" name="tunjangan_jabatan" value={formData.tunjangan_jabatan} onChange={handleChange} labelColor="text-green-700" />
                  <FormInput label="Upah Sundulan" name="upah_sundulan" value={formData.upah_sundulan} onChange={handleChange} labelColor="text-green-700" />
                  <FormInput label="THR" name="thr" value={formData.thr} onChange={handleChange} labelColor="text-green-700" />
                  <FormInput label="Lembur" name="lembur" value={formData.lembur} onChange={handleChange} labelColor="text-green-700" />
                  <FormInput label="Shift Malam" name="masuk_shift_malam" value={formData.masuk_shift_malam} onChange={handleChange} labelColor="text-green-700" />
                  <FormInput label="Pastipas" name="reward_pasti_pas" value={formData.reward_pasti_pas} onChange={handleChange} labelColor="text-green-700" />
                </div>

                <div className="space-y-1 bg-red-50 p-5 rounded-xl border border-red-200">
                  <h3 className="font-bold text-red-800 mb-4 text-lg border-b border-red-200 pb-2">Potongan (-)</h3>
                  <FormInput label="Astek JHT (2%)" name="astek_jht" value={formData.astek_jht} onChange={handleChange} labelColor="text-red-700" />
                  <FormInput label="Astek JP (1%)" name="astek_jp" value={formData.astek_jp} onChange={handleChange} labelColor="text-red-700" />
                  <FormInput label="BPJS Kesehatan (1%)" name="bpjs_kes" value={formData.bpjs_kes} onChange={handleChange} labelColor="text-red-700" />
                  <FormInput label="PPh 21" name="pph_21" value={formData.pph_21} onChange={handleChange} labelColor="text-red-700" />
                  <FormInput label="Potongan Absen" name="absen" value={formData.absen} onChange={handleChange} labelColor="text-red-700" />
                  <FormInput label="ADM" name="adm" value={formData.adm} onChange={handleChange} labelColor="text-red-700" />
                  <FormInput label="Pot. Lain-lain" name="pot_lainnya" value={formData.pot_lainnya} onChange={handleChange} labelColor="text-red-700" />
                </div>

                <div className="md:col-span-3 bg-slate-100 p-5 rounded-xl border border-slate-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                  <div>
                    <p className="text-sm font-bold text-slate-600">Total Bersih (Pendapatan - Potongan):</p>
                    <p className="text-4xl font-black text-blue-700">{formatRupiah(hitungTotal(formData).totalBersih)}</p>
                  </div>
                  <button type="submit" disabled={isSaving} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 w-full md:w-auto justify-center shadow-lg transition-all">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Simpan Data Gaji
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-white print:static print:bg-transparent overflow-y-auto">
          <div className="flex justify-end p-4 print:hidden bg-slate-100 border-b sticky top-0">
            <button onClick={() => handleCetakSlip(selectedSlip)} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold mr-2 flex items-center gap-2 shadow-md hover:bg-blue-700">
              <Printer size={18} /> Cetak Slip
            </button>
            <button onClick={() => setSelectedSlip(null)} className="bg-white border border-slate-300 text-slate-700 px-5 py-2 rounded-lg font-bold hover:bg-slate-50">
              Tutup
            </button>
          </div>

          <div className="p-8 max-w-2xl mx-auto print:max-w-none print:p-0">
            <div className="border border-slate-300 p-8 rounded-xl print:border-none print:shadow-none">
              <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-2xl font-black text-slate-800">SLIP GAJI KARYAWAN</h1>
                <p className="text-sm text-slate-500 font-medium">SPBU 14.294.739</p>
                <p className="text-xs text-slate-400 mt-1">Periode: {formatTanggalIndo(selectedSlip.bulan, selectedSlip.tahun)}</p>
              </div>

              <div className="mb-6 grid grid-cols-2 text-sm">
                <div>
                  <p className="text-slate-500">Nama Karyawan</p>
                  <p className="font-bold text-slate-800 text-base">{selectedSlip.karyawan?.nama}</p>
                </div>
                <div>
                  <p className="text-slate-500">Jabatan</p>
                  <p className="font-bold text-slate-800 text-base">{selectedSlip.karyawan?.posisi}</p>
                </div>
              </div>

              <table className="w-full text-sm mb-6 border-t border-slate-200 pt-4">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 text-slate-600 font-bold">Gaji Pokok</td>
                    <td className="py-2 text-right font-mono font-bold">{formatRupiah(selectedSlip.gaji_pokok)}</td>
                  </tr>
                  
                  <tr><td colSpan={2} className="pt-3 pb-1 text-xs font-bold text-green-700 uppercase">Tunjangan / Pendapatan</td></tr>
                  {selectedSlip.tunjangan_komunikasi > 0 && <tr><td className="py-1 pl-4 text-slate-500">Tunj. Komunikasi</td><td className="py-1 text-right font-mono text-green-600">+{formatRupiah(selectedSlip.tunjangan_komunikasi)}</td></tr>}
                  {selectedSlip.tunjangan_jabatan > 0 && <tr><td className="py-1 pl-4 text-slate-500">Tunj. Jabatan</td><td className="py-1 text-right font-mono text-green-600">+{formatRupiah(selectedSlip.tunjangan_jabatan)}</td></tr>}
                  {selectedSlip.upah_sundulan > 0 && <tr><td className="py-1 pl-4 text-slate-500">Upah Sundulan</td><td className="py-1 text-right font-mono text-green-600">+{formatRupiah(selectedSlip.upah_sundulan)}</td></tr>}
                  {selectedSlip.thr > 0 && <tr><td className="py-1 pl-4 text-slate-500">THR</td><td className="py-1 text-right font-mono text-green-600">+{formatRupiah(selectedSlip.thr)}</td></tr>}
                  {selectedSlip.lembur > 0 && <tr><td className="py-1 pl-4 text-slate-500">Lembur</td><td className="py-1 text-right font-mono text-green-600">+{formatRupiah(selectedSlip.lembur)}</td></tr>}
                  {selectedSlip.masuk_shift_malam > 0 && <tr><td className="py-1 pl-4 text-slate-500">Shift Malam</td><td className="py-1 text-right font-mono text-green-600">+{formatRupiah(selectedSlip.masuk_shift_malam)}</td></tr>}
                  {selectedSlip.reward_pasti_pas > 0 && <tr><td className="py-1 pl-4 text-slate-500">Pastipas</td><td className="py-1 text-right font-mono text-green-600">+{formatRupiah(selectedSlip.reward_pasti_pas)}</td></tr>}
                  
                  <tr><td colSpan={2} className="pt-3 pb-1 text-xs font-bold text-red-700 uppercase">Potongan</td></tr>
                  {selectedSlip.astek_jht > 0 && <tr><td className="py-1 pl-4 text-slate-500">Astek JHT (2%)</td><td className="py-1 text-right font-mono text-red-600">-{formatRupiah(selectedSlip.astek_jht)}</td></tr>}
                  {selectedSlip.astek_jp > 0 && <tr><td className="py-1 pl-4 text-slate-500">Astek JP (1%)</td><td className="py-1 text-right font-mono text-red-600">-{formatRupiah(selectedSlip.astek_jp)}</td></tr>}
                  {selectedSlip.bpjs_kes > 0 && <tr><td className="py-1 pl-4 text-slate-500">BPJS Kesehatan (1%)</td><td className="py-1 text-right font-mono text-red-600">-{formatRupiah(selectedSlip.bpjs_kes)}</td></tr>}
                  {selectedSlip.pph_21 > 0 && <tr><td className="py-1 pl-4 text-slate-500">PPh 21</td><td className="py-1 text-right font-mono text-red-600">-{formatRupiah(selectedSlip.pph_21)}</td></tr>}
                  {selectedSlip.absen > 0 && <tr><td className="py-1 pl-4 text-slate-500">Potongan Absen</td><td className="py-1 text-right font-mono text-red-600">-{formatRupiah(selectedSlip.absen)}</td></tr>}
                  {selectedSlip.adm > 0 && <tr><td className="py-1 pl-4 text-slate-500">ADM</td><td className="py-1 text-right font-mono text-red-600">-{formatRupiah(selectedSlip.adm)}</td></tr>}
                  {selectedSlip.pot_lainnya > 0 && <tr><td className="py-1 pl-4 text-slate-500">Pot. Lain-lain</td><td className="py-1 text-right font-mono text-red-600">-{formatRupiah(selectedSlip.pot_lainnya)}</td></tr>}
                </tbody>
              </table>

              <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center border border-slate-200 print:bg-white print:border-t-2 print:border-slate-800 print:border-b-0 print:border-x-0 print:rounded-none">
                <p className="font-bold text-slate-700">TOTAL DITERIMA (TAKE HOME PAY)</p>
                <p className="text-xl font-black text-blue-700">{formatRupiah(selectedSlip.total_bersih)}</p>
              </div>

              <div className="flex justify-between mt-12 text-sm text-slate-600">
                <div className="text-center">
                  <p>Penerima,</p>
                  <div className="h-16"></div>
                  <p className="font-bold border-t border-slate-400 pt-1 px-4">{selectedSlip.karyawan?.nama}</p>
                </div>
                <div className="text-center">
                  <p>Manager / Accounting,</p>
                  <div className="h-16"></div>
                  <p className="font-bold border-t border-slate-400 pt-1 px-4">Tanda Tangan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          .print\\:static { position: static !important; }
          .print-area { display: block !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid black !important; padding: 6px 8px !important; color: black !important; }
          .bg-slate-800, .bg-slate-900 { background-color: #1e293b !important; color: white !important; -webkit-print-color-adjust: exact !important; }
        }
      `}} />
    </div>
  );
}