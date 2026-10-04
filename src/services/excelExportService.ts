import * as XLSX from 'xlsx-js-style';

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

// ==========================================
// COLOR PALETTE & DESIGN SYSTEM
// ==========================================
const PALETTE = {
  headerBg: '0F172A',       // Slate 900 (Main Title)
  headerSubBg: '1E293B',    // Slate 800 (Subtitle)
  headerMetaBg: 'F1F5F9',   // Slate 100 (Meta row)
  tableHeaderBg: '1E3A8A',  // Navy Blue (Table Header)
  tableHeaderAlt: '334155', // Slate 700 (Secondary Table Header)
  zebraEven: 'FFFFFF',      // Pure White
  zebraOdd: 'F8FAFC',       // Subtle Cool Slate
  border: 'CBD5E1',         // Slate 300
  borderLight: 'E2E8F0',    // Slate 200
  totalRowBg: 'E2E8F0',     // Slate 200 (Grand Total)
  
  // Status & Badges
  incomeBg: 'DCFCE7',       // Soft Emerald
  incomeText: '166534',     // Dark Emerald
  expenseBg: 'FEE2E2',      // Soft Rose
  expenseText: '991B1B',    // Dark Rose
  reallocBg: 'DBEAFE',      // Soft Blue
  reallocText: '1E40AF',    // Dark Blue
  pendingBg: 'FEF3C7',      // Soft Amber
  pendingText: '92400E',    // Dark Amber
  paidBg: 'DCFCE7',
  paidText: '166534',
  unpaidBg: 'FEE2E2',
  unpaidText: '991B1B'
};

const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: PALETTE.border } },
  bottom: { style: 'thin', color: { rgb: PALETTE.border } },
  left: { style: 'thin', color: { rgb: PALETTE.border } },
  right: { style: 'thin', color: { rgb: PALETTE.border } }
};

const BORDER_TOTAL = {
  top: { style: 'thin', color: { rgb: '0F172A' } },
  bottom: { style: 'double', color: { rgb: '0F172A' } },
  left: { style: 'thin', color: { rgb: PALETTE.border } },
  right: { style: 'thin', color: { rgb: PALETTE.border } }
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr?: string | any): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
}

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
 * Builds an official executive header banner block for worksheets
 */
