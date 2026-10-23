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
        eventDate: formData.eventDate || new Date().toISOString().split('T')[0],
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
    <section id="feedback" className="py-24 bg-gradient-to-b from-white via-slate-50/60 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          
          {/* Left Column: Wall of Love & Community Testimonials (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200/70">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Suara & Testimoni Warga
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-black border border-amber-200/70">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{stats.avg} / 5.0</span>
                  <span className="text-amber-600/80 font-bold text-[10px]">({stats.count} Ulasan)</span>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                Cerita Nyata dari <span className="text-primary italic">Penyewa & Warga Huntap Tondo 2</span>
              </h2>
              <p className="text-gray-500 font-medium text-base sm:text-lg leading-relaxed">
                Setiap kegiatan meninggalkan kesan berharga. Berikut adalah pengalaman warga dan penyelenggara acara yang telah menggunakan fasilitas Gedung Serbaguna.
              </p>
            </div>

            {/* Featured Testimonial Spotlight Carousel */}
            {reviews.length > 0 && (
              <div className="relative bg-white rounded-[2.5rem] p-6 sm:p-9 border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/5 rounded-full pointer-events-none" />
                <Quote className="w-12 h-12 text-primary/10 absolute top-6 right-8 pointer-events-none" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={reviews[activeIndex]?.id || activeIndex}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    className="relative z-10"
                  >
                    <div className="flex items-center gap-1.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (reviews[activeIndex]?.rating || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                      <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-primary text-[10px] font-black uppercase tracking-wider border border-blue-100">
                        {reviews[activeIndex]?.eventType || 'Kegiatan Warga'}
                      </span>
                    </div>

                    <p className="text-slate-700 font-medium text-base sm:text-lg leading-relaxed mb-6 italic">
                      "{reviews[activeIndex]?.comment}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-white font-black text-xs flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                          {getInitials(reviews[activeIndex]?.name || 'Warga')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-slate-900 text-sm">
                              {reviews[activeIndex]?.name}
                            </h4>
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="Penyewa Terverifikasi" />
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold mt-0.5">
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
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-600 flex items-center justify-center transition-colors"
                            aria-label="Ulasan sebelumnya"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[11px] font-black text-slate-400 px-1.5">
                            {activeIndex + 1} / {reviews.length}
                          </span>
                          <button
                            type="button"
                            onClick={nextSlide}
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-600 flex items-center justify-center transition-colors"
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
                      className="p-5 rounded-3xl bg-white border border-slate-100 hover:border-primary/30 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: item.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 group-hover:text-primary transition-colors">
                          {item.eventType || 'Acara Warga'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 mb-3 italic">
                        "{item.comment}"
                      </p>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-900">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Submission Form (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="bg-slate-900 rounded-[2.75rem] p-7 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Terima Kasih!</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                      Ulasan dan masukan Anda telah kami terima. Setelah diverifikasi oleh pengurus RT 02, testimoni Anda akan ditampilkan di halaman publik ini.
                    </p>
                    <button 
                      onClick={() => setIsSuccess(false)}
                      className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-widest transition-all"
                    >
                      Tulis Ulasan Lain
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Bagikan Pengalaman Anda
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">Kirim Ulasan & Saran</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Bantu kami menjaga kualitas pelayanan dan kebersihan Gedung Serbaguna Huntap Tondo 2.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                        Penilaian Kepuasan
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating: star })}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                              formData.rating >= star 
                                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-105' 
                                : 'bg-white/5 text-slate-500 hover:bg-white/10'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${formData.rating >= star ? 'fill-slate-950' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Nama Lengkap / Keluarga / Instansi
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-colors"
                          placeholder="Contoh: Kel. Bpk. Ahmad / Panitia Acara"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            Jenis Acara
                          </label>
                          <select
                            value={formData.eventType}
                            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                            className="w-full bg-slate-800 border border-white/10 rounded-2xl px-3.5 py-3 text-xs font-bold text-white focus:border-primary outline-none transition-colors"
                          >
                            {EVENT_TYPES.map((type) => (
                              <option key={type} value={type} className="bg-slate-900 text-white">
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            Tanggal Acara
                          </label>
                          <input 
                            type="date" 
                            value={formData.eventDate}
                            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-3.5 py-3 text-xs text-white focus:border-primary outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          Komentar & Saran Membangun
                        </label>
                        <textarea 
                          rows={3}
                          required
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-primary outline-none transition-colors resize-none"
                          placeholder="Ceritakan pengalaman Anda menggunakan fasilitas gedung..."
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
