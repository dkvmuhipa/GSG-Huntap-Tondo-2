import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Star, 
  Send, 
  CheckCircle, 
  Quote, 
  Calendar, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { subscribeToApprovedFeedback, FeedbackItem, DEFAULT_APPROVED_FEEDBACK } from '../lib/db';
import { getLocalDateISO } from '../lib/dateUtils';

const EVENT_TYPES = [
  'Resepsi Pernikahan / Hajatan',
  'Musyawarah & Rapat Warga',
  'Pengajian & Keagamaan',
  'Olahraga & Kepemudaan',
  'Acara Umum / Keluarga'
];

export default function FeedbackSection() {
  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    comment: '',
    eventDate: '',
    eventType: EVENT_TYPES[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [reviews, setReviews] = useState<FeedbackItem[]>(DEFAULT_APPROVED_FEEDBACK);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const unsub = subscribeToApprovedFeedback((items) => {
      setReviews(items.length > 0 ? items : DEFAULT_APPROVED_FEEDBACK);
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: '5.0', count: 0 };
    const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return {
      avg: (total / reviews.length).toFixed(1),
      count: reviews.length
    };
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const feedbackPath = 'feedback';
    try {
      await addDoc(collection(db, feedbackPath), {
        name: formData.name.trim(),
        rating: Number(formData.rating),
        comment: formData.comment.trim(),
        eventDate: formData.eventDate || getLocalDateISO(),
        eventType: formData.eventType,
        status: 'pending', // Moderated by Admin before public display
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setFormData({
        name: '',
        rating: 5,
        comment: '',
        eventDate: '',
        eventType: EVENT_TYPES[0]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, feedbackPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const getInitials = (name: string) => {
    const parts = name.replace(/^(Kel\.|Bpk\.|Ibu|H\.|Hj\.|Panitia)\s*/gi, '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || 'WG').toUpperCase();
  };

  return (
    <section id="feedback" className="py-12 sm:py-16 lg:py-20 bg-[#F8F9FA] border-b border-[#E5E7EB] overflow-hidden scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Wall of Love & Community Testimonials (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E40AF]">
                  <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
                  <span>Suara & testimoni warga</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFFBEB] text-[#92400E] text-xs font-mono tabular-nums font-medium border border-[#FDE68A]">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{stats.avg} / 5.0</span>
                  <span className="text-[#B45309]">({stats.count} ulasan)</span>
                </div>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] tracking-tight leading-tight mb-4">
                Cerita Nyata dari Penyewa & Warga Huntap Tondo 2
              </h2>
              <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed">
                Setiap kegiatan meninggalkan kesan berharga. Berikut adalah pengalaman warga dan penyelenggara acara yang telah menggunakan fasilitas Gedung Serbaguna.
              </p>
            </div>

            {/* Featured Testimonial Spotlight Carousel */}
            {reviews.length > 0 && (
              <div className="relative bg-[#FCFCFD] rounded-2xl p-5 sm:p-8 border border-[#E5E7EB] overflow-hidden">
                <Quote className="w-10 h-10 text-[#111827]/8 absolute top-6 right-7 pointer-events-none" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={reviews[activeIndex]?.id || activeIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10"
                  >
                    <div className="flex items-center gap-1.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (reviews[activeIndex]?.rating || 5)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-[#D1D5DB]'
                          }`}
                        />
                      ))}
                      <span className="ml-2 px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E40AF] text-[11px] font-medium border border-[#BFDBFE]">
                        {reviews[activeIndex]?.eventType || 'Kegiatan Warga'}
                      </span>
                    </div>

                    <p className="text-[#111827] text-base sm:text-lg leading-relaxed mb-6">
                      "{reviews[activeIndex]?.comment}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-[#E5E7EB]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1E40AF] text-white font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                          {getInitials(reviews[activeIndex]?.name || 'Warga')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-[#111827] text-sm">
                              {reviews[activeIndex]?.name}
                            </h4>
                            <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" title="Penyewa Terverifikasi" />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[#6B7280] mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {reviews[activeIndex]?.eventDate
                                ? new Date(reviews[activeIndex].eventDate!).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })
                                : 'Arsip Kegiatan Gedung'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {reviews.length > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={prevSlide}
                            className="w-10 h-10 rounded-lg bg-[#F1F3F5] hover:bg-[#1E40AF] hover:text-white text-[#4B5563] flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Ulasan sebelumnya"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-mono tabular-nums text-[#6B7280] px-1">
                            {activeIndex + 1} / {reviews.length}
                          </span>
                          <button
                            type="button"
                            onClick={nextSlide}
                            className="w-10 h-10 rounded-lg bg-[#F1F3F5] hover:bg-[#1E40AF] hover:text-white text-[#4B5563] flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Ulasan selanjutnya"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Mini Testimonial Grid Cards */}
            {reviews.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviews
                  .filter((_, idx) => idx !== activeIndex)
                  .slice(0, 2)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        const targetIdx = reviews.findIndex((r) => r.id === item.id);
                        if (targetIdx !== -1) setActiveIndex(targetIdx);
                      }}
                      className="p-4 rounded-xl bg-[#FCFCFD] border border-[#E5E7EB] hover:border-[#1E40AF]/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: item.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-[11px] font-medium text-[#6B7280] group-hover:text-[#1E40AF] transition-colors">
                          {item.eventType || 'Acara Warga'}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] line-clamp-2 mb-3">
                        "{item.comment}"
                      </p>
                      <div className="flex items-center gap-2 text-xs font-medium text-[#111827]">
                        <Users className="w-3.5 h-3.5 text-[#1E40AF]" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Submission Form (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="bg-[#FCFCFD] rounded-2xl p-5 sm:p-8 text-[#1E293B] border border-[#E5E7EB] border-t-4 border-t-[#1E40AF] relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-center py-10"
                  >
                    <div className="w-14 h-14 bg-[#16A34A] text-white rounded-xl flex items-center justify-center mx-auto mb-5">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1E293B] mb-2">Terima Kasih</h3>
                    <p className="text-[#4B5563] text-sm leading-relaxed mb-7">
                      Ulasan dan masukan Anda telah kami terima. Setelah diverifikasi oleh pengurus RT 02, testimoni Anda akan ditampilkan di halaman publik ini.
                    </p>
                    <button 
                      onClick={() => setIsSuccess(false)}
                      className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#1E293B] font-medium text-xs transition-colors cursor-pointer"
                    >
                      Tulis Ulasan Lain
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div>
                      <span className="text-xs font-medium text-[#1E40AF] block mb-1">
                        Bagikan Pengalaman Anda
                      </span>
                      <h3 className="text-xl font-display font-bold text-[#1E293B]">Kirim Ulasan & Saran</h3>
                      <p className="text-xs text-[#4B5563] mt-1">
                        Bantu kami menjaga kualitas pelayanan dan kebersihan Gedung Serbaguna Huntap Tondo 2.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#374151] mb-2">
                        Penilaian Kepuasan
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating: star })}
                            className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors border cursor-pointer ${
                              formData.rating >= star 
                                ? 'bg-[#FEF3C7] text-[#B45309] border-[#F59E0B]' 
                                : 'bg-[#F8F9FA] text-[#94A3B8] border-[#E5E7EB] hover:bg-[#F1F3F5]'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${formData.rating >= star ? 'fill-[#F59E0B]' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1.5">
                          Nama Lengkap / Keluarga / Instansi
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full min-h-[44px] bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 text-sm text-[#1E293B] placeholder:text-[#6B7280] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
                          placeholder="Contoh: Kel. Bpk. Ahmad / Panitia Acara"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-medium text-[#374151] mb-1.5">
                            Jenis Acara
                          </label>
                          <select
                            value={formData.eventType}
                            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                            className="w-full min-h-[44px] bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-xs font-medium text-[#1E293B] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
                          >
                            {EVENT_TYPES.map((type) => (
                              <option key={type} value={type} className="bg-white text-[#1E293B]">
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#374151] mb-1.5">
                            Tanggal Acara
                          </label>
                          <input 
                            type="date" 
                            value={formData.eventDate}
                            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                            className="w-full min-h-[44px] bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-xs font-mono tabular-nums text-[#1E293B] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#374151] mb-1.5">
                          Komentar & Saran Membangun
                        </label>
                        <textarea 
                          rows={3}
                          required
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                          className="w-full bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg p-3.5 text-sm text-[#1E293B] placeholder:text-[#6B7280] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors resize-none"
                          placeholder="Ceritakan pengalaman Anda menggunakan fasilitas gedung..."
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-[44px] bg-[#1E40AF] hover:bg-[#1D3A8A] text-white py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Kirim Ulasan Sekarang
                        </>
                      )}
                    </button>
                  </form>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
