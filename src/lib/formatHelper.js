// src/lib/formatHelper.js

// 1. Fungsi untuk memformat angka menjadi Rupiah
export const formatRupiah = (angka) => {
  if (!angka) return 'Rp 0';
  // Mengubah string/float menjadi angka, lalu memformatnya
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

// 2. Fungsi untuk memformat tanggal (dari database ke tampilan)
export const formatTanggal = (tanggal) => {
  if (!tanggal) return '-';
  const date = new Date(tanggal);
  // Mengubah format menjadi: 20 Oktober 2026
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};