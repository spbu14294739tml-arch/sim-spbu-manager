import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatRupiah } from '../lib/formatHelper';
import { Loader2, Plus, Ticket, CheckCircle2 } from 'lucide-react';

export default function AccountingVoucher() {
  const [voucherList, setVoucherList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notif, setNotif] = useState('');

  // State Form
  const [form, setForm] = useState({
    nomor_urut: '',
    nama_pembeli: '',
    tipe_pembeli: 'Pribadi',
    nominal: ''
  });

  const fetchVoucher = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('master_voucher').select('*').order('created_at', { ascending: false });
    if (data) setVoucherList(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchVoucher(); }, []);

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!form.nomor_urut || !form.nama_pembeli || !form.nominal) {
      return alert('Lengkapi semua data voucher!');
    }

    setIsSaving(true);
    const { error } = await supabase.from('master_voucher').insert({
      nomor_urut: form.nomor_urut.toUpperCase(),
      nama_pembeli: form.nama_pembeli.toUpperCase(),
      tipe_pembeli: form.tipe_pembeli,
      nominal: parseFloat(form.nominal),
      tanggal_terbit: new Date().toISOString().split('T')[0],
      status: 'AKTIF'
    });

    if (error) {
      alert('Gagal terbitkan voucher: ' + error.message);
    } else {
      setNotif('Voucher berhasil diterbitkan!');
      setTimeout(() => setNotif(''), 3000);
      setForm({ nomor_urut: '', nama_pembeli: '', tipe_pembeli: 'Pribadi', nominal: '' });
      fetchVoucher();
    }
    setIsSaving(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Ticket className="text-blue-600" size={32} /> Penerbitan Voucher BBM
        </h1>
        <p className="text-slate-500 mt-1">Kelola penerbitan voucher untuk Konsumen / Instansi.</p>
      </div>

      {notif && <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded shadow-sm">{notif}</div>}

      <div className="grid md:grid-cols-3 gap-6">
        {/* FORM INPUT */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
          <h2 className="font-bold text-lg mb-4 text-slate-800">Terbitkan Voucher Baru</h2>
          <form onSubmit={handleSimpan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Urut Voucher</label>
              <input type="text" placeholder="Cth: VCR-2026-001" value={form.nomor_urut} onChange={e => setForm({...form, nomor_urut: e.target.value})} className="w-full px-4 py-2 border rounded-xl uppercase font-mono" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Pembeli</label>
              <select value={form.tipe_pembeli} onChange={e => setForm({...form, tipe_pembeli: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white">
                <option value="Pribadi">Pribadi</option>
                <option value="Instansi">Instansi / Perusahaan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pembeli / Instansi</label>
              <input type="text" placeholder="Cth: PT. Maju Jaya" value={form.nama_pembeli} onChange={e => setForm({...form, nama_pembeli: e.target.value})} className="w-full px-4 py-2 border rounded-xl uppercase" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nominal Voucher (Rp)</label>
              <select value={form.nominal} onChange={e => setForm({...form, nominal: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white font-semibold text-blue-700" required>
                <option value="">-- Pilih Nominal --</option>
                <option value="25000">Rp 25.000</option>
                <option value="50000">Rp 50.000</option>
                <option value="100000">Rp 100.000</option>
                <option value="150000">Rp 150.000</option>
                <option value="200000">Rp 200.000</option>
                <option value="250000">Rp 250.000</option>
              </select>
            </div>
            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 flex justify-center items-center gap-2">
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />} Terbitkan Voucher
            </button>
          </form>
        </div>

        {/* LIST VOUCHER */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-lg mb-4 text-slate-800">Daftar Voucher Terbit</h2>
          {isLoading ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm">
                  <tr>
                    <th className="p-3 rounded-l-lg">No. Urut</th>
                    <th className="p-3">Pembeli</th>
                    <th className="p-3">Nominal</th>
                    <th className="p-3 rounded-r-lg text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {voucherList.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{v.nomor_urut}</td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{v.nama_pembeli}</p>
                        <p className="text-xs text-slate-500">{v.tipe_pembeli}</p>
                      </td>
                      <td className="p-3 font-bold text-blue-600">{formatRupiah(v.nominal)}</td>
                      <td className="p-3 text-center">
                        {v.status === 'AKTIF' ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">AKTIF</span>
                        ) : (
                          <span className="bg-slate-200 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1"><CheckCircle2 size={12}/> TERPAKAI</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {voucherList.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-8 text-slate-400">Belum ada voucher yang diterbitkan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}