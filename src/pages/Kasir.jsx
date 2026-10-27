import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const JENIS_BBM = ['Pertalite', 'Pertamax', 'Pertamax Turbo', 'Solar', 'Dexlite', 'Pertamina Dex'];
const HARGA_BBM = {
  Pertalite: 10000,
  Pertamax: 12500,
  'Pertamax Turbo': 14000,
  Solar: 6800,
  Dexlite: 14500,
  'Pertamina Dex': 15500,
};

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function Kasir() {
  const [activeTab, setActiveTab] = useState('bbm');
  const [shift, setShift] = useState('Pagi');
  const [operator, setOperator] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // ==== STATE BBM ====
  const [bbmForm, setBbmForm] = useState({ jenis: 'Pertalite', liter: '' });
  const [bbmList, setBbmList] = useState([]);

  // ==== STATE NFR ====
  const [nfrForm, setNfrForm] = useState({ nama: '', jumlah: '', harga: '' });
  const [nfrList, setNfrList] = useState([]);

  // ==== STATE VOUCHER ====
  const [voucherForm, setVoucherForm] = useState({
    no_voucher: '',
    jenis_bbm: 'Pertalite',
    jumlah_liter: '',
    total_harga: '',
  });
  const [voucherList, setVoucherList] = useState([]);

  // ==== STATE TUTUP KASIR ====
  const [tutupData, setTutupData] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  // ==== LOAD OPERATOR DARI LOCALSTORAGE ====
  useEffect(() => {
    const op = localStorage.getItem('operator_nama') || '';
    setOperator(op);
  }, []);

  // ==== LOAD DATA HARI INI ====
  useEffect(() => {
    if (!operator) return;
    loadBbm();
    loadNfr();
    loadVoucher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operator]);

  const loadBbm = async () => {
    const { data, error } = await supabase
      .from('penjualan_bbm')
      .select('*')
      .eq('tanggal', today)
      .eq('operator', operator)
      .order('created_at', { ascending: false });
    if (!error) setBbmList(data || []);
  };

  const loadNfr = async () => {
    const { data, error } = await supabase
      .from('penjualan_nfr')
      .select('*')
      .eq('tanggal', today)
      .eq('operator', operator)
      .order('created_at', { ascending: false });
    if (!error) setNfrList(data || []);
  };

  const loadVoucher = async () => {
    const { data, error } = await supabase
      .from('penjualan_voucher')
      .select('*')
      .eq('tanggal', today)
      .eq('operator', operator)
      .order('created_at', { ascending: false });
    if (!error) setVoucherList(data || []);
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  // ==== SUBMIT BBM ====
  const submitBbm = async (e) => {
    e.preventDefault();
    const liter = parseFloat(bbmForm.liter);
    if (!liter || liter <= 0) return showMsg('error', 'Jumlah liter harus lebih dari 0.');
    setLoading(true);
    const hargaPerLiter = HARGA_BBM[bbmForm.jenis] || 0;
    const total = Math.round(hargaPerLiter * liter);
    const { error } = await supabase.from('penjualan_bbm').insert({
      tanggal: today,
      shift,
      jenis_bbm: bbmForm.jenis,
      jumlah_liter: liter,
      harga_per_liter: hargaPerLiter,
      total_harga: total,
      operator,
    });
    setLoading(false);
    if (error) return showMsg('error', 'Gagal simpan BBM: ' + error.message);
    showMsg('success', `BBM ${bbmForm.jenis} ${liter}L berhasil dicatat.`);
    setBbmForm({ jenis: 'Pertalite', liter: '' });
    loadBbm();
  };

  // ==== SUBMIT NFR ====
  const submitNfr = async (e) => {
    e.preventDefault();
    const jumlah = parseInt(nfrForm.jumlah);
    const harga = parseFloat(nfrForm.harga);
    if (!nfrForm.nama.trim()) return showMsg('error', 'Nama produk wajib diisi.');
    if (!jumlah || jumlah <= 0) return showMsg('error', 'Jumlah harus lebih dari 0.');
    if (!harga || harga <= 0) return showMsg('error', 'Harga harus lebih dari 0.');
    setLoading(true);
    const { error } = await supabase.from('penjualan_nfr').insert({
      tanggal: today,
      shift,
      nama_produk: nfrForm.nama.trim(),
      jumlah,
      harga_satuan: harga,
      total_harga: jumlah * harga,
      operator,
    });
    setLoading(false);
    if (error) return showMsg('error', 'Gagal simpan NFR: ' + error.message);
    showMsg('success', 'NFR berhasil dicatat.');
    setNfrForm({ nama: '', jumlah: '', harga: '' });
    loadNfr();
  };

  // ==== SUBMIT VOUCHER ====
  const submitVoucher = async (e) => {
    e.preventDefault();
    const noVoucher = voucherForm.no_voucher.trim().toUpperCase();
    const liter = parseFloat(voucherForm.jumlah_liter);
    const harga = parseFloat(voucherForm.total_harga);

    if (!noVoucher) return showMsg('error', 'Nomor Voucher wajib diisi.');
    if (!liter || liter <= 0) return showMsg('error', 'Jumlah liter voucher harus > 0.');
    if (!harga || harga <= 0) return showMsg('error', 'Total harga voucher harus > 0.');

    // Cek duplikat no voucher di hari & operator yang sama
    const dup = voucherList.find((v) => v.no_voucher === noVoucher);
    if (dup) return showMsg('error', `Voucher ${noVoucher} sudah pernah dicatat hari ini.`);

    setLoading(true);
    const { error } = await supabase.from('penjualan_voucher').insert({
      tanggal: today,
      shift,
      no_voucher: noVoucher,
      jenis_bbm: voucherForm.jenis_bbm,
      jumlah_liter: liter,
      total_harga: harga,
      operator,
    });
    setLoading(false);
    if (error) return showMsg('error', 'Gagal simpan voucher: ' + error.message);
    showMsg('success', `Voucher ${noVoucher} berhasil dicatat.`);
    setVoucherForm({ no_voucher: '', jenis_bbm: 'Pertalite', jumlah_liter: '', total_harga: '' });
    loadVoucher();
  };

  // ==== HAPUS VOUCHER ====
  const hapusVoucher = async (id) => {
    if (!confirm('Yakin hapus voucher ini?')) return;
    setLoading(true);
    const { error } = await supabase.from('penjualan_voucher').delete().eq('id', id);
    setLoading(false);
    if (error) return showMsg('error', 'Gagal hapus: ' + error.message);
    showMsg('success', 'Voucher dihapus.');
    loadVoucher();
  };

  // ==== HITUNG TUTUP KASIR ====
  const hitungTutupKasir = () => {
    const totalBbm = bbmList.reduce((s, x) => s + Number(x.total_harga || 0), 0);
    const totalNfr = nfrList.reduce((s, x) => s + Number(x.total_harga || 0), 0);
    const totalVoucher = voucherList.reduce((s, x) => s + Number(x.total_harga || 0), 0);
    const totalLiterVoucher = voucherList.reduce((s, x) => s + Number(x.jumlah_liter || 0), 0);
    setTutupData({
      totalBbm,
      totalNfr,
      totalVoucher,
      totalLiterVoucher,
      grandTotal: totalBbm + totalNfr + totalVoucher,
      countBbm: bbmList.length,
      countNfr: nfrList.length,
      countVoucher: voucherList.length,
    });
  };

  useEffect(() => {
    if (activeTab === 'tutup') hitungTutupKasir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bbmList, nfrList, voucherList]);

  // ==== RENDER ====
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg mb-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Kasir SPBU</h1>
              <p className="text-sm opacity-90">
                Operator: <span className="font-semibold">{operator || 'Belum login'}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm opacity-90">Shift:</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option className="text-black" value="Pagi">Pagi</option>
                <option className="text-black" value="Siang">Siang</option>
                <option className="text-black" value="Malam">Malam</option>
              </select>
            </div>
          </div>
        </div>

        {/* NOTIFIKASI */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow mb-4 overflow-x-auto">
          {[
            { key: 'bbm', label: '⛽ BBM' },
            { key: 'nfr', label: '🛒 NFR' },
            { key: 'voucher', label: '🎫 Voucher' },
            { key: 'tutup', label: '🔒 Tutup Kasir' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === t.key
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ============ TAB BBM ============ */}
        {activeTab === 'bbm' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-slate-800 mb-4">Input Penjualan BBM</h2>
              <form onSubmit={submitBbm} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-600">Jenis BBM</label>
                  <select
                    value={bbmForm.jenis}
                    onChange={(e) => setBbmForm({ ...bbmForm, jenis: e.target.value })}
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                  >
                    {JENIS_BBM.map((j) => (
                      <option key={j} value={j}>{j} — {formatRupiah(HARGA_BBM[j])}/L</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Jumlah Liter</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bbmForm.liter}
                    onChange={(e) => setBbmForm({ ...bbmForm, liter: e.target.value })}
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                {bbmForm.liter > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                    Total: <b>{formatRupiah(HARGA_BBM[bbmForm.jenis] * parseFloat(bbmForm.liter || 0))}</b>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan BBM'}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-slate-800 mb-3">Riwayat BBM Hari Ini ({bbmList.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bbmList.length === 0 && <p className="text-sm text-slate-400">Belum ada data.</p>}
                {bbmList.map((b) => (
                  <div key={b.id} className="border rounded-lg p-3 text-sm flex justify-between">
                    <div>
                      <p className="font-semibold">{b.jenis_bbm} — {b.jumlah_liter} L</p>
                      <p className="text-xs text-slate-500">{b.shift} • {b.operator}</p>
                    </div>
                    <p className="font-bold text-blue-700">{formatRupiah(b.total_harga)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ TAB NFR ============ */}
        {activeTab === 'nfr' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-slate-800 mb-4">Input Penjualan NFR</h2>
              <form onSubmit={submitNfr} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-600">Nama Produk</label>
                  <input
                    type="text"
                    value={nfrForm.nama}
                    onChange={(e) => setNfrForm({ ...nfrForm, nama: e.target.value })}
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                    placeholder="Contoh: Aqua 600ml"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Jumlah</label>
                    <input
                      type="number"
                      min="1"
                      value={nfrForm.jumlah}
                      onChange={(e) => setNfrForm({ ...nfrForm, jumlah: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Harga Satuan</label>
                    <input
                      type="number"
                      min="0"
                      value={nfrForm.harga}
                      onChange={(e) => setNfrForm({ ...nfrForm, harga: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan NFR'}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-slate-800 mb-3">Riwayat NFR Hari Ini ({nfrList.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {nfrList.length === 0 && <p className="text-sm text-slate-400">Belum ada data.</p>}
                {nfrList.map((n) => (
                  <div key={n.id} className="border rounded-lg p-3 text-sm flex justify-between">
                    <div>
                      <p className="font-semibold">{n.nama_produk}</p>
                      <p className="text-xs text-slate-500">{n.jumlah} x {formatRupiah(n.harga_satuan)}</p>
                    </div>
                    <p className="font-bold text-blue-700">{formatRupiah(n.total_harga)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ TAB VOUCHER ============ */}
        {activeTab === 'voucher' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-slate-800 mb-1">🎫 Input Voucher BBM</h2>
              <p className="text-xs text-slate-500 mb-4">
                Catat penjualan BBM menggunakan voucher (bukan uang tunai).
              </p>
              <form onSubmit={submitVoucher} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-600">Nomor Voucher</label>
                  <input
                    type="text"
                    value={voucherForm.no_voucher}
                    onChange={(e) => setVoucherForm({ ...voucherForm, no_voucher: e.target.value })}
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm font-mono uppercase"
                    placeholder="Contoh: VCR-2024-001"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Jenis BBM</label>
                  <select
                    value={voucherForm.jenis_bbm}
                    onChange={(e) => setVoucherForm({ ...voucherForm, jenis_bbm: e.target.value })}
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                  >
                    {JENIS_BBM.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Jumlah Liter</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={voucherForm.jumlah_liter}
                      onChange={(e) => setVoucherForm({ ...voucherForm, jumlah_liter: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Total Harga (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={voucherForm.total_harga}
                      onChange={(e) => setVoucherForm({ ...voucherForm, total_harga: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Voucher'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-slate-800 mb-3">
                Riwayat Voucher Hari Ini ({voucherList.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {voucherList.length === 0 && (
                  <p className="text-sm text-slate-400">Belum ada voucher hari ini.</p>
                )}
                {voucherList.map((v) => (
                  <div key={v.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-bold text-amber-700">{v.no_voucher}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {v.jenis_bbm} • {v.jumlah_liter} L • {v.shift}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-700">{formatRupiah(v.total_harga)}</p>
                        <button
                          onClick={() => hapusVoucher(v.id)}
                          className="text-xs text-red-500 hover:text-red-700 mt-1"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ TAB TUTUP KASIR ============ */}
        {activeTab === 'tutup' && (
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-bold text-slate-800 mb-4">🔒 Rekap & Tutup Kasir</h2>
            {!tutupData ? (
              <p className="text-sm text-slate-400">Memuat rekap...</p>
            ) : (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-blue-600 font-semibold">TOTAL BBM</p>
                    <p className="text-lg font-bold text-blue-800">{formatRupiah(tutupData.totalBbm)}</p>
                    <p className="text-xs text-slate-500">{tutupData.countBbm} transaksi</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-green-600 font-semibold">TOTAL NFR</p>
                    <p className="text-lg font-bold text-green-800">{formatRupiah(tutupData.totalNfr)}</p>
                    <p className="text-xs text-slate-500">{tutupData.countNfr} transaksi</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-xs text-amber-600 font-semibold">TOTAL VOUCHER</p>
                    <p className="text-lg font-bold text-amber-800">{formatRupiah(tutupData.totalVoucher)}</p>
                    <p className="text-xs text-slate-500">
                      {tutupData.countVoucher} voucher • {tutupData.totalLiterVoucher} L
                    </p>
                  </div>
                </div>
                <div className="bg-slate-800 text-white rounded-lg p-4 flex justify-between items-center">
                  <span className="font-semibold">GRAND TOTAL</span>
                  <span className="text-xl font-bold">{formatRupiah(tutupData.grandTotal)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Shift: <b>{shift}</b> • Operator: <b>{operator}</b> • Tanggal: <b>{today}</b>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}