function buildWorksheetHeader(
  title: string,
  subtitle: string,
  metaInfo: string,
  columnSpan: number
): { cells: any[][]; merges: any[]; rows: any[] } {
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnSpan - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columnSpan - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: columnSpan - 1 } }
  ];

  const rows = [
    { hpt: 32 }, // Row 0 Title
    { hpt: 22 }, // Row 1 Subtitle
    { hpt: 18 }, // Row 2 Meta
    { hpt: 12 }  // Row 3 Blank gap
  ];

  const titleCell = {
    v: title,
    t: 's',
    s: {
      fill: { fgColor: { rgb: PALETTE.headerBg } },
      font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  };

  const subtitleCell = {
    v: subtitle,
    t: 's',
    s: {
      fill: { fgColor: { rgb: PALETTE.headerSubBg } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'E2E8F0' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  };

  const metaCell = {
    v: metaInfo,
    t: 's',
    s: {
      fill: { fgColor: { rgb: PALETTE.headerMetaBg } },
      font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '475569' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  };

  const cells: any[][] = [
    [titleCell],
    [subtitleCell],
    [metaCell],
    [] // blank row
  ];

  return { cells, merges, rows };
}

// ==========================================
// 1. EXPORT TRANSACTIONS TO EXCEL (MODERN)
// ==========================================
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
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WITA';

  const totalIncome = summary?.totalIncome ?? transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = summary?.totalExpense ?? transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netBalance = summary?.netBalance ?? (totalIncome - totalExpense);

  const columnSpan = 10;
  const metaText = `Kota Palu, Sulawesi Tengah  |  Waktu Unduh: ${currentDate}, ${currentTime}  |  Periode: ${summary?.periodLabel || 'Semua Data'}`;
  
  // 1. Header Banner
  const { cells, merges, rows } = buildWorksheetHeader(
    'GEDUNG SERBAGUNA (GSG) HUNTAP TONDO 2',
    'BUKU KAS UMUM & LAPORAN MANAJEMEN ARUS KEUANGAN RESMI',
    metaText,
    columnSpan
  );

  // 2. Executive KPI Cards (Rows 4 to 7)
  const cardTitleStyle = (bg: string, fg: string) => ({
    fill: { fgColor: { rgb: bg } },
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: fg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: BORDER_THIN
  });

  const cardValueStyle = (bg: string, fg: string) => ({
    fill: { fgColor: { rgb: bg } },
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: fg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    numFmt: '"Rp "#,##0',
    border: BORDER_THIN
  });

  // Row 4: KPI Titles
  cells.push([
    { v: 'TOTAL PEMASUKAN', t: 's', s: cardTitleStyle('ECFDF5', '065F46') },
    null,
    { v: 'TOTAL PENGELUARAN', t: 's', s: cardTitleStyle('FFF1F2', '9F1239') },
    null,
    { v: 'SALDO BERSIH KAS', t: 's', s: cardTitleStyle('EFF6FF', '1E40AF') },
    null,
    { v: 'POS OPERASIONAL', t: 's', s: cardTitleStyle('F8FAFC', '334155') },
    null,
    { v: 'POS PENGEMBANGAN', t: 's', s: cardTitleStyle('F8FAFC', '334155') },
    null
  ]);

  // Row 5: KPI Values
  cells.push([
    { v: totalIncome, t: 'n', s: cardValueStyle('ECFDF5', '065F46') },
    null,
    { v: totalExpense, t: 'n', s: cardValueStyle('FFF1F2', '9F1239') },
    null,
    { v: netBalance, t: 'n', s: cardValueStyle('EFF6FF', '1E40AF') },
    null,
    { v: summary?.opsBalance ?? 0, t: 'n', s: cardValueStyle('F8FAFC', '334155') },
    null,
    { v: summary?.devBalance ?? 0, t: 'n', s: cardValueStyle('F8FAFC', '334155') },
    null
  ]);

  // Merges for KPI cards
  merges.push(
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
    { s: { r: 5, c: 2 }, e: { r: 5, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
    { s: { r: 5, c: 4 }, e: { r: 5, c: 5 } },
    { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
    { s: { r: 5, c: 6 }, e: { r: 5, c: 7 } },
    { s: { r: 4, c: 8 }, e: { r: 4, c: 9 } },
    { s: { r: 5, c: 8 }, e: { r: 5, c: 9 } }
  );

  rows.push({ hpt: 18 }, { hpt: 26 }, { hpt: 12 });
  cells.push([]); // blank separator

  // 3. Table Headers (Row 7)
  const headers = [
    'No',
    'Tanggal',
    'Tipe Transaksi',
    'Kategori',
    'Keterangan / Sumber',
    'Pos Alokasi Dana',
    'Pemasukan (Rp)',
    'Pengeluaran (Rp)',
    'Dicatat Oleh',
    'Status'
  ];

  const headerRowIdx = cells.length;
  rows.push({ hpt: 26 });

  const headerCells = headers.map((h, i) => ({
    v: h,
    t: 's',
    s: {
      fill: { fgColor: { rgb: PALETTE.tableHeaderBg } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { 
        horizontal: (i === 6 || i === 7) ? 'right' : (i <= 2 || i === 9) ? 'center' : 'left', 
        vertical: 'center' 
      },
      border: {
        top: { style: 'thin', color: { rgb: '0F172A' } },
        bottom: { style: 'medium', color: { rgb: '0F172A' } },
        left: { style: 'thin', color: { rgb: '1E3A8A' } },
        right: { style: 'thin', color: { rgb: '1E3A8A' } }
      }
    }
  }));
  cells.push(headerCells);

  // 4. Data Rows
  const dataStartRow = cells.length + 1; // 1-indexed for Excel formulas
  transactions.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const bg = isEven ? PALETTE.zebraEven : PALETTE.zebraOdd;
    const isIncome = item.type === 'income';
    const isExpense = item.type === 'expense';

    let alokasi = '-';
    if (isIncome) {
      alokasi = item.allocationMode === 'full_ops' 
        ? '100% Operasional' 
        : item.allocationMode === 'full_dev' 
          ? '100% Pengembangan' 
          : `Split (Ops: ${formatRupiah(item.ops || 0)} | Dev: ${formatRupiah(item.devFund || 0)})`;
    } else if (isExpense) {
      alokasi = item.expenseSource === 'dev' ? 'Kas Pengembangan' : 'Kas Operasional';
    } else {
      alokasi = 'Realokasi Antar Kas';
    }

    // Type Badge Style
    const typeBg = isIncome ? PALETTE.incomeBg : isExpense ? PALETTE.expenseBg : PALETTE.reallocBg;
    const typeFg = isIncome ? PALETTE.incomeText : isExpense ? PALETTE.expenseText : PALETTE.reallocText;

    const cellBase = (align: 'center' | 'left' | 'right', isBold = false) => ({
      fill: { fgColor: { rgb: bg } },
      font: { name: 'Calibri', sz: 9.5, bold: isBold, color: { rgb: '1E293B' } },
      alignment: { horizontal: align, vertical: 'center' },
      border: BORDER_THIN
    });

    const currencyCell = (val: number, isHighlighted: boolean, highlightColor: string) => ({
      v: val,
      t: 'n',
      s: {
        fill: { fgColor: { rgb: bg } },
        font: { 
          name: 'Calibri', 
          sz: 9.5, 
          bold: isHighlighted, 
          color: { rgb: isHighlighted ? highlightColor : '94A3B8' } 
        },
        alignment: { horizontal: 'right', vertical: 'center' },
        numFmt: '"Rp "#,##0;("Rp "#,##0);"-"',
        border: BORDER_THIN
      }
    });

    rows.push({ hpt: 20 });
    cells.push([
      { v: index + 1, t: 'n', s: cellBase('center') },
      { v: formatDate(item.date), t: 's', s: cellBase('center') },
      { 
        v: isIncome ? 'PEMASUKAN' : isExpense ? 'PENGELUARAN' : 'REALOKASI', 
        t: 's', 
        s: {
          fill: { fgColor: { rgb: typeBg } },
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: typeFg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: BORDER_THIN
        }
      },
      { v: (item.category || 'Umum').toUpperCase(), t: 's', s: cellBase('left') },
      { v: item.source || '-', t: 's', s: cellBase('left') },
      { v: alokasi, t: 's', s: cellBase('left') },
      currencyCell(isIncome ? (item.amount || 0) : 0, isIncome, PALETTE.incomeText),
      currencyCell(isExpense ? (item.amount || 0) : 0, isExpense, PALETTE.expenseText),
      { v: item.addedByName || item.addedBy || 'Administrator', t: 's', s: cellBase('left') },
      { 
        v: item.status === 'verified' ? 'TERVERIFIKASI' : 'VALID', 
        t: 's', 
        s: {
          fill: { fgColor: { rgb: bg } },
          font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: '059669' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: BORDER_THIN
        } 
      }
    ]);
  });

  const dataEndRow = cells.length; // 1-indexed

  // 5. Grand Total Row with Excel Double Bottom Border
  const totalRowIdx = cells.length;
  rows.push({ hpt: 24 });
  merges.push({ s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 5 } });

  const totalLabelCell = {
    v: 'TOTAL KESELURUHAN ARUS KAS',
    t: 's',
    s: {
      fill: { fgColor: { rgb: PALETTE.totalRowBg } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: BORDER_TOTAL
    }
  };

  const totalIncomeCell = {
    f: transactions.length > 0 ? `SUM(G${dataStartRow}:G${dataEndRow})` : undefined,
    v: totalIncome,
    t: 'n',
    s: {
      fill: { fgColor: { rgb: 'DCFCE7' } },
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '166534' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      numFmt: '"Rp "#,##0',
      border: BORDER_TOTAL
    }
  };

  const totalExpenseCell = {
    f: transactions.length > 0 ? `SUM(H${dataStartRow}:H${dataEndRow})` : undefined,
    v: totalExpense,
    t: 'n',
    s: {
      fill: { fgColor: { rgb: 'FEE2E2' } },
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '991B1B' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      numFmt: '"Rp "#,##0',
      border: BORDER_TOTAL
    }
  };

  const blankTotalCell = {
    v: '',
    t: 's',
    s: {
      fill: { fgColor: { rgb: PALETTE.totalRowBg } },
      border: BORDER_TOTAL
    }
  };

  cells.push([
    totalLabelCell,
    null, null, null, null, null,
    totalIncomeCell,
    totalExpenseCell,
    blankTotalCell,
    blankTotalCell
  ]);

  // 6. Formal Signatures / Pengesahan Block
  cells.push([]); // blank
  cells.push([]); // blank
  rows.push({ hpt: 15 }, { hpt: 15 });

  const sigDateRow = cells.length;
  const sigTitleRow = sigDateRow + 1;
  const sigSpace1 = sigDateRow + 2;
  const sigSpace2 = sigDateRow + 3;
  const sigNameRow = sigDateRow + 4;
  const sigRoleRow = sigDateRow + 5;

  merges.push(
    { s: { r: sigDateRow, c: 6 }, e: { r: sigDateRow, c: 9 } },
    { s: { r: sigTitleRow, c: 1 }, e: { r: sigTitleRow, c: 3 } },
    { s: { r: sigTitleRow, c: 6 }, e: { r: sigTitleRow, c: 9 } },
    { s: { r: sigNameRow, c: 1 }, e: { r: sigNameRow, c: 3 } },
    { s: { r: sigNameRow, c: 6 }, e: { r: sigNameRow, c: 9 } },
    { s: { r: sigRoleRow, c: 1 }, e: { r: sigRoleRow, c: 3 } },
    { s: { r: sigRoleRow, c: 6 }, e: { r: sigRoleRow, c: 9 } }
  );

  const sigTextStyle = (align: 'center' | 'left' | 'right', bold = false) => ({
    font: { name: 'Calibri', sz: 9.5, bold, color: { rgb: '0F172A' } },
    alignment: { horizontal: align, vertical: 'center' }
  });

  cells.push([
    null, null, null, null, null, null,
    { v: `Kota Palu, ${currentDate}`, t: 's', s: sigTextStyle('center') }
  ]);
  cells.push([
    null,
    { v: 'Dibuat Oleh:', t: 's', s: sigTextStyle('center') },
    null, null, null, null,
    { v: 'Mengetahui & Menyetujui:', t: 's', s: sigTextStyle('center') }
  ]);
  cells.push([]);
  cells.push([]);
  cells.push([
    null,
    { v: '( Administrasi Keuangan )', t: 's', s: sigTextStyle('center', true) },
    null, null, null, null,
    { v: '( Bendahara Pengurus GSG )', t: 's', s: sigTextStyle('center', true) }
  ]);
  cells.push([
    null,
    { v: 'Divisi Pembukuan', t: 's', s: sigTextStyle('center') },
    null, null, null, null,
    { v: 'Gedung Serbaguna Huntap Tondo 2', t: 's', s: sigTextStyle('center') }
  ]);

  rows.push({ hpt: 18 }, { hpt: 18 }, { hpt: 20 }, { hpt: 20 }, { hpt: 18 }, { hpt: 18 });

  // 7. Create Worksheet & Append
  const worksheet = XLSX.utils.aoa_to_sheet(cells);
  worksheet['!merges'] = merges;
  worksheet['!rows'] = rows;
  worksheet['!cols'] = [
    { wch: 6 },   // No
    { wch: 14 },  // Tanggal
    { wch: 16 },  // Tipe
    { wch: 18 },  // Kategori
    { wch: 34 },  // Keterangan
    { wch: 28 },  // Pos Alokasi
    { wch: 20 },  // Pemasukan
    { wch: 20 },  // Pengeluaran
    { wch: 24 },  // Dicatat Oleh
    { wch: 16 }   // Status
  ];

  // ==========================================
  // SHEET 2: RINGKASAN KATEGORI & PERSENTASE
  // ==========================================
  const catIncomeMap: Record<string, number> = {};
  const catExpenseMap: Record<string, number> = {};

  transactions.forEach(t => {
    const cat = (t.category || 'Umum').toUpperCase();
    if (t.type === 'income') {
      catIncomeMap[cat] = (catIncomeMap[cat] || 0) + (t.amount || 0);
    } else if (t.type === 'expense') {
      catExpenseMap[cat] = (catExpenseMap[cat] || 0) + (t.amount || 0);
    }
  });

  const sheet2Banner = buildWorksheetHeader(
    'GEDUNG SERBAGUNA (GSG) HUNTAP TONDO 2',
    'ANALISIS DISTRIBUSI POS KATEGORI PEMASUKAN & PENGELUARAN',
    metaText,
    6
  );

  const sheet2Cells: any[][] = sheet2Banner.cells;
  const sheet2Merges: any[] = sheet2Banner.merges;
  const sheet2Rows: any[] = sheet2Banner.rows;

  // Category Table Header
  sheet2Rows.push({ hpt: 24 });
  sheet2Cells.push([
    { v: 'No', t: 's', s: { fill: { fgColor: { rgb: PALETTE.tableHeaderBg } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center' } } },
    { v: 'Kategori Transaksi', t: 's', s: { fill: { fgColor: { rgb: PALETTE.tableHeaderBg } }, font: { bold: true, color: { rgb: 'FFFFFF' } } } },
    { v: 'Tipe Aliran Kas', t: 's', s: { fill: { fgColor: { rgb: PALETTE.tableHeaderBg } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center' } } },
    { v: 'Total Akumulasi (Rp)', t: 's', s: { fill: { fgColor: { rgb: PALETTE.tableHeaderBg } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'right' } } },
    { v: 'Porsi Persentase', t: 's', s: { fill: { fgColor: { rgb: PALETTE.tableHeaderBg } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'right' } } },
    { v: 'Status Pos', t: 's', s: { fill: { fgColor: { rgb: PALETTE.tableHeaderBg } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center' } } }
  ]);

  let catIdx = 1;
  Object.entries(catIncomeMap).forEach(([cat, val]) => {
    const pct = totalIncome > 0 ? (val / totalIncome) : 0;
    sheet2Rows.push({ hpt: 20 });
    sheet2Cells.push([
      { v: catIdx++, t: 'n', s: { alignment: { horizontal: 'center' }, border: BORDER_THIN } },
      { v: cat, t: 's', s: { font: { bold: true }, border: BORDER_THIN } },
      { v: 'PEMASUKAN', t: 's', s: { fill: { fgColor: { rgb: PALETTE.incomeBg } }, font: { bold: true, color: { rgb: PALETTE.incomeText } }, alignment: { horizontal: 'center' }, border: BORDER_THIN } },
      { v: val, t: 'n', s: { numFmt: '"Rp "#,##0', font: { bold: true }, alignment: { horizontal: 'right' }, border: BORDER_THIN } },
      { v: pct, t: 'n', s: { numFmt: '0.0%', alignment: { horizontal: 'right' }, border: BORDER_THIN } },
      { v: 'ARUS MASUK', t: 's', s: { alignment: { horizontal: 'center' }, border: BORDER_THIN } }
    ]);
  });

  Object.entries(catExpenseMap).forEach(([cat, val]) => {
    const pct = totalExpense > 0 ? (val / totalExpense) : 0;
    sheet2Rows.push({ hpt: 20 });
    sheet2Cells.push([
      { v: catIdx++, t: 'n', s: { alignment: { horizontal: 'center' }, border: BORDER_THIN } },
      { v: cat, t: 's', s: { font: { bold: true }, border: BORDER_THIN } },
      { v: 'PENGELUARAN', t: 's', s: { fill: { fgColor: { rgb: PALETTE.expenseBg } }, font: { bold: true, color: { rgb: PALETTE.expenseText } }, alignment: { horizontal: 'center' }, border: BORDER_THIN } },
      { v: val, t: 'n', s: { numFmt: '"Rp "#,##0', font: { bold: true }, alignment: { horizontal: 'right' }, border: BORDER_THIN } },
      { v: pct, t: 'n', s: { numFmt: '0.0%', alignment: { horizontal: 'right' }, border: BORDER_THIN } },
      { v: 'ARUS KELUAR', t: 's', s: { alignment: { horizontal: 'center' }, border: BORDER_THIN } }
    ]);
  });

  const worksheet2 = XLSX.utils.aoa_to_sheet(sheet2Cells);
  worksheet2['!merges'] = sheet2Merges;
  worksheet2['!rows'] = sheet2Rows;
  worksheet2['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 16 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Kas Utama');
  XLSX.utils.book_append_sheet(workbook, worksheet2, 'Analisis Kategori');

  const fileName = `Laporan_Kas_GSG_Tondo2_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

// ==========================================
// 2. EXPORT BOOKINGS TO EXCEL (MODERN)
// ==========================================
export function exportBookingsToExcel(bookings: Booking[], filterStatus = 'Semua') {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WITA';

  const total = bookings.length;
  const approved = bookings.filter(b => b.status === 'approved').length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const rejected = bookings.filter(b => b.status === 'rejected').length;
  const totalRevenue = bookings
    .filter(b => b.status !== 'rejected')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const columnSpan = 12;
  const metaText = `Kota Palu, Sulawesi Tengah  |  Waktu Unduh: ${currentDate}, ${currentTime}  |  Filter: ${filterStatus}`;

  const { cells, merges, rows } = buildWorksheetHeader(
    'GEDUNG SERBAGUNA (GSG) HUNTAP TONDO 2',
    'REKAPITULASI DATA PERMOHONAN RESERVASI & JADWAL SEWA GEDUNG',
    metaText,
    columnSpan
  );

  // KPI Metrics Block
  const cardTitleStyle = (bg: string, fg: string) => ({
    fill: { fgColor: { rgb: bg } },
    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: fg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: BORDER_THIN
  });

  const cardValueStyle = (bg: string, fg: string, isCurrency = false) => ({
    fill: { fgColor: { rgb: bg } },
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: fg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    numFmt: isCurrency ? '"Rp "#,##0' : undefined,
    border: BORDER_THIN
  });

  cells.push([
    { v: 'TOTAL PERMOHONAN', t: 's', s: cardTitleStyle('F1F5F9', '0F172A') }, null,
    { v: 'DISETUJUI (APPROVED)', t: 's', s: cardTitleStyle('ECFDF5', '065F46') }, null,
    { v: 'MENUNGGU (PENDING)', t: 's', s: cardTitleStyle('FEF3C7', '92400E') }, null,
    { v: 'SELESAI TERLAKSANA', t: 's', s: cardTitleStyle('EFF6FF', '1E40AF') }, null,
    { v: 'DITOLAK (REJECTED)', t: 's', s: cardTitleStyle('FFF1F2', '9F1239') }, null,
    { v: 'ESTIMASI NILAI SEWA', t: 's', s: cardTitleStyle('F0FDF4', '15803D') }, null
  ]);

  cells.push([
    { v: total, t: 'n', s: cardValueStyle('F1F5F9', '0F172A') }, null,
    { v: approved, t: 'n', s: cardValueStyle('ECFDF5', '065F46') }, null,
    { v: pending, t: 'n', s: cardValueStyle('FEF3C7', '92400E') }, null,
    { v: completed, t: 'n', s: cardValueStyle('EFF6FF', '1E40AF') }, null,
    { v: rejected, t: 'n', s: cardValueStyle('FFF1F2', '9F1239') }, null,
    { v: totalRevenue, t: 'n', s: cardValueStyle('F0FDF4', '15803D', true) }, null
  ]);

  merges.push(
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
    { s: { r: 5, c: 2 }, e: { r: 5, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
    { s: { r: 5, c: 4 }, e: { r: 5, c: 5 } },
    { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
    { s: { r: 5, c: 6 }, e: { r: 5, c: 7 } },
    { s: { r: 4, c: 8 }, e: { r: 4, c: 9 } },
    { s: { r: 5, c: 8 }, e: { r: 5, c: 9 } },
    { s: { r: 4, c: 10 }, e: { r: 4, c: 11 } },
    { s: { r: 5, c: 10 }, e: { r: 5, c: 11 } }
  );

  rows.push({ hpt: 18 }, { hpt: 26 }, { hpt: 12 });
  cells.push([]);

  // Table Headers
  const tableHeaders = [
    'No',
    'ID Booking',
    'Nama Pemohon',
    'WhatsApp / HP',
    'Tgl Mulai',
    'Tgl Selesai',
    'Paket Layanan',
    'Keperluan Acara',
    'Biaya Sewa (Rp)',
    'Status Approval',
    'Status Bayar',
    'Fasilitas Tambahan'
  ];

  rows.push({ hpt: 26 });
  cells.push(tableHeaders.map((h, i) => ({
    v: h,
    t: 's',
    s: {
      fill: { fgColor: { rgb: PALETTE.tableHeaderBg } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { 
        horizontal: (i === 8) ? 'right' : (i <= 1 || i === 4 || i === 5 || i === 9 || i === 10) ? 'center' : 'left', 
        vertical: 'center' 
      },
      border: {
        top: { style: 'thin', color: { rgb: '0F172A' } },
        bottom: { style: 'medium', color: { rgb: '0F172A' } },
        left: { style: 'thin', color: { rgb: '1E3A8A' } },
        right: { style: 'thin', color: { rgb: '1E3A8A' } }
      }
    }
  })));

  const dataStartRow = cells.length + 1;

  // Data rows
  bookings.forEach((b, index) => {
    const isEven = index % 2 === 0;
    const bg = isEven ? PALETTE.zebraEven : PALETTE.zebraOdd;

    let statusText = 'MENUNGGU';
    let statusBg = PALETTE.pendingBg;
    let statusFg = PALETTE.pendingText;

    if (b.status === 'approved') {
      statusText = 'DISETUJUI';
      statusBg = PALETTE.incomeBg;
      statusFg = PALETTE.incomeText;
    } else if (b.status === 'completed') {
      statusText = 'SELESAI';
      statusBg = PALETTE.reallocBg;
      statusFg = PALETTE.reallocText;
    } else if (b.status === 'rejected') {
      statusText = 'DITOLAK';
      statusBg = PALETTE.expenseBg;
      statusFg = PALETTE.expenseText;
    }

    const isPaid = b.paymentStatus === 'paid';
    const payText = isPaid ? 'LUNAS' : 'BELUM BAYAR';
    const payBg = isPaid ? PALETTE.paidBg : PALETTE.unpaidBg;
    const payFg = isPaid ? PALETTE.paidText : PALETTE.unpaidText;

    const addons = (b as any).selectedAddons 
      ? Object.entries((b as any).selectedAddons)
          .filter(([_, qty]) => Number(qty) > 0)
          .map(([key, qty]) => `${key}: ${qty}`)
          .join(', ')
      : '-';

    const cellBase = (align: 'center' | 'left' | 'right', isBold = false) => ({
      fill: { fgColor: { rgb: bg } },
      font: { name: 'Calibri', sz: 9.5, bold: isBold, color: { rgb: '1E293B' } },
      alignment: { horizontal: align, vertical: 'center' },
      border: BORDER_THIN
    });

    rows.push({ hpt: 20 });
    cells.push([
      { v: index + 1, t: 'n', s: cellBase('center') },
      { v: b.id ? `#${b.id.substring(0, 8).toUpperCase()}` : '-', t: 's', s: { ...cellBase('center', true), font: { name: 'Consolas', sz: 9, bold: true, color: { rgb: '334155' } } } },
      { v: b.customerName || '-', t: 's', s: cellBase('left', true) },
      { v: b.phone || '-', t: 's', s: cellBase('center') },
      { v: formatDate(b.startDate), t: 's', s: cellBase('center') },
      { v: b.endDate ? formatDate(b.endDate) : formatDate(b.startDate), t: 's', s: cellBase('center') },
      { v: (b as any).packageTitle || (b as any).packageName || 'Paket Standar', t: 's', s: cellBase('left') },
      { v: b.purpose || '-', t: 's', s: cellBase('left') },
      { v: b.amount || 0, t: 'n', s: { fill: { fgColor: { rgb: bg } }, font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '0F172A' } }, alignment: { horizontal: 'right', vertical: 'center' }, numFmt: '"Rp "#,##0', border: BORDER_THIN } },
      { v: statusText, t: 's', s: { fill: { fgColor: { rgb: statusBg } }, font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: statusFg } }, alignment: { horizontal: 'center', vertical: 'center' }, border: BORDER_THIN } },
      { v: payText, t: 's', s: { fill: { fgColor: { rgb: payBg } }, font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: payFg } }, alignment: { horizontal: 'center', vertical: 'center' }, border: BORDER_THIN } },
      { v: addons, t: 's', s: cellBase('left') }
    ]);
  });

  const dataEndRow = cells.length;

  // Grand Total Row
  const totalRowIdx = cells.length;
  rows.push({ hpt: 24 });
  merges.push({ s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 7 } });

  cells.push([
    { v: 'TOTAL ESTIMASI NILAI SEWA RESERVASI', t: 's', s: { fill: { fgColor: { rgb: PALETTE.totalRowBg } }, font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: BORDER_TOTAL } },
    null, null, null, null, null, null, null,
    { 
      f: bookings.length > 0 ? `SUM(I${dataStartRow}:I${dataEndRow})` : undefined, 
      v: totalRevenue, 
      t: 'n', 
      s: { fill: { fgColor: { rgb: 'DCFCE7' } }, font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '166534' } }, alignment: { horizontal: 'right', vertical: 'center' }, numFmt: '"Rp "#,##0', border: BORDER_TOTAL } 
    },
    { v: '', t: 's', s: { fill: { fgColor: { rgb: PALETTE.totalRowBg } }, border: BORDER_TOTAL } },
    { v: '', t: 's', s: { fill: { fgColor: { rgb: PALETTE.totalRowBg } }, border: BORDER_TOTAL } },
    { v: '', t: 's', s: { fill: { fgColor: { rgb: PALETTE.totalRowBg } }, border: BORDER_TOTAL } }
  ]);

  // Signatures
  cells.push([]); cells.push([]);
  rows.push({ hpt: 15 }, { hpt: 15 });

  const sigDateRow = cells.length;
  merges.push(
    { s: { r: sigDateRow, c: 8 }, e: { r: sigDateRow, c: 11 } },
    { s: { r: sigDateRow + 1, c: 1 }, e: { r: sigDateRow + 1, c: 3 } },
    { s: { r: sigDateRow + 1, c: 8 }, e: { r: sigDateRow + 1, c: 11 } },
    { s: { r: sigDateRow + 4, c: 1 }, e: { r: sigDateRow + 4, c: 3 } },
    { s: { r: sigDateRow + 4, c: 8 }, e: { r: sigDateRow + 4, c: 11 } }
  );

  const sigTextStyle = (align: 'center' | 'left' | 'right', bold = false) => ({
    font: { name: 'Calibri', sz: 9.5, bold, color: { rgb: '0F172A' } },
    alignment: { horizontal: align, vertical: 'center' }
  });

  cells.push([
    null, null, null, null, null, null, null, null,
    { v: `Kota Palu, ${currentDate}`, t: 's', s: sigTextStyle('center') }
  ]);
  cells.push([
    null,
    { v: 'Diverifikasi Oleh:', t: 's', s: sigTextStyle('center') },
    null, null, null, null, null, null,
    { v: 'Mengetahui & Menyetujui:', t: 's', s: sigTextStyle('center') }
  ]);
  cells.push([]);
  cells.push([]);
  cells.push([
    null,
    { v: '( Administrator Jadwal & Booking )', t: 's', s: sigTextStyle('center', true) },
    null, null, null, null, null, null,
    { v: '( Ketua Pengurus GSG Huntap Tondo 2 )', t: 's', s: sigTextStyle('center', true) }
  ]);

  rows.push({ hpt: 18 }, { hpt: 18 }, { hpt: 20 }, { hpt: 20 }, { hpt: 18 });

  const worksheet = XLSX.utils.aoa_to_sheet(cells);
  worksheet['!merges'] = merges;
  worksheet['!rows'] = rows;
  worksheet['!cols'] = [
    { wch: 6 },   // No
    { wch: 13 },  // ID
    { wch: 24 },  // Nama
    { wch: 16 },  // WhatsApp
    { wch: 14 },  // Mulai
    { wch: 14 },  // Selesai
    { wch: 20 },  // Paket
    { wch: 30 },  // Keperluan
    { wch: 18 },  // Biaya
    { wch: 18 },  // Status
    { wch: 16 },  // Bayar
    { wch: 28 }   // Tambahan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Booking GSG');

  const fileName = `Rekap_Booking_GSG_Tondo2_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

// ==========================================
// 3. EXPORT AUDIT LOGS TO EXCEL (MODERN)
// ==========================================
export function exportAuditLogsToExcel(logs: any[]) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WITA';

  const columnSpan = 8;
  const metaText = `Kota Palu, Sulawesi Tengah  |  Waktu Unduh: ${currentDate}, ${currentTime}  |  Total Rekaman: ${logs.length} Aktivitas`;

  const { cells, merges, rows } = buildWorksheetHeader(
    'GEDUNG SERBAGUNA (GSG) HUNTAP TONDO 2',
    'REKAM JEJAK AKTIVITAS ADMINISTRATOR & AUDIT TRAIL SISTEM (IMMUTABLE)',
    metaText,
    columnSpan
  );

  // Table Headers
  const tableHeaders = [
    'No',
    'Waktu Kejadian (WITA)',
    'Aksi / Modul',
    'Keterangan Detail Aktivitas',
    'Nama Pelaksana',
    'Email Petugas',
    'Hak Akses / Peran',
    'Target ID Referensi'
  ];

  rows.push({ hpt: 26 });
  cells.push(tableHeaders.map((h, i) => ({
    v: h,
    t: 's',
    s: {
      fill: { fgColor: { rgb: PALETTE.tableHeaderBg } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { 
        horizontal: (i <= 2 || i === 6) ? 'center' : 'left', 
        vertical: 'center' 
      },
      border: {
        top: { style: 'thin', color: { rgb: '0F172A' } },
        bottom: { style: 'medium', color: { rgb: '0F172A' } },
        left: { style: 'thin', color: { rgb: '1E3A8A' } },
        right: { style: 'thin', color: { rgb: '1E3A8A' } }
      }
    }
  })));

  // Data rows
  logs.forEach((log, index) => {
    const isEven = index % 2 === 0;
    const bg = isEven ? PALETTE.zebraEven : PALETTE.zebraOdd;
    const act = (log.action || '').toUpperCase();

    let actBg = PALETTE.zebraEven;
    let actFg = '334155';
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('REJECT')) {
      actBg = PALETTE.expenseBg;
      actFg = PALETTE.expenseText;
    } else if (act.includes('APPROVE') || act.includes('VERIF')) {
      actBg = PALETTE.incomeBg;
      actFg = PALETTE.incomeText;
    } else if (act.includes('ADD') || act.includes('CREATE')) {
      actBg = PALETTE.reallocBg;
      actFg = PALETTE.reallocText;
    } else {
      actBg = PALETTE.pendingBg;
      actFg = PALETTE.pendingText;
    }

    const cellBase = (align: 'center' | 'left' | 'right', isBold = false) => ({
      fill: { fgColor: { rgb: bg } },
      font: { name: 'Calibri', sz: 9.5, bold: isBold, color: { rgb: '1E293B' } },
      alignment: { horizontal: align, vertical: 'center' },
      border: BORDER_THIN
    });

    rows.push({ hpt: 20 });
    cells.push([
      { v: index + 1, t: 'n', s: cellBase('center') },
      { v: formatDateTime(log.createdAt), t: 's', s: cellBase('center') },
      { v: act, t: 's', s: { fill: { fgColor: { rgb: actBg } }, font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: actFg } }, alignment: { horizontal: 'center', vertical: 'center' }, border: BORDER_THIN } },
      { v: log.description || '-', t: 's', s: cellBase('left', true) },
      { v: log.actorName || 'Admin', t: 's', s: cellBase('left') },
      { v: log.actorEmail || '-', t: 's', s: { ...cellBase('left'), font: { name: 'Consolas', sz: 9, color: { rgb: '475569' } } } },
      { v: (log.actorRole || 'admin').toUpperCase(), t: 's', s: cellBase('center') },
      { v: log.targetId || '-', t: 's', s: { ...cellBase('left'), font: { name: 'Consolas', sz: 8.5, color: { rgb: '64748B' } } } }
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(cells);
  worksheet['!merges'] = merges;
  worksheet['!rows'] = rows;
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 22 },
    { wch: 42 },
    { wch: 24 },
    { wch: 28 },
    { wch: 18 },
    { wch: 22 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail GSG');

  const fileName = `Audit_Log_GSG_Tondo2_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
