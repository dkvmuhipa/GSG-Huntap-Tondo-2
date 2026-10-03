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
  Receipt,
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
  X,
  LayoutGrid,
  Warehouse,
  Sparkles
} from 'lucide-react';
import { 
  updateBookingStatus, 
  removeBooking, 
  addBooking, 
  recordBookingToFinance,
  approveBookingSafe,
  logAdminActivity 
} from '../../lib/db';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAuth } from 'firebase/auth';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { generateContract, generateReceipt, buildContractDoc, buildReceiptDoc } from '../../services/contractService';
import { getTransparentPNG } from '../../lib/cloudinary';
import { useAppStore } from '../../store/useAppStore';
import HallLayoutCanvas from '../../components/ui/HallLayoutCanvas';

import { useOutletContext } from 'react-router-dom';

import BookingTable from '../../components/admin/booking/BookingTable';
import BookingCalendar from '../../components/admin/booking/BookingCalendar';
import BookingFormModal from '../../components/admin/booking/BookingFormModal';
import LayoutReviewModal from '../../components/admin/booking/LayoutReviewModal';
import WhatsAppActionModal from '../../components/admin/booking/WhatsAppActionModal';
import PdfPreviewModal from '../../components/ui/PdfPreviewModal';

export default function BookingManager() {
  const { userRole, adminProfile } = useOutletContext<{ userRole: string, adminProfile: any }>();
  const auth = getAuth();
  const bookings = useAppStore(state => state.bookings);
  const config = useAppStore(state => state.config);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Layout Review Modal State
  const [selectedBookingForLayoutReview, setSelectedBookingForLayoutReview] = useState<any | null>(null);
  const [selectedBookingForWA, setSelectedBookingForWA] = useState<any | null>(null);
  const [pdfPreviewModal, setPdfPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    loadPdf: () => Promise<any>;
  }>({
    isOpen: false,
    title: '',
    loadPdf: async () => ({ doc: new jsPDF(), filename: '' })
  });
  const inventoryList = useAppStore(state => state.inventory);

  const handlePreviewContract = (booking: any) => {
    setPdfPreviewModal({
      isOpen: true,
      title: `Surat Perjanjian Sewa - ${booking.customerName}`,
      loadPdf: () => buildContractDoc(booking)
    });
  };

  const handlePreviewReceipt = (booking: any) => {
    setPdfPreviewModal({
      isOpen: true,
      title: `Kuitansi / Invoice Pembayaran - ${booking.customerName}`,
      loadPdf: () => buildReceiptDoc(booking)
    });
  };

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
    organizerType: 'Perorangan / Keluarga',
    organizerName: '',
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
      if (newStatus === 'approved') {
        const result = await approveBookingSafe(id, bookings, {
          email: auth.currentUser?.email || null,
          displayName: adminProfile?.displayName || auth.currentUser?.displayName || undefined,
          role: userRole
        });

        if (!result.success && result.conflictBooking) {
          setConfirmConfig({
            isOpen: true,
            title: '⚠️ Bentrok Jadwal Sewa Terdeteksi',
            message: `Pemesanan ini TIDAK DAPAT disetujui karena tanggal ${result.conflictBooking.startDate} sudah disetujui sebelumnya untuk acara "${result.conflictBooking.purpose}" (${result.conflictBooking.customerName}).\n\nSistem secara otomatis mencegah double-booking. Silakan tolak atau atur jadwal pemesanan ulang.`,
            onConfirm: () => {},
            type: 'danger',
            isAlert: true
          });
          return;
        }
      } else {
        await updateBookingStatus(id, { status: newStatus });
        await logAdminActivity({
          action: `BOOKING_${newStatus.toUpperCase()}`,
          description: `Mengubah status sewa menjadi "${newStatus.toUpperCase()}" untuk ID: ${id}`,
          targetId: id,
          actorInfo: {
            email: auth.currentUser?.email || null,
            displayName: adminProfile?.displayName || auth.currentUser?.displayName || undefined,
            role: userRole
          }
        });
      }
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
            await logAdminActivity({
              action: 'PAYMENT_SYNCED_FINANCE',
              description: `Mencatat pembayaran sewa Rp ${Number(booking.amount).toLocaleString('id-ID')} (${booking.customerName}) ke pembukuan kas`,
              targetId: booking.id,
              actorInfo: {
                email: auth.currentUser?.email || null,
                displayName: adminProfile?.displayName || auth.currentUser?.displayName || undefined,
                role: userRole
              }
            });
          },
          type: 'info'
        });
      } else {
        await updateBookingStatus(id, { paymentStatus: newStatus });
        await logAdminActivity({
          action: 'PAYMENT_STATUS_UPDATED',
          description: `Mengubah status bayar menjadi "${newStatus.toUpperCase()}" untuk pemesan ${booking.customerName}`,
          targetId: id,
          actorInfo: {
            email: auth.currentUser?.email || null,
            displayName: adminProfile?.displayName || auth.currentUser?.displayName || undefined,
            role: userRole
          }
        });
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
          await logAdminActivity({
            action: 'BOOKING_DELETED',
            description: `Menghapus data sewa: ${booking.purpose} (${booking.customerName})`,
            targetId: id,
            actorInfo: {
              email: auth.currentUser?.email || null,
              displayName: adminProfile?.displayName || auth.currentUser?.displayName || undefined,
              role: userRole
            }
          });
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
          organizerType: 'Perorangan / Keluarga',
          organizerName: '',
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
      msg = `Halo ${booking.customerName}, pengajuan booking Gedung Serbaguna Huntap Tondo 2 untuk acara "${booking.purpose}" pada tanggal ${new Date(booking.startDate).toLocaleDateString('id-ID')} telah DISETUJUI. Silakan lakukan pembayaran.`;
    } else if (type === 'remind') {
      msg = `Halo ${booking.customerName}, ini pengingat pembayaran sewa Gedung Serbaguna untuk acara "${booking.purpose}" pada ${new Date(booking.startDate).toLocaleDateString('id-ID')}. Mohon segera dikonfirmasi.`;
    } else if (type === 'reject') {
      msg = `Mohon maaf ${booking.customerName}, pengajuan booking Gedung Serbaguna Huntap Tondo 2 pada tanggal tsb Belum Bisa disetujui karena ada agenda lain.`;
    }

    const url = `https://wa.me/62${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const exportPDF = async () => {
    const bendaharaSig = config?.reportBendaharaSignature ? await getTransparentPNG(config.reportBendaharaSignature) : null;
    const financeSig = config?.reportFinanceSignature ? await getTransparentPNG(config.reportFinanceSignature) : null;
    const stampImg = config?.reportStamp ? await getTransparentPNG(config.reportStamp) : null;

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

    // --- PDF GENERATION CORE ---
    const drawHeader = (pageNumber: number) => {
      const isFirst = pageNumber === 1;
      const headerHeight = isFirst ? 45 : 25;

      // Header background
      doc.setFillColor(30, 64, 175); // primary blue
      doc.rect(0, 0, doc.internal.pageSize.width, headerHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      
      if (isFirst) {
        // Full Header (Page 1)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('LAPORAN JADWAL BOOKING', 14, 18);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('GEDUNG SERBAGUNA HUNTAP TONDO 2', 14, 26);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(226, 232, 240);
        doc.text('KOTA PALU, SULAWESI TENGAH', 14, 33);

        doc.setFontSize(8);
        doc.text(`Waktu Cetak: ${generationDate}`, 14, 40);
        doc.text(`Oleh: ${authorName}`, 14, 45);
      } else {
        // Minimal Header (Page 2+)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('DATA JADWAL - GEDUNG SERBAGUNA HUNTAP TONDO 2', 14, 12);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(226, 232, 240);
        doc.text(`Halaman ${pageNumber} | Dicetak: ${generationDate}`, 14, 18);
      }
    };

    const drawFooter = (pageNumber: number) => {
      doc.setFontSize(7);
      doc.setTextColor(150);
      const footerY = doc.internal.pageSize.height - 10;
      doc.text('Laporan Operasional - Pengurus Gedung Serbaguna Huntap Tondo 2', 14, footerY);
      doc.text(`Halaman ${pageNumber}`, doc.internal.pageSize.width - 14, footerY, { align: 'right' });
    };

    // Initial Header
    drawHeader(1);

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
      startY: 55,
      margin: { top: 35, bottom: 20 },
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
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawHeader(data.pageNumber);
        }
        drawFooter(data.pageNumber);
      }
    });

    // --- SIGNATURES SECTION ---
    const finalY = (doc as any).lastAutoTable.finalY || 55;
    const pageHeight = doc.internal.pageSize.height;
    let sigY = finalY + 15;
    if (sigY > pageHeight - 55) {
      doc.addPage();
      drawHeader(doc.getNumberOfPages());
      drawFooter(doc.getNumberOfPages());
      sigY = 40;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const sigDate = `Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    const signBlockWidth = 60;
    const rightSigX = doc.internal.pageSize.width - 20 - (signBlockWidth / 2);
    const leftSigX = 20 + (signBlockWidth / 2);
    
    const financeName = config?.reportFinanceName || 'Keuangan';
    const bendaharaName = config?.reportBendaharaName || 'Bendahara';

    // Right Side: Bendahara
    doc.text(sigDate, rightSigX, sigY, { align: 'center' });
    doc.text('Mengetahui / Menyetujui,', rightSigX, sigY + 5, { align: 'center' });
    
    if (bendaharaSig) {
      try {
        doc.addImage(bendaharaSig, 'PNG', rightSigX - 15, sigY + 8, 30, 15);
      } catch (e) {
        console.error("Failed to add Bendahara signature to booking report:", e);
      }
    }

    if (stampImg) {
      try {
        doc.addImage(stampImg, 'PNG', rightSigX - 22, sigY + 6, 24, 24);
      } catch (e) {
        console.error("Failed to add stamp to booking report:", e);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.text(bendaharaName, rightSigX, sigY + 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Bendahara', rightSigX, sigY + 36, { align: 'center' });

    // Left Side: Pembuat Laporan
    doc.text('Dibuat Oleh,', leftSigX, sigY + 5, { align: 'center' });
    if (financeSig) {
      try {
        doc.addImage(financeSig, 'PNG', leftSigX - 15, sigY + 8, 30, 15);
      } catch (e) {
        console.error("Failed to add Finance signature to booking report:", e);
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.text(authorName, leftSigX, sigY + 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(currentRole || 'Administrator', leftSigX, sigY + 36, { align: 'center' });

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
            <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <BookingTable 
                filteredBookings={filteredBookings}
                handlePaymentStatusChange={handlePaymentStatusChange}
                setSelectedBookingForLayoutReview={setSelectedBookingForLayoutReview}
                generateContract={generateContract}
                generateReceipt={generateReceipt}
                onPreviewContract={handlePreviewContract}
                onPreviewReceipt={handlePreviewReceipt}
                handleDelete={handleDelete}
                handleStatusChange={handleStatusChange}
                onOpenWhatsApp={(booking) => setSelectedBookingForWA(booking)}
              />
            </motion.div>
          ) : (
            <motion.div key="calendar" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <BookingCalendar 
                calendarDays={calendarDays}
                currentMonth={currentMonth}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BookingFormModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
      />

      <LayoutReviewModal 
        selectedBooking={selectedBookingForLayoutReview}
        onClose={() => setSelectedBookingForLayoutReview(null)}
        inventoryList={inventoryList}
      />

      <WhatsAppActionModal 
        isOpen={!!selectedBookingForWA}
        onClose={() => setSelectedBookingForWA(null)}
        booking={selectedBookingForWA}
        config={config}
      />

      <PdfPreviewModal 
        isOpen={pdfPreviewModal.isOpen}
        onClose={() => setPdfPreviewModal(prev => ({ ...prev, isOpen: false }))}
        title={pdfPreviewModal.title}
        loadPdf={pdfPreviewModal.loadPdf}
      />

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />

      {/* Tinjau Denah & Alat Modal Drawer */}
      <AnimatePresence>
        {selectedBookingForLayoutReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBookingForLayoutReview(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] z-10">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Denah Ruang & Alat Dipesan</h3>
                    <p className="text-xs text-gray-500 font-bold mt-1">Pemohon: {selectedBookingForLayoutReview.customerName}</p>
                    <p className="text-[10px] text-primary font-black uppercase mt-0.5 tracking-wider">
                      Penyelenggara: {selectedBookingForLayoutReview.organizerName || selectedBookingForLayoutReview.organization || selectedBookingForLayoutReview.customerName} ({selectedBookingForLayoutReview.organizerType || 'Perorangan'})
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedBookingForLayoutReview(null)} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all rounded-2xl"><XCircle className="w-6 h-6" /></button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 block mb-3">Tata Letak Rencana Visual</span>
                  <HallLayoutCanvas
                    layoutData={{
                      template: selectedBookingForLayoutReview.layoutDraft?.template || 'wedding',
                      stagePosition: selectedBookingForLayoutReview.layoutDraft?.stagePosition || 'depan',
                      tableQuantity: selectedBookingForLayoutReview.layoutDraft?.tableQuantity || 0,
                      chairQuantity: selectedBookingForLayoutReview.layoutDraft?.chairQuantity || 0,
                      selectedElementIds: selectedBookingForLayoutReview.layoutDraft?.selectedElementIds || []
                    }}
                    onChange={() => {}}
                    interactive={false}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                    <Warehouse className="w-4 h-4 text-gray-400" />
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Inventaris Untuk Acara Ini</h4>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100/50 space-y-2.5">
                    {/* Render active selections */}
                    {Object.entries(selectedBookingForLayoutReview.selectedInventory || {}).filter(([_, qty]) => Number(qty) > 0).length === 0 ? (
                      <p className="text-xs text-gray-400 font-bold italic py-2 text-center">Tidak memesan alat tambahan.</p>
                    ) : (
                      Object.entries(selectedBookingForLayoutReview.selectedInventory || {}).map(([id, qty]) => {
                        const invDoc = inventoryList.find(i => i.id === id);
                        const cleanName = invDoc ? invDoc.name : (id === 'inv-kursi' ? 'Kursi Lipat Chitose' : id === 'inv-meja' ? 'Meja Bulat Banquet' : id);
                        return (
                          <div key={id} className="flex justify-between items-center text-xs text-gray-700 font-bold border-b border-gray-150/50 pb-2 last:border-none last:pb-0">
                            <span className="text-gray-900">• {cleanName}</span>
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-primary font-mono font-black">{qty as number} Unit</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {selectedBookingForLayoutReview.status === 'pending' && (
                    <button 
                      onClick={async () => {
                        await handleStatusChange(selectedBookingForLayoutReview.id, 'approved');
                        setSelectedBookingForLayoutReview(null);
                      }} 
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> SETUJUI BOOKING
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedBookingForLayoutReview(null)} 
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest py-4 rounded-2xl"
                  >
                    TUTUP TINJAUAN
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
