import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Printer, 
  ExternalLink, 
  FileText, 
  Loader2, 
  ZoomIn, 
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface PdfDocResult {
  doc: jsPDF;
  filename: string;
}

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  loadPdf: () => Promise<PdfDocResult>;
}

export default function PdfPreviewModal({
  isOpen,
  onClose,
  title,
  loadPdf
}: PdfPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<PdfDocResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (isOpen) {
      setLoading(true);
      setError(null);

      loadPdf()
        .then((result) => {
          if (!active) return;
          setPdfData(result);
          const blob = result.doc.output('blob');
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
          setLoading(false);
        })
        .catch((err) => {
          if (!active) return;
          console.error('Gagal merender pratinjau PDF:', err);
          setError('Terjadi kendala saat menyusun pratinjau dokumen. Anda tetap dapat mengunduh dokumen secara langsung.');
          setLoading(false);
        });
    } else {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      setBlobUrl(null);
      setPdfData(null);
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen]);

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch (e) {
        console.warn('Direct iframe print failed, trying window open print', e);
      }
    }
    if (blobUrl) {
      const printWindow = window.open(blobUrl);
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    if (pdfData) {
      pdfData.doc.save(pdfData.filename);
    }
  };

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 z-10"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 bg-white shrink-0 gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-gray-900 text-sm sm:text-base leading-tight truncate">
                  {title}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">
                  {pdfData?.filename || 'Menyusun dokumen digital resmi...'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                disabled={loading || !blobUrl}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors border border-gray-200/80 disabled:opacity-40"
                title="Cetak Langsung (Print)"
              >
                <Printer className="w-4 h-4 text-gray-600" />
                <span>Cetak</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewTab}
                disabled={loading || !blobUrl}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors border border-gray-200/80 disabled:opacity-40"
                title="Buka Dokumen di Tab Baru"
              >
                <ExternalLink className="w-4 h-4 text-gray-600" />
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={loading || !pdfData}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-black text-xs shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-40"
                title="Unduh File PDF"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Unduh PDF</span>
                <span className="sm:hidden text-[11px]">Unduh</span>
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Tutup Pratinjau (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document Content View Area */}
          <div className="relative flex-1 bg-slate-100 overflow-hidden flex items-center justify-center p-2 sm:p-4">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <p className="text-sm font-black text-gray-800">Menyusun Pratinjau PDF...</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  Menyematkan stempel digital, tanda tangan pengurus, dan kode verifikasi keaslian resmi.
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center gap-3 text-center p-8 bg-white rounded-3xl shadow-sm max-w-md">
                <p className="text-sm font-bold text-red-600">{error}</p>
                {pdfData && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Unduh File PDF
                  </button>
                )}
              </div>
            )}

            {!loading && blobUrl && !error && (
              <iframe
                ref={iframeRef}
                src={`${blobUrl}#view=FitH`}
                className="w-full h-full rounded-2xl bg-white shadow-md border border-gray-200"
                title="Pratinjau Dokumen PDF"
              />
            )}
          </div>

          {/* Footer Bar on Mobile */}
          <div className="sm:hidden px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span className="truncate max-w-[200px]">{pdfData?.filename || 'Dokumen PDF'}</span>
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !blobUrl}
              className="text-primary font-bold inline-flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
