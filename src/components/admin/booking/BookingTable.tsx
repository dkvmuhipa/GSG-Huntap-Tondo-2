import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageCircle, 
  FileText, 
  Receipt, 
  Trash2, 
  LayoutGrid, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye 
} from 'lucide-react';
import { formatWhatsAppPhoneNumber } from '../../../lib/whatsapp';

interface BookingTableProps {
  filteredBookings: any[];
  handlePaymentStatusChange: (id: string, newStatus: string) => void;
  setSelectedBookingForLayoutReview: (booking: any) => void;
  generateContract: (booking: any) => void;
  generateReceipt: (booking: any) => void;
  onPreviewContract?: (booking: any) => void;
  onPreviewReceipt?: (booking: any) => void;
  handleDelete: (id: string) => void;
  handleStatusChange: (id: string, newStatus: string) => void;
  onOpenWhatsApp?: (booking: any) => void;
}

export default function BookingTable({
  filteredBookings,
  handlePaymentStatusChange,
  setSelectedBookingForLayoutReview,
  generateContract,
  generateReceipt,
  onPreviewContract,
  onPreviewReceipt,
  handleDelete,
  handleStatusChange,
  onOpenWhatsApp,
}: BookingTableProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 bg-[#F0FDF4] text-[#15803D] px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#BBF7D0]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 bg-[#FEF2F2] text-[#B91C1C] px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#FECACA]">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 bg-[#EFF6FF] text-[#1E40AF] px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#BFDBFE]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-[#FFFBEB] text-[#B45309] px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#FDE68A]">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <>
      {/* Desktop View Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E4E4E7]">
              <th className="px-6 py-3.5 text-[11px] font-semibold text-[#737373] text-center w-16">No</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-[#737373]">Penyewa & WhatsApp</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-[#737373]">Waktu & Acara</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-[#737373] text-center">Status</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-[#737373] text-center">Keuangan</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold text-[#737373] text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-[#737373] text-sm font-medium">
                  Data pemesanan tidak ditemukan.
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking, idx) => (
                <tr 
                  key={booking.id} 
                  className="hover:bg-[#FAFAFA] transition-colors group"
                >
                  <td className="px-6 py-5 text-center font-mono tabular-nums font-medium text-[#737373] text-xs">{idx + 1}</td>
                  <td className="px-6 py-5">
                    <p className="font-semibold text-[#171717] leading-tight">{booking.customerName}</p>
                    <button 
                      type="button"
                      onClick={() => onOpenWhatsApp ? onOpenWhatsApp(booking) : window.open(`https://wa.me/62${booking.phone.startsWith('0') ? booking.phone.slice(1) : booking.phone}`, '_blank')}
                      className="text-[11px] font-mono tabular-nums font-medium text-[#15803D] bg-[#F0FDF4] hover:bg-[#DCFCE7] transition-colors px-2 py-0.5 rounded-md mt-1.5 inline-flex items-center gap-1 border border-[#BBF7D0]"
                      title="Kirim Pesan WhatsApp Cepat"
                    >
                      <MessageCircle className="w-3 h-3" /> {booking.phone}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-semibold text-[#171717] leading-tight">{booking.purpose}</p>
                    <p className="text-[11px] font-mono tabular-nums text-[#737373] mt-1.5">
                      {new Date(booking.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-xs font-mono tabular-nums font-semibold text-[#171717]">
                        Rp {Number(booking.amount || 0).toLocaleString('id-ID')}
                      </span>
                      <button 
                        onClick={() => handlePaymentStatusChange(booking.id, booking.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                          booking.paymentStatus === 'paid' 
                            ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] hover:bg-[#DCFCE7]' 
                            : booking.paymentStatus === 'verifying'
                              ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE] hover:bg-[#DBEAFE]'
                              : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] hover:bg-[#FEF3C7]'
                        }`}
                        title={booking.paymentStatus === 'verifying' ? 'Klik untuk verifikasi & tandai lunas' : undefined}
                      >
                        {booking.paymentStatus === 'paid' 
                          ? 'Lunas (Sinkron)' 
                          : booking.paymentStatus === 'verifying' 
                            ? 'Verifikasi Bukti' 
                            : 'Tagih Pembayaran'}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-1.5">
                      {booking.paymentProofUrl && (
                        <a 
                          href={booking.paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-[#EFF6FF] text-[#1E40AF] rounded-lg border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors"
                          title="Lihat Struk/Bukti Transfer Pembayaran Warga"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <button 
                        onClick={() => onOpenWhatsApp ? onOpenWhatsApp(booking) : window.open(`https://wa.me/${formatWhatsAppPhoneNumber(booking.phone)}`, '_blank', 'noopener,noreferrer')} 
                        className="p-2.5 bg-[#F0FDF4] text-[#15803D] rounded-lg border border-[#BBF7D0] hover:bg-[#DCFCE7] transition-colors" 
                        title="Pesan Cepat WhatsApp (Template Siap Kirim)"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedBookingForLayoutReview(booking)} 
                        className="p-2.5 bg-[#F4F4F5] text-[#171717] rounded-lg border border-[#E4E4E7] hover:bg-[#E4E4E7] transition-colors" 
                        title="Tinjau Denah Gedung"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onPreviewContract ? onPreviewContract(booking) : generateContract(booking)} 
                        className="p-2.5 bg-[#EFF6FF] text-[#1E40AF] rounded-lg border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors" 
                        title="Pratinjau & Cetak Perjanjian Sewa"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onPreviewReceipt ? onPreviewReceipt(booking) : generateReceipt(booking)} 
                        className="p-2.5 bg-[#F0FDF4] text-[#15803D] rounded-lg border border-[#BBF7D0] hover:bg-[#DCFCE7] transition-colors" 
                        title="Pratinjau & Cetak Kuitansi Pembayaran"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(booking.id, 'approved')} 
                            className="px-3 py-2 bg-[#16A34A] text-white rounded-lg text-xs font-medium hover:bg-[#15803D] transition-colors"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => handleStatusChange(booking.id, 'rejected')} 
                            className="px-3 py-2 bg-[#DC2626] text-white rounded-lg text-xs font-medium hover:bg-[#B91C1C] transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDelete(booking.id)} 
                        className="p-2.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2] rounded-lg transition-colors" 
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View Cards */}
      <div className="lg:hidden grid gap-4 p-4">
        {filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-[#737373] text-sm font-medium">
            Data pemesanan tidak ditemukan.
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <motion.div 
              key={booking.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4 shadow-xs"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h4 className="font-semibold text-[#171717] text-base">{booking.customerName}</h4>
                  <p className="text-xs font-mono tabular-nums font-medium text-[#1E40AF] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-md inline-block mt-1">
                    {new Date(booking.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#737373]" />
                  <p className="text-sm font-medium text-[#525252]">{booking.purpose}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#737373]" />
                    <p className="text-sm font-mono tabular-nums font-semibold text-[#171717]">Rp {Number(booking.amount || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <button 
                    onClick={() => handlePaymentStatusChange(booking.id, booking.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                      booking.paymentStatus === 'paid' 
                        ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] hover:bg-[#DCFCE7]' 
                        : booking.paymentStatus === 'verifying'
                          ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE] hover:bg-[#DBEAFE]'
                          : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] hover:bg-[#FEF3C7]'
                    }`}
                  >
                    {booking.paymentStatus === 'paid' 
                      ? 'Lunas (Sinkron)' 
                      : booking.paymentStatus === 'verifying' 
                        ? 'Verifikasi Bukti' 
                        : 'Tagih Pembayaran'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E4E4E7]">
                {booking.paymentProofUrl && (
                  <a 
                    href={booking.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#EFF6FF] text-[#1E40AF] py-2.5 rounded-lg font-medium text-xs border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Bukti Struk
                  </a>
                )}
                <button 
                  onClick={() => setSelectedBookingForLayoutReview(booking)} 
                  className="flex-1 flex items-center justify-center gap-2 bg-[#F4F4F5] text-[#171717] py-2.5 rounded-lg font-medium text-xs border border-[#E4E4E7] hover:bg-[#E4E4E7]/60 transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" /> Denah
                </button>
                <button 
                  type="button"
                  onClick={() => onOpenWhatsApp ? onOpenWhatsApp(booking) : window.open(`https://wa.me/${formatWhatsAppPhoneNumber(booking.phone)}`, '_blank', 'noopener,noreferrer')} 
                  className="flex-1 flex items-center justify-center gap-2 bg-[#F0FDF4] text-[#15803D] py-2.5 rounded-lg font-medium text-xs border border-[#BBF7D0] hover:bg-[#DCFCE7] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
                <button 
                  onClick={() => onPreviewContract ? onPreviewContract(booking) : generateContract(booking)} 
                  className="flex-1 flex items-center justify-center gap-2 bg-[#EFF6FF] text-[#1E40AF] py-2.5 rounded-lg font-medium text-xs border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors" 
                  title="Pratinjau & Cetak Perjanjian Sewa"
                >
                  <FileText className="w-4 h-4" /> Kontrak
                </button>
                <button 
                  onClick={() => onPreviewReceipt ? onPreviewReceipt(booking) : generateReceipt(booking)} 
                  className="flex-1 flex items-center justify-center gap-2 bg-[#F0FDF4] text-[#15803D] py-2.5 rounded-lg font-medium text-xs border border-[#BBF7D0] hover:bg-[#DCFCE7] transition-colors" 
                  title="Pratinjau & Cetak Kuitansi Pembayaran"
                >
                  <Receipt className="w-4 h-4" /> Kuitansi
                </button>
                <button 
                  onClick={() => handleDelete(booking.id)} 
                  className="w-10 h-10 flex items-center justify-center bg-[#FEF2F2] text-[#DC2626] rounded-lg border border-[#FECACA] hover:bg-[#FEE2E2] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {booking.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => handleStatusChange(booking.id, 'approved')} 
                    className="bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-xs py-2.5 rounded-lg transition-colors"
                  >
                    Setujui
                  </button>
                  <button 
                    onClick={() => handleStatusChange(booking.id, 'rejected')} 
                    className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium text-xs py-2.5 rounded-lg transition-colors"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </>
  );
}
