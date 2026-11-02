// src/components/jurnal/FormLainnya.jsx
import React from 'react';
import { formatRupiah } from '../../lib/formatHelper';

/**
 * Form input transaksi "Lainnya" (Debet / Kredit manual).
 * Murni presentational — logika mutasi akun (DEBET/KREDIT) tetap di parent.
 *
 * @param {object}   props
 * @param {object}   props.lainnyaData     - { dari_ke, uraian_kegiatan, reff, debet, kredit }
 * @param {function} props.setLainnyaData  - setter state lainnyaData
 * @param {Array}    props.masterKodeAkun  - daftar semua kode akun
 */
export default function FormLainnya({
  lainnyaData,
  setLainnyaData,
  masterKodeAkun,
}) {
  // Total tampilan: debet positif, kredit negatif
  const totalTampil = lainnyaData.debet
    ? parseFloat(lainnyaData.debet)
    : lainnyaData.kredit
      ? -parseFloat(lainnyaData.kredit)
      : 0;

  return (
    <>
      {/* Dari / Ke */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Dari / Ke</label>
        <select
          value={lainnyaData.dari_ke}
          onChange={(e) => setLainnyaData({ ...lainnyaData, dari_ke: e.target.value })}
          className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs"
        >
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

      {/* Uraian */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Uraian Kegiatan</label>
        <input
          type="text"
          required
          value={lainnyaData.uraian_kegiatan}
          onChange={(e) => setLainnyaData({ ...lainnyaData, uraian_kegiatan: e.target.value.toUpperCase() })}
          className="w-full px-2 py-1.5 border rounded-lg text-xs"
          placeholder="Cth: Beli Air Minum"
        />
      </div>

      {/* Kode Akun */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Kode Akun / Reff</label>
        <select
          value={lainnyaData.reff}
          onChange={(e) => setLainnyaData({ ...lainnyaData, reff: e.target.value })}
          className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs"
        >
          <option value="">-- Pilih Kode Akun --</option>
          {masterKodeAkun.map((k, i) => (
            <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>
          ))}
        </select>
      </div>

      {/* Debet / Kredit */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-green-700 mb-1">Debet (Masuk)</label>
          <input
            type="number"
            value={lainnyaData.debet}
            onChange={(e) => setLainnyaData({ ...lainnyaData, debet: e.target.value, kredit: '' })}
            className="w-full px-2 py-1.5 border-2 border-green-200 rounded-lg text-xs font-bold text-green-700 focus:ring-2 focus:ring-green-500"
            placeholder="Rp"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-red-700 mb-1">Kredit (Keluar)</label>
          <input
            type="number"
            value={lainnyaData.kredit}
            onChange={(e) => setLainnyaData({ ...lainnyaData, kredit: e.target.value, debet: '' })}
            className="w-full px-2 py-1.5 border-2 border-red-200 rounded-lg text-xs font-bold text-red-700 focus:ring-2 focus:ring-red-500"
            placeholder="Rp"
          />
        </div>
      </div>

      {/* Total */}
      <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 mt-2">
        <p className="text-[10px] text-slate-600 font-bold mb-0.5">Total:</p>
        <p className="text-lg font-black text-slate-800">{formatRupiah(totalTampil)}</p>
      </div>
    </>
  );
}