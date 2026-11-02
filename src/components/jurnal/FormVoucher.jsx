// src/components/jurnal/FormVoucher.jsx
import React from 'react';
import { formatRupiah } from '../../lib/formatHelper';

/**
 * Form input voucher baru (status PENDING).
 * Murni presentational — semua state & handler dikelola parent.
 *
 * @param {object}   props
 * @param {object}   props.voucherData        - { no_awal, no_akhir, customer, nominal }
 * @param {function} props.setVoucherData     - setter state voucherData
 * @param {number}   props.totalLembar        - hasil hitung lembar (dari helper)
 * @param {number}   props.totalNominalVoucher - total nominal (lembar × nominal)
 * @param {Array}    props.daftarCustomer     - daftar nama customer untuk datalist
 */
export default function FormVoucher({
  voucherData,
  setVoucherData,
  totalLembar,
  totalNominalVoucher,
  daftarCustomer,
}) {
  return (
    <>
      {/* Range Nomor Voucher */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Awal No. Voucher</label>
          <input
            type="number"
            required
            value={voucherData.no_awal}
            onChange={(e) => setVoucherData({ ...voucherData, no_awal: e.target.value })}
            className="w-full px-2 py-1.5 border-2 border-purple-300 rounded-lg text-xs font-bold text-purple-700"
            placeholder="Cth: 1"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Akhir No. Voucher</label>
          <input
            type="number"
            required
            value={voucherData.no_akhir}
            onChange={(e) => setVoucherData({ ...voucherData, no_akhir: e.target.value })}
            className="w-full px-2 py-1.5 border-2 border-purple-300 rounded-lg text-xs font-bold text-purple-700"
            placeholder="Cth: 10"
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-500 italic mt-1">
        *Nomor awal terisi otomatis melanjutkan nomor terakhir.
      </p>

      {/* Customer (datalist) */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Customer / Instansi</label>
        <input
          type="text"
          list="customer-list"
          required
          value={voucherData.customer}
          onChange={(e) => setVoucherData({ ...voucherData, customer: e.target.value.toUpperCase() })}
          className="w-full px-2 py-1.5 border rounded-lg text-xs"
          placeholder="Ketik atau Pilih..."
        />
        <datalist id="customer-list">
          {daftarCustomer.map((c, i) => <option key={i} value={c} />)}
        </datalist>
      </div>

      {/* Nominal per Lembar */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Nominal / Lembar (Rp)</label>
        <input
          type="number"
          required
          value={voucherData.nominal}
          onChange={(e) => setVoucherData({ ...voucherData, nominal: e.target.value })}
          className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold"
          placeholder="Cth: 50000"
        />
      </div>

      {/* Ringkasan: Total Lembar & Tagihan */}
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
      <p className="text-[10px] text-slate-500 italic mt-1">
        *Status PENDING. Ceklis per lembar jika fisik voucher diterima.
      </p>
    </>
  );
}