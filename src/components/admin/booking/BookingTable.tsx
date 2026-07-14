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
  Clock 
} from 'lucide-react';

interface BookingTableProps {
  filteredBookings: any[];
  handlePaymentStatusChange: (id: string, newStatus: string) => void;
  setSelectedBookingForLayoutReview: (booking: any) => void;
  generateContract: (booking: any) => void;
  generateReceipt: (booking: any) => void;
  handleDelete: (id: string) => void;
  handleStatusChange: (id: string, newStatus: string) => void;
}

export default function BookingTable({
  filteredBookings,
  handlePaymentStatusChange,
  setSelectedBookingForLayoutReview,
  generateContract,
  generateReceipt,
  handleDelete,
  handleStatusChange,
}: BookingTableProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100">
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
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-16">No</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Penyewa & WhatsApp</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu & Acara</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Keuangan</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-24 text-center italic text-gray-300 font-bold">
                  Data booking tidak ditemukan...
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking, idx) => (
                <motion.tr 
                  key={booking.id} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-6 text-center font-black text-gray-300 text-sm">{idx + 1}</td>
                  <td className="px-6 py-6">
                    <p className="font-black text-gray-900 leading-none">{booking.customerName}</p>
                    <a 
                      href={`https://wa.me/62${booking.phone.startsWith('0') ? booking.phone.slice(1) : booking.phone}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md mt-2 inline-flex items-center gap-1 uppercase tracking-tighter"
                    >
                      <MessageCircle className="w-3 h-3" /> {booking.phone}
                    </a>
                  </td>
                  <td className="px-6 py-6">
                    <p className="font-black text-gray-900 leading-none">{booking.purpose}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-2">
                      {new Date(booking.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-6 py-6 text-center">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-xs font-black text-primary">
                        Rp {Number(booking.amount || 0).toLocaleString('id-ID')}
                      </span>
                      <button 
                        onClick={() => handlePaymentStatusChange(booking.id, booking.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all border shadow-sm active:scale-95 ${
                          booking.paymentStatus === 'paid' 
                            ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                            : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                        }`}
                      >
                        {booking.paymentStatus === 'paid' ? 'LUNAS (SINKRON)' : 'TAGIH PEMBAYARAN'}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedBookingForLayoutReview(booking)} 
                        className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors" 
                        title="Tinjau Denah Gedung"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => generateContract(booking)} 
                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" 
                        title="Unduh Perjanjian Sewa"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => generateReceipt(booking)} 
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors" 
                        title="Unduh Kuitansi Pembayaran"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(booking.id, 'approved')} 
                            className="px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-black hover:bg-green-600 transition-colors"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => handleStatusChange(booking.id, 'rejected')} 
                            className="px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDelete(booking.id)} 
                        className="p-3 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 rounded-xl transition-all" 
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View Cards */}
      <div className="lg:hidden grid gap-4 p-4">
        {filteredBookings.length === 0 ? (
          <div className="py-12 text-center italic text-gray-300 font-bold">
            Data booking tidak ditemukan...
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <motion.div 
              key={booking.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white border border-gray-100 rounded-[2rem] p-6 space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-gray-950 text-base">{booking.customerName}</h4>
                  <p className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md inline-block mt-1 uppercase tracking-tighter">
                    {new Date(booking.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-bold text-gray-700">{booking.purpose}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-black text-primary">Rp {Number(booking.amount || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <button 
                    onClick={() => handlePaymentStatusChange(booking.id, booking.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border shadow-sm active:scale-95 ${
                      booking.paymentStatus === 'paid' 
                        ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                        : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                    }`}
                  >
                    {booking.paymentStatus === 'paid' ? 'LUNAS (SINKRON)' : 'TAGIH PEMBAYARAN'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button 
                  onClick={() => setSelectedBookingForLayoutReview(booking)} 
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-100"
                >
                  <LayoutGrid className="w-4 h-4" /> Denah
                </button>
                <a 
                  href={`https://wa.me/62${booking.phone.startsWith('0') ? booking.phone.slice(1) : booking.phone}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-green-100"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <button 
                  onClick={() => generateContract(booking)} 
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-100" 
                  title="Unduh Perjanjian Sewa"
                >
                  <FileText className="w-4 h-4" /> Kontrak
                </button>
                <button 
                  onClick={() => generateReceipt(booking)} 
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-100" 
                  title="Unduh Kuitansi Pembayaran"
                >
                  <Receipt className="w-4 h-4" /> Kuitansi
                </button>
                <button 
                  onClick={() => handleDelete(booking.id)} 
                  className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-400 rounded-xl border border-red-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {booking.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => handleStatusChange(booking.id, 'approved')} 
                    className="bg-green-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-green-200"
                  >
                    Setujui
                  </button>
                  <button 
                    onClick={() => handleStatusChange(booking.id, 'rejected')} 
                    className="bg-red-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-red-200"
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
