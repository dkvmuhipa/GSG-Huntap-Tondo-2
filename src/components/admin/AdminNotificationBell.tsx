import React, { useState, useEffect, useRef } from 'react';
import { Bell, CalendarCheck, CreditCard, MessageSquare, Store, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { subscribeToAllFeedback, FeedbackItem } from '../../lib/db';

interface AdminNotificationBellProps {
  userRole: string | null;
}

export default function AdminNotificationBell({ userRole }: AdminNotificationBellProps) {
  const bookings = useAppStore((state) => state.bookings);
  const vendors = useAppStore((state) => state.vendors);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const canModerateContent = ['owner', 'admin', 'bendahara', 'editor'].includes(userRole || '');
  const canManageBookings = ['owner', 'admin', 'editor', 'bendahara', 'finance'].includes(userRole || '');
  const canVerifyFinance = ['owner', 'admin', 'bendahara', 'finance'].includes(userRole || '');

  useEffect(() => {
    if (!canModerateContent) return;
    const unsub = subscribeToAllFeedback((items) => {
      setFeedbacks(items);
    });
    return () => unsub();
  }, [canModerateContent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const pendingBookings = canManageBookings ? bookings.filter((b) => b.status === 'pending').length : 0;
  const verifyingPayments = canVerifyFinance ? bookings.filter((b) => b.paymentStatus === 'verifying').length : 0;
  const pendingFeedback = canModerateContent ? feedbacks.filter((f) => f.status === 'pending').length : 0;
  const pendingVendors = canModerateContent ? vendors.filter((v) => v.status === 'pending').length : 0;

  const notificationItems = [
    {
      id: 'pending-bookings',
      count: pendingBookings,
      title: 'Pengajuan Sewa Baru',
      description: `${pendingBookings} permohonan menunggu persetujuan jadwal`,
      to: '/admin/bookings',
      icon: CalendarCheck,
      badgeColor: 'bg-amber-100 text-amber-700',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'verifying-payments',
      count: verifyingPayments,
      title: 'Bukti Transfer Masuk',
      description: `${verifyingPayments} struk pembayaran perlu verifikasi mutasi`,
      to: '/admin/bookings',
      icon: CreditCard,
      badgeColor: 'bg-blue-100 text-blue-700',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'pending-feedback',
      count: pendingFeedback,
      title: 'Ulasan Warga Menunggu',
      description: `${pendingFeedback} testimoni perlu dimoderasi sebelum tayang`,
      to: '/admin/settings',
      icon: MessageSquare,
      badgeColor: 'bg-emerald-100 text-emerald-700',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'pending-vendors',
      count: pendingVendors,
      title: 'Pendaftaran Mitra UMKM',
      description: `${pendingVendors} mitra usaha warga menunggu verifikasi`,
      to: '/admin/vendors',
      icon: Store,
      badgeColor: 'bg-purple-100 text-purple-700',
      iconBg: 'bg-purple-50 text-purple-600',
    },
  ].filter((item) => item.count > 0);

  const totalCount = pendingBookings + verifyingPayments + pendingFeedback + pendingVendors;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-500 hover:text-primary rounded-xl hover:bg-gray-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="Notifikasi Pengurus"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-xs">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 px-1">
              <div>
                <h4 className="text-sm font-black text-gray-900">Pusat Tindakan Pengurus</h4>
                <p className="text-[11px] text-gray-400 font-medium">Ringkasan tugas real-time</p>
              </div>
              {totalCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                  {totalCount} Antrean
                </span>
              )}
            </div>

            {notificationItems.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-black text-gray-900">Semua Tugas Terkelola</p>
                <p className="text-[11px] text-gray-400">Tidak ada permohonan atau verifikasi yang tertunda.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notificationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-2xl border border-gray-100 hover:border-primary/20 hover:bg-blue-50/30 transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-gray-900 group-hover:text-primary transition-colors">
                            {item.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor}`}>
                            {item.count}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{item.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
