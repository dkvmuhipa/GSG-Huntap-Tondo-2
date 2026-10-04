import * as XLSX from 'xlsx';

export interface Transaction {
  id?: string;
  date: string;
  type: string;
  category?: string;
  source?: string;
  allocationMode?: string;
  expenseSource?: string;
  amount: number;
  ops?: number;
  devFund?: number;
  addedBy?: string;
  addedByName?: string;
  status?: string;
  notes?: string;
}

export interface Booking {
  id?: string;
  customerName?: string;
  phone?: string;
  startDate?: string;
  endDate?: string;
  purpose?: string;
  amount?: number;
  status: string;
  paymentStatus?: string;
  packageTitle?: string;
  packageName?: string;
  selectedAddons?: Record<string, any>;
  notes?: string;
}

/**
 * Format currency to Indonesian Rupiah string
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formats date into readable Indonesian string
 */
function formatDate(dateStr?: string | any): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Formats date and time into readable Indonesian string
 */
function formatDateTime(dateStr?: string | any): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WITA';
  } catch {
    return String(dateStr);
  }
}

/**
 * Export Transactions / Cashflow to Microsoft Excel (.xlsx)
 */
export function exportTransactionsToExcel(
  transactions: Transaction[], 
  summary?: { 
    totalIncome: number; 
    totalExpense: number; 
    netBalance: number; 
    opsBalance: number; 
    devBalance: number;
    periodLabel?: string;
  }
) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate totals if not provided
  const totalIncome = summary?.totalIncome ?? transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = summary?.totalExpense ?? transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netBalance = summary?.netBalance ?? (totalIncome - totalExpense);

  // 1. Prepare worksheet rows
  const rows: any[][] = [];

  // Header Title
  rows.push(['LAPORAN BUKU KAS KEUANGAN']);
  rows.push(['GEDUNG SERBAGUNA (GSG) HUNTAP TONDO 2']);
  rows.push([`Dicetak Pada: ${currentDate} | Periode: ${summary?.periodLabel || 'Semua Data'}`]);
  rows.push([]); // blank row

  // Summary Card Block
  rows.push(['RINGKASAN KEUANGAN']);
  rows.push(['Total Pemasukan', totalIncome, formatRupiah(totalIncome)]);
  rows.push(['Total Pengeluaran', totalExpense, formatRupiah(totalExpense)]);
  rows.push(['Saldo Bersih Kas', netBalance, formatRupiah(netBalance)]);
  if (summary?.opsBalance !== undefined && summary?.devBalance !== undefined) {
    rows.push(['Saldo Kas Operasional', summary.opsBalance, formatRupiah(summary.opsBalance)]);
    rows.push(['Saldo Kas Pengembangan', summary.devBalance, formatRupiah(summary.devBalance)]);
  }
  rows.push([]); // blank row

  // Transactions Table Header
  const tableHeaders = [
    'No',
    'Tanggal',
    'Tipe Transaksi',
    'Kategori',
    'Keterangan / Sumber',
    'Pos Alokasi Dana',
    'Nominal Pemasukan (Rp)',
    'Nominal Pengeluaran (Rp)',
    'Dicatat Oleh',
    'Status'
  ];
  rows.push(tableHeaders);

  // Table Data Rows
  transactions.forEach((item, index) => {
    const isIncome = item.type === 'income';
    const isExpense = item.type === 'expense';
    
    let alokasi = '-';
    if (item.type === 'income') {
      alokasi = item.allocationMode === 'full_ops' 
        ? '100% Operasional' 
        : item.allocationMode === 'full_dev' 
          ? '100% Pengembangan' 
          : `Split (Ops: ${formatRupiah(item.ops || 0)} | Dev: ${formatRupiah(item.devFund || 0)})`;
    } else if (item.type === 'expense') {
      alokasi = item.expenseSource === 'dev' ? 'Kas Pengembangan' : 'Kas Operasional';
    } else {
      alokasi = 'Realokasi Antar Kas';
    }

    rows.push([
      index + 1,
      formatDate(item.date),
      item.type === 'income' ? 'Pemasukan' : item.type === 'expense' ? 'Pengeluaran' : 'Realokasi',
      item.category || 'Umum',
      item.source || '-',
      alokasi,
      isIncome ? item.amount : 0,
      isExpense ? item.amount : 0,
      item.addedByName || item.addedBy || 'Admin',
      item.status === 'verified' ? 'Terverifikasi' : 'Valid'
    ]);
  });

  // Footer Totals Row
  rows.push([]);
  rows.push([
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    totalIncome,
    totalExpense,
    '',
    ''
  ]);

  // 2. Create Sheet & Workbook
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for comfortable reading
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Tanggal
    { wch: 16 }, // Tipe
    { wch: 20 }, // Kategori
    { wch: 35 }, // Keterangan
    { wch: 28 }, // Pos Alokasi
    { wch: 22 }, // Pemasukan
    { wch: 22 }, // Pengeluaran
    { wch: 24 }, // Dicatat Oleh
    { wch: 15 }  // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Kas GSG');

  // 3. Write and download file
  const fileName = `Laporan_Kas_GSG_Tondo2_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Bookings / Reservations to Microsoft Excel (.xlsx)
 */
export function exportBookingsToExcel(bookings: Booking[], filterStatus = 'Semua') {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const rows: any[][] = [];

  // Header Title
  rows.push(['REKAP DATA RESERVASI GEDUNG SERBAGUNA']);
  rows.push(['GEDUNG SERBAGUNA (GSG) HUNTAP TONDO 2']);
  rows.push([`Dicetak Pada: ${currentDate} | Status Filter: ${filterStatus}`]);
  rows.push([]);

  // Summary counts
  const total = bookings.length;
  const approved = bookings.filter(b => b.status === 'approved').length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const rejected = bookings.filter(b => b.status === 'rejected').length;
  const totalRevenue = bookings
    .filter(b => b.status !== 'rejected')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  rows.push(['RINGKASAN DATA RESERVASI']);
  rows.push(['Total Permohonan', total]);
  rows.push(['Disetujui (Approved)', approved]);
  rows.push(['Menunggu (Pending)', pending]);
  rows.push(['Selesai Terlaksana', completed]);
  rows.push(['Ditolak (Rejected)', rejected]);
  rows.push(['Estimasi Nilai Sewa', totalRevenue, formatRupiah(totalRevenue)]);
  rows.push([]);

  // Table Headers
  const tableHeaders = [
    'No',
    'ID Booking',
    'Nama Pemohon',
    'No. WhatsApp / HP',
    'Tanggal Mulai Acara',
    'Tanggal Selesai Acara',
    'Paket / Layanan',
    'Keperluan Acara',
    'Total Biaya (Rp)',
    'Status Reservasi',
    'Status Pembayaran',
    'Fasilitas Tambahan',
    'Catatan / Pesan'
  ];
  rows.push(tableHeaders);

  // Table Data Rows
  bookings.forEach((b, index) => {
    let statusLabel = 'Menunggu';
    if (b.status === 'approved') statusLabel = 'Disetujui';
    else if (b.status === 'completed') statusLabel = 'Selesai';
    else if (b.status === 'rejected') statusLabel = 'Ditolak';

    const addons = (b as any).selectedAddons 
      ? Object.entries((b as any).selectedAddons)
          .filter(([_, qty]) => Number(qty) > 0)
          .map(([key, qty]) => `${key}: ${qty}`)
          .join(', ')
      : '-';

    rows.push([
      index + 1,
      b.id ? `#${b.id.substring(0, 8).toUpperCase()}` : '-',
      b.customerName || '-',
      b.phone || '-',
      formatDate(b.startDate),
      b.endDate ? formatDate(b.endDate) : formatDate(b.startDate),
      (b as any).packageTitle || (b as any).packageName || 'Paket Standar',
      b.purpose || '-',
      b.amount || 0,
      statusLabel,
      b.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM LUNAS',
      addons || '-',
      (b as any).notes || '-'
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // ID
    { wch: 25 }, // Nama Pemohon
    { wch: 18 }, // WhatsApp
    { wch: 20 }, // Tgl Mulai
    { wch: 20 }, // Tgl Selesai
    { wch: 20 }, // Paket
    { wch: 30 }, // Keperluan
    { wch: 18 }, // Biaya
    { wch: 18 }, // Status
    { wch: 18 }, // Pembayaran
    { wch: 25 }, // Fasilitas Tambahan
    { wch: 30 }  // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Booking');

  const fileName = `Rekap_Booking_GSG_Tondo2_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Audit Logs to Microsoft Excel (.xlsx)
 */
export function exportAuditLogsToExcel(logs: any[]) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const rows: any[][] = [];

  rows.push(['RIWAYAT LOG AKTIVITAS ADMINISTRATOR (AUDIT TRAIL)']);
  rows.push(['GEDUNG SERBAGUNA (GSG) HUNTAP TONDO 2']);
  rows.push([`Dicetak Pada: ${currentDate} | Total Rekaman: ${logs.length}`]);
  rows.push([]);

  const tableHeaders = [
    'No',
    'Waktu Aktivitas (WITA)',
    'Aksi / Modul',
    'Keterangan Aktivitas',
    'Nama Administrator',
    'Email Petugas',
    'Peran / Role',
    'ID Target Referensi'
  ];
  rows.push(tableHeaders);

  logs.forEach((log, index) => {
    rows.push([
      index + 1,
      formatDateTime(log.createdAt),
      (log.action || '-').toUpperCase(),
      log.description || '-',
      log.actorName || 'Admin',
      log.actorEmail || '-',
      (log.actorRole || 'admin').toUpperCase(),
      log.targetId || '-'
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 24 }, // Waktu
    { wch: 18 }, // Aksi
    { wch: 45 }, // Keterangan
    { wch: 24 }, // Nama
    { wch: 28 }, // Email
    { wch: 16 }, // Role
    { wch: 20 }  // ID Target
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail');

  const fileName = `Audit_Log_GSG_Tondo2_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
