import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  FileText,
  Plus,
  ChevronDown,
  ExternalLink,
  Trash2,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Zap,
  Check,
  X
} from 'lucide-react';
import { subscribeToBookings, updateBookingStatus, removeBooking, addBooking, recordBookingToFinance, subscribeToConfig } from '../../lib/db';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAuth } from 'firebase/auth';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { generateContract } from '../../services/contractService';

import { useOutletContext } from 'react-router-dom';

export default function BookingManager() {
  const { userRole, adminProfile } = useOutletContext<{ userRole: string, adminProfile: any }>();
  const auth = getAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    nik: '',
    address: '',
    organization: '',
    purpose: '',
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '17:00',
    guests: '',
    amount: '',
    notes: '',
    autoFinance: true
  });

  useEffect(() => {
    const unsubBookings = subscribeToBookings((data) => setBookings(data));
    const unsubConfig = subscribeToConfig((data) => setConfig(data));
    return () => {
      unsubBookings();
      unsubConfig();
    };
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           b.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  // Conflict Checking Logic
  const checkConflicts = (start: string, end: string, id?: string) => {
    const newStart = new Date(start);
    const newEnd = new Date(end || start);
    
    return bookings.some(b => {
      if (b.id === id) return false;
      if (b.status !== 'approved' && b.status !== 'completed') return false;
      
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate || b.startDate);
      
      return (newStart <= bEnd && newEnd >= bStart);
    });
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateBookingStatus(id, { status: newStatus });
    } catch (error) {
      console.error(error);
    }
  };

  const handlePaymentStatusChange = async (id: string, newStatus: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    try {
      if (newStatus === 'paid' && !booking.financeAdded) {
        setConfirmConfig({
          isOpen: true,
          title: 'Sinkronkan Keuangan?',
          message: `Sinkronkan pembayaran Rp ${Number(booking.amount).toLocaleString('id-ID')} ke Laporan Keuangan?\n(Akan otomatis membagi Dana Pengembangan & Operasional)`,
          onConfirm: async () => {
            await recordBookingToFinance(booking, {
              email: auth.currentUser?.email || null,
              displayName: adminProfile?.displayName || auth.currentUser?.displayName || undefined,
              role: userRole
            });
          },
          type: 'info'
        });
      } else {
        await updateBookingStatus(id, { paymentStatus: newStatus });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Booking?',
      message: `Konfirmasi penghapusan data booking "${booking.purpose}" atas nama ${booking.customerName}. Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          await removeBooking(id);
        } catch (error) {
          console.error(error);
        }
      },
      type: 'danger'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const saveBooking = async () => {
      try {
        await addBooking({
          ...formData,
          amount: Number(formData.amount),
          status: 'approved'
        });

        setIsAddModalOpen(false);
        setFormData({
          customerName: '',
          phone: '',
          nik: '',
          address: '',
          organization: '',
          purpose: '',
          startDate: '',
          endDate: '',
          startTime: '08:00',
          endTime: '17:00',
          guests: '',
          amount: '',
          notes: '',
          autoFinance: true
        });
      } catch (error) {
        console.error(error);
      }
    };

    if (checkConflicts(formData.startDate, formData.endDate)) {
      setConfirmConfig({
        isOpen: true,
        title: 'Konflik Jadwal',
        message: 'Sudah ada booking yang disetujui di tanggal ini. Tetap simpan?',
        onConfirm: saveBooking,
        type: 'danger'
      });
      return;
    }

    await saveBooking();
  };

  const sendWA = (booking: any, type: 'approve' | 'remind' | 'reject') => {
    let msg = '';
    const phone = booking.phone.replace(/[^0-9]/g, '');
    
    if (type === 'approve') {
      msg = `Halo ${booking.customerName}, pengajuan booking GSG Huntap Tondo untuk acara "${booking.purpose}" pada tanggal ${new Date(booking.startDate).toLocaleDateString('id-ID')} telah DISETUJUI. Silakan lakukan pembayaran.`;
    } else if (type === 'remind') {
      msg = `Halo ${booking.customerName}, ini pengingat pembayaran sewa GSG untuk acara "${booking.purpose}" pada ${new Date(booking.startDate).toLocaleDateString('id-ID')}. Mohon segera dikonfirmasi.`;
    } else if (type === 'reject') {
      msg = `Mohon maaf ${booking.customerName}, pengajuan booking GSG Huntap Tondo pada tanggal tsb Belum Bisa disetujui karena ada agenda lain.`;
    }

    const url = `https://wa.me/62${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const generationDate = new Date().toLocaleString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const roleMap: Record<string, string> = {
      owner: 'Pengelola',
      admin: 'Administrator',
      editor: 'Editor',
      bendahara: 'Bendahara',
      finance: 'Admin Keuangan'
    };

    const currentRole = adminProfile?.role ? (roleMap[adminProfile.role] || adminProfile.role) : '';
    const authorName = config?.reportAuthorName || 
                      (adminProfile?.displayName ? `${adminProfile.displayName}${currentRole ? ` (${currentRole})` : ''}` : null) || 
                      auth.currentUser?.displayName || 
                      'Administrator';

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN JADWAL BOOKING GEDUNG', 14, 20);
    
    doc.setFontSize(10);
    doc.text(config?.reportOrgName?.toUpperCase() || 'GSG HUNTAP TONDO 2', 14, 27);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Waktu Cetak: ${generationDate}`, 14, 32);
    doc.text(`Oleh: ${authorName}`, 14, 37);

    const sortedBookings = [...filteredBookings].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateB - dateA;
    });

    const tableData = sortedBookings.map((b, i) => [
      i + 1,
      b.customerName,
      b.purpose,
      `${new Date(b.startDate).toLocaleDateString('id-ID')} ${b.endDate && b.endDate !== b.startDate ? '- ' + new Date(b.endDate).toLocaleDateString('id-ID') : ''}`,
      b.status.toUpperCase(),
      `Rp ${Number(b.amount).toLocaleString('id-ID')}`,
      b.paymentStatus.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['No', 'Nama Penyewa', 'Tujuan / Agenda', 'Jadwal Penggunaan', 'Status Approval', 'Biaya Sewa', 'Status Bayar']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], fontSize: 8, halign: 'center', fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        4: { halign: 'center' },
        5: { fontStyle: 'bold', halign: 'right' },
        6: { halign: 'center' }
      }
    });

    doc.save(`Laporan_Booking_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const calendarDays = useMemo(() => {
    const days = [];
    const total = daysInMonth(currentMonth);
    const start = firstDayOfMonth(currentMonth);
    for (let i = 0; i < start; i++) days.push(null);
    for (let i = 1; i <= total; i++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayBookings = bookings.filter(b => {
        const bStart = new Date(b.startDate).toISOString().split('T')[0];
        const bEnd = new Date(b.endDate || b.startDate).toISOString().split('T')[0];
        return dateStr >= bStart && dateStr <= bEnd && (b.status === 'approved' || b.status === 'completed');
      });
      days.push({ day: i, bookings: dayBookings });
    }
    return days;
  }, [currentMonth, bookings]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black leading-none uppercase tracking-widest">DISETUJUI</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black leading-none uppercase tracking-widest">DITOLAK</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black leading-none uppercase tracking-widest">SELESAI</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-black leading-none uppercase tracking-widest">PENDING</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Kelola Booking Gedung</h2>
          <p className="text-gray-500 font-medium mt-1">Sistem kontrol jadwal & keuangan penyewaan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportPDF} className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl font-bold border border-gray-200 shadow-sm hover:bg-gray-50 transition-all flex-1 md:flex-none">
            <Download className="w-5 h-5" />
            Laporan
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex-1 md:flex-none">
            <Plus className="w-5 h-5" />
            Booking Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Antrean</p>
          <h4 className="text-2xl font-black text-gray-900 mt-1">{bookings.filter(b => b.status === 'pending').length}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disetujui</p>
          <h4 className="text-2xl font-black text-gray-900 mt-1">{bookings.filter(b => b.status === 'approved').length}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bulan Ini</p>
          <h4 className="text-2xl font-black text-gray-900 mt-1">{bookings.filter(b => new Date(b.startDate).getMonth() === new Date().getMonth()).length}</h4>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tagihan Aktif</p>
          <h4 className="text-2xl font-black text-gray-900 mt-1">Rp {bookings.filter(b => b.paymentStatus === 'unpaid').reduce((acc, b) => acc + Number(b.amount || 0), 0).toLocaleString('id-ID')}</h4>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-white p-1 rounded-2xl border border-gray-200">
              <button 
                onClick={() => setActiveTab('list')}
                className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'list' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Daftar & Kontrol
              </button>
              <button 
                onClick={() => setActiveTab('calendar')}
                className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Kalender
              </button>
            </div>

            {activeTab === 'list' && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Cari nama/acara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                  />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-black text-gray-700 appearance-none min-w-[140px]"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Setuju</option>
                  <option value="completed">Selesai</option>
                  <option value="rejected">Tolak</option>
                </select>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-gray-200">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                <span className="font-black text-gray-900 uppercase tracking-widest text-center min-w-[140px] truncate">
                  {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="overflow-x-auto">
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
                    <tr><td colSpan={6} className="py-24 text-center italic text-gray-300 font-bold">Data booking tidak ditemukan...</td></tr>
                  ) : (
                    filteredBookings.map((booking, idx) => (
                      <motion.tr key={booking.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-6 text-center font-black text-gray-300 text-sm">{idx + 1}</td>
                        <td className="px-6 py-6">
                          <p className="font-black text-gray-900 leading-none">{booking.customerName}</p>
                          <a href={`https://wa.me/62${booking.phone.startsWith('0') ? booking.phone.slice(1) : booking.phone}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md mt-2 inline-flex items-center gap-1 uppercase tracking-tighter">
                            <MessageCircle className="w-3 h-3" /> {booking.phone}
                          </a>
                        </td>
                        <td className="px-6 py-6 font-bold">
                          <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded">
                            {new Date(booking.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            {booking.endDate && booking.endDate !== booking.startDate && ` - ${new Date(booking.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`}
                          </span>
                          <p className="text-sm font-black text-gray-900 block mt-1">{booking.purpose}</p>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {getStatusBadge(booking.status)}
                            <select value={booking.status} onChange={(e) => handleStatusChange(booking.id, e.target.value)} className="text-[9px] font-black text-gray-400 bg-transparent border-none appearance-none cursor-pointer hover:text-primary transition-colors text-center focus:ring-0">
                              <option value="pending">PENDING</option>
                              <option value="approved">SETUJU</option>
                              <option value="completed">SELESAI</option>
                              <option value="rejected">TOLAK</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <p className="text-sm font-black text-gray-900 mb-1.5">Rp {Number(booking.amount || 0).toLocaleString('id-ID')}</p>
                          <button 
                            onClick={() => handlePaymentStatusChange(booking.id, booking.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                            className={`px-3 py-1 rounded-full text-[9px] font-black transition-all border ${booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}
                          >
                            {booking.paymentStatus === 'paid' ? 'LUNAS (SINKRON)' : 'TAGIH PEMBAYARAN'}
                          </button>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {booking.status === 'pending' && (
                               <div className="flex bg-blue-50 p-1.5 rounded-2xl items-center gap-1 shadow-inner border border-blue-100">
                                 <button 
                                   onClick={() => handleStatusChange(booking.id, 'approved')} 
                                   className="px-3 py-2 bg-white hover:bg-green-500 hover:text-white rounded-xl text-green-600 transition-all font-black text-[9px] uppercase tracking-tighter flex items-center gap-1 shadow-sm"
                                 >
                                   <Check className="w-3 h-3" /> SETUJUI
                                 </button>
                                 <button 
                                   onClick={() => handleStatusChange(booking.id, 'rejected')} 
                                   className="px-3 py-2 bg-white hover:bg-red-500 hover:text-white rounded-xl text-red-500 transition-all font-black text-[9px] uppercase tracking-tighter flex items-center gap-1 shadow-sm"
                                 >
                                   <X className="w-3 h-3" /> TOLAK
                                 </button>
                               </div>
                             )}

                             <div className="flex bg-gray-100 p-1.5 rounded-2xl items-center gap-1 shadow-inner">
                               <button onClick={() => sendWA(booking, 'approve')} className="p-2 hover:bg-white rounded-xl text-green-600 transition-all hover:shadow-sm" title="Kirim WA Setuju"><Check className="w-4 h-4" /></button>
                               <button onClick={() => sendWA(booking, 'remind')} className="p-2 hover:bg-white rounded-xl text-primary transition-all hover:shadow-sm" title="Kirim WA Pengingat"><MessageCircle className="w-4 h-4" /></button>
                               <button 
                                 onClick={() => generateContract(booking)} 
                                 className="p-2 hover:bg-white rounded-xl text-blue-600 transition-all hover:shadow-sm" 
                                 title="Cetak Kontrak (PDF)"
                               >
                                 <FileText className="w-4 h-4" />
                               </button>
                             </div>
                             
                             <button 
                               onClick={() => handleDelete(booking.id)} 
                               className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded-2xl group shadow-sm"
                               title="Hapus Data Booking"
                             >
                               <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                             </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div key="calendar" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="p-8">
              <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-[2rem] overflow-hidden">
                {['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                  <div key={d} className="bg-gray-50 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
                ))}
                {calendarDays.map((dayObj, i) => (
                  <div key={i} className={`min-h-[100px] bg-white p-3 transition-colors ${!dayObj ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'}`}>
                    {dayObj && (
                      <>
                        <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg ${dayObj.day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() ? 'bg-primary text-white shadow-lg' : 'text-gray-300 font-bold'}`}>{dayObj.day}</span>
                        <div className="mt-2 space-y-1">
                          {dayObj.bookings.map((b: any) => (
                            <div key={b.id} className="p-1 px-1.5 bg-primary/5 rounded border-l-2 border-primary text-[8px] font-black text-primary truncate leading-tight group relative cursor-help">
                              {b.purpose}
                              <div className="absolute z-20 hidden group-hover:block bg-gray-900 text-white p-2 rounded-xl text-[10px] left-0 bottom-full mb-2 w-32 shadow-xl whitespace-normal font-bold">
                                {b.customerName}: {b.purpose}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Input Booking Gedung</h3>
                  <p className="text-xs text-gray-500 font-bold mt-1">Sertakan detail acara dengan lengkap.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all rounded-2xl"><XCircle className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nama Penyewa</label>
                    <input required type="text" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} placeholder="Nama Bpk/Ibu..." className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">WhatsApp</label>
                    <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="08..." className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">NIK (Opsional)</label>
                    <input type="text" value={formData.nik} onChange={(e) => setFormData({...formData, nik: e.target.value})} placeholder="16 Digit NIK" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Instansi</label>
                    <input type="text" value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})} placeholder="Jika ada..." className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Alamat Domisili</label>
                  <textarea rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Alamat lengkap pemohon..." className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tujuan / Nama Acara</label>
                  <input required type="text" value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} placeholder="Contoh: Resepsi Pernikahan..." className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Mulai Acara</label>
                    <input required type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Selesai Acara (Opsional)</label>
                    <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                  </div>

                  {formData.startDate && formData.endDate && formData.startDate !== formData.endDate && (
                    <div className="md:col-span-2 px-5 py-3 bg-blue-50 rounded-2xl flex items-center gap-3">
                      <Zap className="w-4 h-4 text-primary" />
                      <p className="text-[10px] font-bold text-primary uppercase">
                        Sewa Multi-Hari Terdeteksi: {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 3600 * 24)) + 1} Hari Terblokir
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      {formData.endDate && formData.endDate !== formData.startDate ? 'Jam Mulai (Hari Ke-1)' : 'Jam Mulai'}
                    </label>
                    <input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      {formData.endDate && formData.endDate !== formData.startDate ? 'Jam Selesai (Hari Terakhir)' : 'Jam Selesai'}
                    </label>
                    <input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Estimasi Tamu</label>
                    <input type="number" value={formData.guests} onChange={(e) => setFormData({...formData, guests: e.target.value})} placeholder="Orang" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Biaya Sewa (Rp)</label>
                    <input required type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="500000" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-black text-gray-900 shadow-inner text-lg" />
                  </div>
                </div>
                
                <button type="submit" className="w-full bg-primary text-white py-5 rounded-[2rem] font-black shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all mt-4">SIMPAN JADWAL BOOKING</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
}
