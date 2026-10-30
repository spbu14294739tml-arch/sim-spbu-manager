// src/components/jurnal/TabelJurnal.jsx
import React from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { formatRupiah } from '../../lib/formatHelper';
import { isBarisKoreksi } from '../../lib/jurnalHelpers';

/**
 * Tabel Buku Jurnal Harian Kasir.
 * Murni presentational — hapus tetap lewat callback parent.
 *
 * @param {object}   props
 * @param {Array}    props.jurnalHariIni  - daftar baris jurnal hari ini
 * @param {function} props.onHapus        - callback hapus (terima objek jurnal)
 * @param {boolean}  props.isSaving       - disable tombol saat proses
 */
export default function TabelJurnal({ jurnalHariIni, onHapus, isSaving }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <BookOpen size={16} className="text-slate-500" /> Buku Jurnal Harian Kasir
        </h2>
        <p className="text-xs text-slate-500">{jurnalHariIni.length} transaksi</p>
      </div>

      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-left">Dari / Ke</th>
              <th className="px-3 py-3 text-left">Uraian</th>
              <th className="px-3 py-3 text-center">Reff</th>
              <th className="px-3 py-3 text-right">Debet (Rp)</th>
              <th className="px-3 py-3 text-right">Kredit (Rp)</th>
              <th className="px-3 py-3 text-right">Saldo (Rp)</th>
              <th className="px-3 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jurnalHariIni.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  Belum ada transaksi hari ini.
                </td>
              </tr>
            ) : jurnalHariIni.map((item, idx) => (
              <tr key={item.id} className={`hover:bg-slate-50 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                <td className="px-3 py-2 font-semibold text-slate-800">{item.dari_ke}</td>
                <td className="px-3 py-2 text-slate-600">{item.uraian_kegiatan}</td>
                <td className="px-3 py-2 text-center text-slate-400">{item.reff || '-'}</td>
                <td className="px-3 py-2 text-right font-medium text-green-600">
                  {item.debet > 0 ? formatRupiah(item.debet) : '-'}
                </td>
                <td className="px-3 py-2 text-right font-medium text-red-600">
                  {item.kredit > 0 ? formatRupiah(item.kredit) : '-'}
                </td>
                <td className="px-3 py-2 text-right font-bold text-slate-800 bg-slate-50/50">
                  {formatRupiah(item.saldo)}
                </td>
                <td className="px-3 py-2 text-center">
                  {isBarisKoreksi(item) ? (
                    <span
                      className="text-[9px] text-amber-600 font-bold italic"
                      title="Baris koreksi tidak bisa dihapus"
                    >
                      AUDIT
                    </span>
                  ) : (
                    <button
                      onClick={() => onHapus(item)}
                      disabled={isSaving}
                      title="Hapus / Koreksi (hanya hari ini)"
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}