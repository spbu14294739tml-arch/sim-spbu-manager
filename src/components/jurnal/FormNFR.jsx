// src/components/jurnal/FormNFR.jsx
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { formatRupiah } from '../../lib/formatHelper';

/**
 * Form input LPG & Oli (NFR). Satu komponen untuk dua kategori
 * karena struktur data & alurnya identik — hanya beda sumber produk.
 *
 * @param {object}   props
 * @param {string}   props.activeTab        - 'LPG' | 'OLI'
 * @param {object}   props.nfrData          - { produk, jumlah, total_harga, reff }
 * @param {function} props.setNfrData       - setter state nfrData
 * @param {Array}    props.produkList       - daftar produk (sudah difilter LPG/OLI)
 * @param {Array}    props.filteredKodeAkun - kode akun terfilter sesuai tab
 * @param {function} props.onProdukClick    - callback saat produk diklik (terima produk)
 * @param {function} props.onJumlahChange   - callback saat jumlah berubah (terima event)
 */
export default function FormNFR({
  activeTab,
  nfrData,
  setNfrData,
  produkList,
  filteredKodeAkun,
  onProdukClick,
  onJumlahChange,
}) {
  return (
    <>
      {/* Pilih Produk (grid kartu) */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Pilih Produk {activeTab}</label>
        <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
          {produkList.map(p => (
            <div
              key={p.id}
              onClick={() => onProdukClick(p)}
              className={`cursor-pointer border rounded-lg p-1.5 flex flex-col items-center transition-all ${
                nfrData.produk?.id === p.id
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200'
              }`}
            >
              {p.foto_url
                ? <img src={p.foto_url} alt={p.nama_produk} className="w-8 h-8 object-cover rounded-md mb-1" />
                : <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center mb-1"><ImageIcon size={14} className="text-slate-400" /></div>}
              <span className="text-[10px] font-semibold text-center leading-tight mb-1">{p.nama_produk}</span>
              <span className="text-[9px] text-green-600 font-bold">{formatRupiah(p.harga_jual)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Jumlah */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Jumlah (Pcs/Tabung)</label>
        <input
          type="number"
          required
          value={nfrData.jumlah}
          onChange={onJumlahChange}
          className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold"
          placeholder="0"
        />
      </div>

      {/* Kode Akun / Reff */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">Kode Akun / Reff</label>
        <select
          value={nfrData.reff}
          onChange={(e) => setNfrData({ ...nfrData, reff: e.target.value })}
          className="w-full px-2 py-1.5 border rounded-lg bg-white text-xs"
        >
          <option value="">-- Pilih Kode Akun --</option>
          {filteredKodeAkun.map((k, i) => (
            <option key={i} value={k.kode_reff}>{k.kode_reff} - {k.nama_transaksi}</option>
          ))}
        </select>
      </div>

      {/* Total Harga */}
      <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
        <p className="text-[10px] text-emerald-600 font-bold mb-0.5">Total Harga:</p>
        <p className="text-lg font-black text-emerald-700">{formatRupiah(nfrData.total_harga)}</p>
      </div>
    </>
  );
}