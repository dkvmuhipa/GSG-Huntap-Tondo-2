import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Star, Send, CheckCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function FeedbackSection() {
  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    comment: '',
    eventDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        ...formData,
        status: 'pending', // Admins need to approve for display
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setFormData({ name: '', rating: 5, comment: '', eventDate: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="feedback" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Info Side */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100 mb-6">
              <MessageSquare className="w-4 h-4" />
              Suara Penyewa
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              Bagaimana Pengalaman Anda di <span className="text-primary italic">GSG Tondo 2?</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed mb-8">
              Masukan Anda sangat berharga bagi kami untuk terus meningkatkan kualitas fasilitas dan pelayanan gedung pembangunan warga ini.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 rounded-3xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary">
                  <Star className="w-6 h-6 fill-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Evaluasi Pelayanan</h4>
                  <p className="text-sm text-gray-400 mt-1">Kami meninjau setiap masukan untuk perbaikan kebersihan, keamanan, dan administrasi.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 rounded-3xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Transparansi Publik</h4>
                  <p className="text-sm text-gray-400 mt-1">Ulasan yang disetujui akan ditampilkan sebagai bentuk transparansi kualitas gedung.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="relative">
            <div className="bg-gray-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Terima Kasih!</h3>
                    <p className="text-gray-400 font-medium italic mb-8">Masukan Anda telah kami terima dan akan segera ditinjau oleh tim admin.</p>
                    <button 
                      onClick={() => setIsSuccess(false)}
                      className="text-primary font-black text-sm uppercase tracking-widest hover:underline"
                    >
                      Kirim Pesan Lain
                    </button>
                  </motion.div>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit} 
                    className="space-y-6 relative z-10"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nama Lengkap</label>
                        <input 
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Nama Anda"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/40 outline-none transition-all font-bold placeholder:text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tanggal Acara</label>
                        <input 
                          required
                          type="date"
                          value={formData.eventDate}
                          onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Rating Layanan</label>
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button 
                            key={num}
                            type="button"
                            onClick={() => setFormData({...formData, rating: num})}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.rating >= num ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-500'}`}
                          >
                            <Star className={`w-5 h-5 ${formData.rating >= num ? 'fill-white' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ulasan / Kritik / Saran</label>
                      <textarea 
                        required
                        value={formData.comment}
                        onChange={(e) => setFormData({...formData, comment: e.target.value})}
                        rows={4}
                        placeholder="Berikan ulasan jujur Anda tentang fasilitas, kebersihan, atau pelayanan kami..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/40 outline-none transition-all font-bold placeholder:text-gray-600 resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          KIRIM ULASAN
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
            
            {/* Decoration */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary rounded-full blur-3xl opacity-20 pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  );
}
