// src/pages/VoucherBBM/InputVoucher.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../lib/formatHelper';
import KopSurat from '../../components/KopSurat';
import { Loader2, Save, Ticket } from 'lucide-react';

export default function InputVoucher() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [daftarCustomer, setDaftarCustomer] = useState([]);
  const [lastVoucherNumber, setLastVoucherNumber] = useState(0);
  const [listShift, setListShift] = useState([]);
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    shift: '',
  });

  const [voucherData, setVoucherData] = useState({ no_awal: '', no_akhir: '', customer: '', nominal: '' });

  useEffect(() => {
    const fetchInitData = async () => {
      setIsLoading(true);
      const { data: shiftData } = await supabase.from('pengaturan_shift').select('nama_shift').order('id');
      if (shiftData && shiftData.length > 0) {
        setListShift(shiftData.map(s => s.nama_shift));
        if (!formData.shift) setFormData(prev => ({ ...prev, shift: shiftData[0].nama_shift }));
      }

      const { data: lastVoucher } = await supabase.from('penjualan_voucher').select('no_voucher').order('created_at', { ascending: false }).limit(1);
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

      const { data: dataVoucher } = await supabase.from('penjualan_voucher').select('nama_customer');
      if (dataVoucher) {
        const uniqueCustomers = [...new Set(dataVoucher.map(v => v.nama_customer).filter(Boolean))];
        setDaftarCustomer(uniqueCustomers);
      }
      setIsLoading(false);
    };
    fetchInitData();
  }, []);

  const hitungTotalLembar = () => {
    const awal = parseInt(voucherData.no_awal);
    const akhir = parseInt(voucherData.no_akhir);
    if (!isNaN(awal) && !isNaN(akhir) && akhir >= awal) return (akhir - awal) + 1;
    return 0;
  };

  const totalLembar = hitungTotalLembar();
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
    else { 
      alert('✅ Voucher berhasil diinput!'); 
      setVoucherData({ no_awal: '', no_akhir: '', customer: '', nominal: '' }); 
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Ticket className="text-purple-600" size={24} />
        <h2 className="text-lg font-bold text-slate-800">Form Input Voucher Baru</h2>
      </div>

      <form onSubmit={handleSimpanVoucher} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
            <input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Shift</label>
            <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
              {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Awal No. Voucher</label>
            <input type="number" required value={voucherData.no_awal} onChange={(e) => setVoucherData({ ...voucherData, no_awal: e.target.value })} className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg text-sm font-bold text-purple-700" placeholder="Cth: 1" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Akhir No. Voucher</label>
            <input type="number" required value={voucherData.no_akhir} onChange={(e) => setVoucherData({ ...voucherData, no_akhir: e.target.value })} className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg text-sm font-bold text-purple-700" placeholder="Cth: 10" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Nama Customer / Instansi</label>
          <input type="text" list="customer-list" required value={voucherData.customer} onChange={(e) => setVoucherData({ ...voucherData, customer: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ketik atau Pilih..." />
          <datalist id="customer-list">
            {daftarCustomer.map((c, i) => <option key={i} value={c} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Nominal / Lembar (Rp)</label>
          <input type="number" required value={voucherData.nominal} onChange={(e) => setVoucherData({ ...voucherData, nominal: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm font-bold" placeholder="Cth: 50000" />
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <div className="flex justify-between text-xs font-bold text-purple-600 mb-1">
            <span>Total Lembar:</span>
            <span>{totalLembar} Lembar</span>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-purple-600 font-bold">Total Tagihan:</p>
            <p className="text-xl font-black text-purple-700">{formatRupiah(totalNominalVoucher)}</p>
          </div>
        </div>

        <button type="submit" disabled={isSaving} className="w-full bg-slate-800 text-white font-semibold py-3 rounded-xl hover:bg-slate-900 transition-colors text-sm mt-4 disabled:opacity-50">
          {isSaving ? 'Menyimpan...' : 'Simpan Voucher'}
        </button>
      </form>
    </div>
  );
}