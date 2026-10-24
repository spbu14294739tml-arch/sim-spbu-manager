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
// Fungsi untuk mengekspor data JSON ke file CSV (Excel)
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor!');
    return;
  }

  // 1. Ambil header (keys dari object pertama)
  const headers = Object.keys(data[0]);
  
  // 2. Buat baris header
  const csvRows = [];
  csvRows.push(headers.join(','));

  // 3. Looping data dan ubah ke format CSV
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"'); // Escape tanda kutip
      return `"${escaped}"`; // Bungkus dengan tanda kutip
    });
    csvRows.push(values.join(','));
  }

  // 4. Gabungkan menjadi string CSV
  const csvString = csvRows.join('\n');

  // 5. Buat file Blob dan unduh
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};