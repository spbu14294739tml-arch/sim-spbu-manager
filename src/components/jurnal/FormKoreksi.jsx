// src/components/jurnal/FormKoreksi.jsx
import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { formatRupiah } from '../../lib/formatHelper';

/**
 * Form Jurnal Koreksi untuk salah input tanggal lampau.
 * Murni presentational — logika insert 2 baris jurnal tetap di parent
 * (lihat handleSimpanKoreksi di JurnalTransaksiKasir.jsx).
 *
 * @param {object}   props
 * @param {object}   props.koreksiData     - { tanggal_asli, shift_asli, jenis, uraian_asli, nominal_asli, nominal_benar, reff, alasan }
 * @param {function} props.setKoreksiData  - setter state koreksiData
 * @param {Array}    props.listShift       - daftar nama shift
 * @param {Array}    props.masterKodeAkun  - daftar semua kode akun
 */
export default function FormKoreksi({
  koreksiData,
  setKoreksiData,
  listShift,
  masterKodeAkun,
}) {
  // Hitung selisih koreksi (benar - salah) untuk preview
  const selisih =
    koreksiData.nominal_asli && koreksiData.nominal_benar
      ? Math.abs(parseFloat(koreksiData.nominal_benar) - parseFloat(koreksiData.nominal_asli))
      : null;

  return (
    <>
      {/* Info Mode Koreksi */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
        <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1 mb-1">
          <ShieldAlert size={12} /> Mode Koreksi
        </p>
        <p className="text-[10px] text-amber-700 leading-snug">
          Untuk salah input <b>tanggal lampau</b>. Sistem membuat 2 baris jurnal:
          (1) balik transaksi salah, (2) catat nilai benar. Jejak audit tetap terjaga.
        </p>
      </div>

      {/* Tanggal & Shift Asli */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Tanggal Asli (Salah)</label>
          <input
            type="date"
            required
            value={koreksiData.tanggal_asli}
            onChange={(e) => setKoreksiData({ ...koreksiData, tanggal_asli: e.target.value })}
            className="w-full px-2 py-1.5 border border-amber-300 rounded-lg text-xs font-semibold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Shift Asli</label>
          <select
            required
            value={koreksiData.shift_asli}
            onChange={(e) => setKoreksiData({ ...koreksiData, shift_asli: e.target.value })}
            className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs"
          >
            <option value="">-- Pilih Shift --</option>
            {listShift.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Jenis Transaksi Asli */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Jenis Transaksi Asli</label>
        <select
          value={koreksiData.jenis}
          onChange={(e) => setKoreksiData({ ...koreksiData, jenis: e.target.value })}
          className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs"
        >
          <option value="BBM">BBM</option>
          <option value="LPG">LPG</option>
          <option value="OLI">OLI</option>
          <option value="VOUCHER">VOUCHER</option>
          <option value="LAINNYA">LAINNYA</option>
        </select>
      </div>

      {/* Uraian Asli */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Uraian Transaksi Asli (yang salah)</label>
        <input
          type="text"
          required
          value={koreksiData.uraian_asli}
          onChange={(e) => setKoreksiData({ ...koreksiData, uraian_asli: e.target.value.toUpperCase() })}
          className="w-full px-2 py-1.5 border rounded-lg text-xs"
          placeholder="Cth: PENJUALAN BBM PERTALITE 100 L"
        />
      </div>

      {/* Kode Akun */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Kode Akun / Reff</label>
        <select
          required
          value={koreksiData.reff}
          onChange={(e) => setKoreksiData({ ...koreksiData, reff: e.target.value })}
          className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs"
        >
          <option value="">-- Pilih Kode Akun --</option>
          {masterKodeAkun.map((k, i) => (
            <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>
          ))}
        </select>
      </div>

      {/* Nominal Salah vs Benar */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-red-700 mb-1">Nominal Salah (Rp)</label>
          <input
            type="number"
            required
            value={koreksiData.nominal_asli}
            onChange={(e) => setKoreksiData({ ...koreksiData, nominal_asli: e.target.value })}
            className="w-full px-2 py-1.5 border-2 border-red-200 rounded-lg text-xs font-bold text-red-700"
            placeholder="Nilai yang salah"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-green-700 mb-1">Nominal Benar (Rp)</label>
          <input
            type="number"
            required
            value={koreksiData.nominal_benar}
            onChange={(e) => setKoreksiData({ ...koreksiData, nominal_benar: e.target.value })}
            className="w-full px-2 py-1.5 border-2 border-green-200 rounded-lg text-xs font-bold text-green-700"
            placeholder="Nilai yang benar"
          />
        </div>
      </div>

      {/* Alasan */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Alasan Koreksi (wajib, untuk audit)</label>
        <input
          type="text"
          required
          value={koreksiData.alasan}
          onChange={(e) => setKoreksiData({ ...koreksiData, alasan: e.target.value.toUpperCase() })}
          className="w-full px-2 py-1.5 border rounded-lg text-xs"
          placeholder="Cth: SALAH KETIK LITER, HARUSNYA 10 BUKAN 100"
        />
      </div>

      {/* Preview Selisih */}
      {selisih !== null && !isNaN(selisih) && (
        <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
          <div className="flex justify-between text-[10px] font-bold text-amber-700 mb-0.5">
            <span>Selisih Koreksi:</span>
            <span>{formatRupiah(selisih)}</span>
          </div>
          <p className="text-[9px] text-amber-600 italic">
            Akan dibuat 2 baris jurnal tertanggal hari ini.
          </p>
        </div>
      )}
    </>
  );
}