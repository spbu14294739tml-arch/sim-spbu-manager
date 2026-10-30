// src/components/jurnal/FormBBM.jsx
import React from 'react';
import { Fuel } from 'lucide-react';
import { formatRupiah } from '../../lib/formatHelper';

/**
 * Form input penjualan BBM.
 * Murni presentational — semua state & handler dikelola parent.
 *
 * @param {object}   props
 * @param {object}   props.bbmData            - state form BBM: { dispenser, jenis_bbm, jumlah_liter, operator, total_harga, reff }
 * @param {function} props.setBbmData         - setter state bbmData
 * @param {Array}    props.masterProdukBBM    - daftar produk BBM dari Supabase
 * @param {Array}    props.listDispenser      - daftar nama dispenser
 * @param {Array}    props.filteredKodeAkun   - kode akun terfilter untuk tab BBM
 * @param {function} props.onSelectBBM        - callback saat produk BBM dipilih (terima jenis_bbm)
 * @param {function} props.onJumlahChange     - callback saat jumlah liter berubah (terima event)
 */
export default function FormBBM({
  bbmData,
  setBbmData,
  masterProdukBBM,
  listDispenser,
  filteredKodeAkun,
  onSelectBBM,
  onJumlahChange,
}) {
  return (
    <>
      {/* Pilih Dispenser */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Pompa / Dispenser</label>
        <select
          value={bbmData.dispenser}
          onChange={(e) => setBbmData({ ...bbmData, dispenser: e.target.value })}
          className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs"
        >
          {listDispenser.map((d, i) => <option key={i} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Pilih Jenis BBM (grid kartu) */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Jenis BBM</label>
        <div className="grid grid-cols-2 gap-2">
          {masterProdukBBM.map((bbm) => (
            <div
              key={bbm.id}
              onClick={() => onSelectBBM(bbm.jenis_bbm)}
              className={`cursor-pointer border rounded-xl p-2 flex flex-col items-center justify-center transition-all ${
                bbmData.jenis_bbm === bbm.jenis_bbm
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
            >
              {bbm.logo_url
                ? <img src={bbm.logo_url} alt={bbm.jenis_bbm} className="h-8 object-contain mb-1" />
                : <Fuel size={20} className="mb-1 text-slate-400" />}
              <span className="text-[10px] font-bold text-center leading-tight">{bbm.jenis_bbm}</span>
              <span className="text-[10px] font-bold mt-1 text-slate-600">
                {formatRupiah(bbm.harga_per_liter)}/L
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Jumlah Liter + Operator */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Jumlah (Liter)</label>
          <input
            type="number"
            step="0.01"
            required
            value={bbmData.jumlah_liter}
            onChange={onJumlahChange}
            className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold"
            placeholder="0.0"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Operator</label>
          <input
            type="text"
            required
            value={bbmData.operator}
            onChange={(e) => setBbmData({ ...bbmData, operator: e.target.value.toUpperCase() })}
            className="w-full px-2 py-1.5 border rounded-lg text-xs"
            placeholder="Nama..."
          />
        </div>
      </div>

      {/* Kode Akun / Reff */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Kode Akun / Reff</label>
        <select
          value={bbmData.reff}
          onChange={(e) => setBbmData({ ...bbmData, reff: e.target.value })}
          className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs"
        >
          <option value="">-- Pilih Kode Akun --</option>
          {filteredKodeAkun.map((k, i) => (
            <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>
          ))}
        </select>
      </div>

      {/* Total Harga */}
      <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
        <p className="text-[10px] text-blue-600 font-bold mb-0.5">Total Harga:</p>
        <p className="text-lg font-black text-blue-700">{formatRupiah(bbmData.total_harga)}</p>
      </div>
    </>
  );
}