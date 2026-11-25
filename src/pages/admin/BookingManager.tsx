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
  FileSpreadsheet,
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
  Sparkles,
  Printer
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
import { exportBookingsToExcel } from '../../services/excelExportService';
import { notifyCitizenOnApproval, notifyCitizenOnPayment } from '../../services/whatsappGatewayService';

import { useOutletContext } from 'react-router-dom';

import BookingTable from '../../components/admin/booking/BookingTable';
import BookingCalendar from '../../components/admin/booking/BookingCalendar';
import BookingFormModal from '../../components/admin/booking/BookingFormModal';
import LayoutReviewModal from '../../components/admin/booking/LayoutReviewModal';
import WhatsAppActionModal from '../../components/admin/booking/WhatsAppActionModal';
import BookingActionAlerts from '../../components/admin/booking/BookingActionAlerts';
import PdfPreviewModal from '../../components/ui/PdfPreviewModal';
import { buildMonthlySchedulePosterDoc } from '../../services/schedulePosterPdfService';
import { getLocalDateISO, getLocalMonthKey, parseLocalDate } from '../../lib/dateUtils';
import { formatWhatsAppPhoneNumber } from '../../lib/whatsapp';

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
  const [actionBanner, setActionBanner] = useState<{ success: boolean; message: string } | null>(null);
  const inventoryList = useAppStore(state => state.inventory);

  const handleActionNotifyResult = (success: boolean, message: string) => {
    setActionBanner({ success, message });
    setTimeout(() => setActionBanner(null), 5000);
  };

  const handlePreviewMonthlyPoster = () => {
    const monthLabel = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    setPdfPreviewModal({
      isOpen: true,
      title: `Poster Jadwal Gedung (A4) - ${monthLabel}`,
      loadPdf: () => buildMonthlySchedulePosterDoc(currentMonth, bookings, config),
    });
  };

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
    notes: ''
  });

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           b.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verifying' ? b.paymentStatus === 'verifying' : b.status === statusFilter);
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
            title: 'Bentrok Jadwal Sewa Terdeteksi',
            message: `Pemesanan ini TIDAK DAPAT disetujui karena tanggal ${result.conflictBooking.startDate} sudah disetujui sebelumnya untuk acara "${result.conflictBooking.purpose}" (${result.conflictBooking.customerName}).\n\nSistem secara otomatis mencegah double-booking. Silakan tolak atau atur jadwal pemesanan ulang.`,
            onConfirm: () => {},
            type: 'danger',
            isAlert: true
          });
          return;
        }

        if (result.success) {
          const targetBooking = bookings.find(b => b.id === id);
          if (targetBooking) {
            notifyCitizenOnApproval({ ...targetBooking, status: 'approved' }, config);
          }
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
            notifyCitizenOnPayment({ ...booking, paymentStatus: 'paid' }, config);
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
        if (newStatus === 'paid') {
          notifyCitizenOnPayment({ ...booking, paymentStatus: 'paid' }, config);
        }
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
        const createdId = await addBooking({
          ...formData,
          amount: Number(formData.amount),
          status: 'approved'
        });

        await logAdminActivity({
          action: 'BOOKING_CREATED_MANUAL',
          description: `Menambahkan jadwal booking manual: ${formData.purpose} (${formData.customerName}) pada ${formData.startDate}`,
          targetId: createdId || undefined,
          actorInfo: {
            email: auth.currentUser?.email || null,
            displayName: adminProfile?.displayName || auth.currentUser?.displayName || undefined,
            role: userRole
          }
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
          notes: ''
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
    const formattedPhone = formatWhatsAppPhoneNumber(booking.phone);
    if (!formattedPhone) return;
    let msg = '';
    const dateFormatted = parseLocalDate(booking.startDate).toLocaleDateString('id-ID');

    if (type === 'approve') {
      msg = `Halo ${booking.customerName}, pengajuan booking Gedung Serbaguna Huntap Tondo 2 untuk acara "${booking.purpose}" pada tanggal ${dateFormatted} telah DISETUJUI. Silakan lakukan pembayaran.`;
    } else if (type === 'remind') {
      msg = `Halo ${booking.customerName}, ini pengingat pembayaran sewa Gedung Serbaguna untuk acara "${booking.purpose}" pada ${dateFormatted}. Mohon segera dikonfirmasi.`;
    } else if (type === 'reject') {
      msg = `Mohon maaf ${booking.customerName}, pengajuan booking Gedung Serbaguna Huntap Tondo 2 pada tanggal tsb Belum Bisa disetujui karena ada agenda lain.`;
    }

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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

    doc.save(`Laporan_Booking_${getLocalDateISO()}.pdf`);
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
        const bStart = getLocalDateISO(parseLocalDate(b.startDate));
        const bEnd = getLocalDateISO(parseLocalDate(b.endDate || b.startDate));
        return dateStr >= bStart && dateStr <= bEnd && (b.status === 'approved' || b.status === 'completed');
      });
      days.push({ day: i, bookings: dayBookings });
    }
    return days;
  }, [currentMonth, bookings]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] text-[11px] font-medium">Disetujui</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] text-[11px] font-medium">Ditolak</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] text-[11px] font-medium">Selesai</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-[11px] font-medium">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#171717] tracking-tight">Kelola Booking Gedung</h2>
          <p className="text-[#737373] text-sm mt-0.5">Sistem kontrol jadwal dan status pembayaran penyewaan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => exportBookingsToExcel(filteredBookings, statusFilter === 'all' ? 'Semua Status' : statusFilter.toUpperCase())}
            className="flex items-center justify-center gap-2 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] px-4 py-2.5 rounded-lg font-medium text-xs hover:bg-[#DCFCE7] transition-colors flex-1 md:flex-none cursor-pointer"
            title="Unduh Rekap Data Booking ke Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#16A34A]" />
            <span>Ekspor Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePreviewMonthlyPoster}
            className="flex items-center justify-center gap-2 bg-white text-[#171717] border border-[#E4E4E7] px-4 py-2.5 rounded-lg font-medium text-xs hover:bg-[#F4F4F5] transition-colors flex-1 md:flex-none cursor-pointer"
            title="Pratinjau & Cetak Poster Jadwal Bulanan A4 untuk Papan Pengumuman"
          >
            <Printer className="w-4 h-4 text-[#1E40AF]" />
            <span>Poster Jadwal A4</span>
          </button>
          <button onClick={exportPDF} className="flex items-center justify-center gap-2 bg-white text-[#171717] px-4 py-2.5 rounded-lg font-medium text-xs border border-[#E4E4E7] hover:bg-[#F4F4F5] transition-colors flex-1 md:flex-none cursor-pointer">
            <Download className="w-4 h-4 text-[#525252]" />
            Laporan
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 bg-[#1E40AF] hover:bg-[#1D3A8A] text-white px-4 py-2.5 rounded-lg font-medium text-xs transition-colors flex-1 md:flex-none cursor-pointer">
            <Plus className="w-4 h-4" />
            Booking Baru
          </button>
        </div>
      </div>

      <BookingActionAlerts
        bookings={bookings}
        config={config}
        onFilterVerifying={() => {
          setActiveTab('list');
          setStatusFilter('verifying');
        }}
        onNotifyResult={handleActionNotifyResult}
      />

      {actionBanner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
            actionBanner.success
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
          }`}
        >
          <span>{actionBanner.message}</span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="p-1 rounded-md hover:bg-black/5 cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E4E4E7]">
          <div className="w-9 h-9 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] rounded-lg flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-[#737373]">Antrean</p>
          <h4 className="text-2xl font-mono tabular-nums font-semibold text-[#171717] mt-1">{bookings.filter(b => b.status === 'pending').length}</h4>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E4E4E7]">
          <div className="w-9 h-9 bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded-lg flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-[#737373]">Disetujui</p>
          <h4 className="text-2xl font-mono tabular-nums font-semibold text-[#171717] mt-1">{bookings.filter(b => b.status === 'approved').length}</h4>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E4E4E7]">
          <div className="w-9 h-9 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-lg flex items-center justify-center mb-3">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-[#737373]">Bulan Ini</p>
          <h4 className="text-2xl font-mono tabular-nums font-semibold text-[#171717] mt-1">{bookings.filter(b => typeof b.startDate === 'string' && b.startDate.startsWith(getLocalMonthKey())).length}</h4>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E4E4E7]">
          <div className="w-9 h-9 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-lg flex items-center justify-center mb-3">
            <Zap className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-[#737373]">Tagihan Aktif</p>
          <h4 className="text-xl sm:text-2xl font-mono tabular-nums font-semibold text-[#171717] mt-1">Rp {bookings.filter(b => b.paymentStatus === 'unpaid').reduce((acc, b) => acc + Number(b.amount || 0), 0).toLocaleString('id-ID')}</h4>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E4E4E7] bg-[#FAFAFA]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex bg-[#F4F4F5] p-1 rounded-lg border border-[#E4E4E7]">
              <button 
                onClick={() => setActiveTab('list')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'list' ? 'bg-white text-[#171717] shadow-xs border border-[#E4E4E7]' : 'text-[#525252] hover:text-[#171717]'}`}
              >
                Daftar & Kontrol
              </button>
              <button 
                onClick={() => setActiveTab('calendar')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'calendar' ? 'bg-white text-[#171717] shadow-xs border border-[#E4E4E7]' : 'text-[#525252] hover:text-[#171717]'}`}
              >
                Kalender
              </button>
            </div>

            {activeTab === 'list' && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] group-focus-within:text-[#1E40AF] transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Cari nama/acara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-[#E4E4E7] rounded-lg text-xs font-medium text-[#171717] focus:outline-none focus:border-[#1E40AF] transition-colors"
                  />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-[#E4E4E7] rounded-lg text-xs font-medium text-[#171717] focus:outline-none focus:border-[#1E40AF] appearance-none min-w-[140px]"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="verifying">Verifikasi Bukti</option>
                  <option value="approved">Disetujui</option>
                  <option value="completed">Selesai</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-[#E4E4E7]">
                <button onClick={prevMonth} className="p-1 hover:bg-[#F4F4F5] rounded-md transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4 text-[#525252]" /></button>
                <span className="font-semibold text-xs text-[#171717] text-center min-w-[130px] truncate">
                  {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-[#F4F4F5] rounded-md transition-colors cursor-pointer"><ChevronRight className="w-4 h-4 text-[#525252]" /></button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBookingForLayoutReview(null)} className="absolute inset-0 bg-black/60" />
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="relative bg-white w-full max-w-xl rounded-2xl border border-[#E4E4E7] overflow-hidden overflow-y-auto max-h-[90vh] z-10">
              <div className="p-6 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-lg flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#171717]">Denah Ruang & Alat Dipesan</h3>
                    <p className="text-xs text-[#525252] mt-0.5">Pemohon: {selectedBookingForLayoutReview.customerName}</p>
                    <p className="text-[11px] text-[#1E40AF] font-medium mt-0.5">
                      Penyelenggara: {selectedBookingForLayoutReview.organizerName || selectedBookingForLayoutReview.organization || selectedBookingForLayoutReview.customerName} ({selectedBookingForLayoutReview.organizerType || 'Perorangan'})
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedBookingForLayoutReview(null)} className="p-2 hover:bg-[#FEE2E2] text-[#737373] hover:text-[#DC2626] transition-colors rounded-lg cursor-pointer"><XCircle className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <span className="text-xs font-medium text-[#737373] pl-0.5 block mb-2.5">Tata letak rencana visual</span>
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

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-[#E4E4E7] pb-2">
                    <Warehouse className="w-4 h-4 text-[#737373]" />
                    <h4 className="text-xs font-semibold text-[#525252]">Detail inventaris untuk acara ini</h4>
                  </div>

                  <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#E4E4E7] space-y-2.5">
                    {/* Render active selections */}
                    {Object.entries(selectedBookingForLayoutReview.selectedInventory || {}).filter(([_, qty]) => Number(qty) > 0).length === 0 ? (
                      <p className="text-xs text-[#737373] py-2 text-center">Tidak memesan alat tambahan.</p>
                    ) : (
                      Object.entries(selectedBookingForLayoutReview.selectedInventory || {}).map(([id, qty]) => {
                        const invDoc = inventoryList.find(i => i.id === id);
                        const cleanName = invDoc ? invDoc.name : (id === 'inv-kursi' ? 'Kursi Lipat Chitose' : id === 'inv-meja' ? 'Meja Bulat Banquet' : id);
                        return (
                          <div key={id} className="flex justify-between items-center text-xs text-[#525252] border-b border-[#E4E4E7] pb-2 last:border-none last:pb-0">
                            <span className="text-[#171717] font-medium">{cleanName}</span>
                            <span className="px-2.5 py-0.5 bg-white border border-[#E4E4E7] rounded-md text-[#1E40AF] font-mono tabular-nums font-semibold">{qty as number} Unit</span>
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
                      className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Setujui Booking
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedBookingForLayoutReview(null)} 
                    className="flex-1 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#171717] border border-[#E4E4E7] font-medium text-xs py-3 rounded-lg transition-colors cursor-pointer"
                  >
                    Tutup Tinjauan
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
