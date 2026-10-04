import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

interface ExportButtonProps {
  type: 'csv' | 'pdf' | 'excel';
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export default function ExportButton({ type, onClick, className = '', disabled = false }: ExportButtonProps) {
  if (type === 'excel') {
    return (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 hover:border-emerald-300 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 ${className}`}
        id="btn-export-excel"
        title="Unduh Rekap Buku Kas dalam format Microsoft Excel (.xlsx)"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        Ekspor Excel (.xlsx)
      </button>
    );
  }

  if (type === 'csv') {
    return (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-3 rounded-2xl bg-white border border-gray-200/80 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95 ${className}`}
        id="btn-export-csv"
        title="Unduh File CSV Standar"
      >
        <Download className="w-4 h-4 text-primary" />
        Ekspor CSV
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-6 py-4 rounded-3xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-50 ${className}`}
      id="btn-export-pdf"
      title="Pratinjau, Cetak Langsung, atau Unduh Laporan PDF"
    >
      <FileText className="w-4 h-4 text-blue-400" />
      Cetak / Unduh PDF
    </button>
  );
}
