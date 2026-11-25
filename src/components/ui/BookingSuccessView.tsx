import React from 'react';
import {
  CheckCircle2,
  Ticket,
  Check,
  Copy,
  Download,
  Calendar as CalendarIcon,
  Search,
  Send,
} from 'lucide-react';

interface BookingSuccessViewProps {
  bookingRefCode: string;
  copiedCode: boolean;
  onCopyBookingCode: () => void;
  isGeneratingPdf: boolean;
  onDownloadETicket: () => void;
  googleCalendarUrl: string;
  onGoToTracker: () => void;
  waMessage: string;
  copiedMsg: boolean;
  onCopyWAMessage: () => void;
  waLink: string;
  onResetAndClose: () => void;
}

export default function BookingSuccessView({
  bookingRefCode,
  copiedCode,
  onCopyBookingCode,
  isGeneratingPdf,
  onDownloadETicket,
  googleCalendarUrl,
  onGoToTracker,
  waMessage,
  copiedMsg,
  onCopyWAMessage,
  waLink,
  onResetAndClose,
}: BookingSuccessViewProps) {
  return (
    <div className="p-5 sm:p-8 text-center flex-1 flex flex-col justify-between overflow-y-auto max-h-[90dvh] bg-[#FCFCFD]">
      <div>
        <div className="w-14 h-14 bg-[#F0FDF4] text-[#16A34A] rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#BBF7D0]">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#111827] mb-2">Permohonan Berhasil Dikirim</h3>

        {/* Kode Referensi Booking Badge */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-2 rounded-xl mb-5">
          <Ticket className="w-4 h-4 text-[#1E40AF]" />
          <span className="text-xs font-medium text-[#4B5563]">Kode Pengajuan:</span>
          <span className="text-sm font-mono tabular-nums font-semibold text-[#1E40AF] tracking-wider">#{bookingRefCode}</span>
          <button
            type="button"
            onClick={onCopyBookingCode}
            className="ml-1 min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 rounded-md bg-white hover:bg-[#DBEAFE] text-[#1E40AF] transition-colors border border-[#BFDBFE] cursor-pointer"
            title="Salin Kode Booking"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Actions: E-Ticket PDF, Google Calendar, Lacak Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5 text-left">
          <button
            type="button"
            onClick={onDownloadETicket}
            disabled={isGeneratingPdf}
            className="min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#1E40AF] hover:bg-[#1D3A8A] text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh E-Ticket PDF'}</span>
          </button>
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#F8F9FA] hover:bg-[#F1F3F5] text-[#111827] border border-[#D1D5DB] font-medium text-xs transition-colors cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4 shrink-0 text-[#1E40AF]" />
            <span>Simpan Kalender</span>
          </a>
          <button
            type="button"
            onClick={onGoToTracker}
            className="min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-medium text-xs transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Lacak Boarding Pass</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto mb-5 leading-relaxed">
          Data Anda telah tercatat di sistem kami.{' '}
          <strong className="text-[#111827]">Sangat direkomendasikan:</strong> Kirim salinan rincian pengajuan ini langsung ke WhatsApp Admin agar diverifikasi lebih cepat.
        </p>

        {/* Copyable Template Box */}
        <div className="text-left bg-[#F0FDF4] rounded-xl p-4 sm:p-5 border border-[#BBF7D0] relative group mb-6">
          <button
            onClick={onCopyWAMessage}
            type="button"
            className="absolute top-3 right-3 min-h-[36px] bg-white hover:bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
            title="Salin Template"
          >
            {copiedMsg ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#15803D]" />
                <span className="text-[#15803D]">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Salin</span>
              </>
            )}
          </button>
          <span className="text-xs font-semibold text-[#15803D] block mb-2">
            Template pesan konfirmasi WhatsApp
          </span>
          <pre className="text-xs text-[#1E293B] font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto scrollbar-none select-all pr-2">
            {waMessage}
          </pre>
        </div>
      </div>

      {/* Direct Action Buttons */}
      <div className="space-y-2.5 pt-4 border-t border-[#E5E7EB]">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[44px] py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Kirim Konfirmasi ke WhatsApp Admin
        </a>

        <button
          onClick={onResetAndClose}
          type="button"
          className="w-full min-h-[44px] py-3 bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#111827] font-medium text-xs rounded-lg transition-colors cursor-pointer"
        >
          Tutup & Selesai
        </button>
      </div>
    </div>
  );
}
