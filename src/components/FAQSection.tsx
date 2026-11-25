import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatWaNumber } from './ContactSection';

const faqs = [
  {
    question: 'Bagaimana cara melakukan penyewaan?',
    answer: 'Anda dapat menekan tombol "Booking Sekarang", pilih paket yang sesuai, dan isi formulir pendaftaran. Admin akan memverifikasi data Anda maksimal 2x24 jam.'
  },
  {
    question: 'Apakah warga Huntap 2 mendapatkan harga khusus?',
    answer: 'Ya, warga Huntap Tondo 2 mendapatkan subsidi biaya atau tarif khusus untuk kegiatan sosial non-komersial. Silakan lampirkan KTP Huntap 2 saat pendaftaran.'
  },
  {
    question: 'Fasilitas apa saja yang sudah termasuk dalam sewa?',
    answer: 'Secara standar, sewa mencakup gedung utama, listrik standar, area parkir, toilet, dan 50 buah kursi. Untuk fasilitas tambahan seperti sound system besar atau genset dapat dikoordinasikan lebih lanjut.'
  },
  {
    question: 'Berapa kapasitas maksimal gedung?',
    answer: 'Gedung dapat menampung hingga 300 orang untuk format teater/rapat, dan sekitar 150-200 orang untuk format hajatan dengan meja.'
  },
  {
    question: 'Apakah boleh memasang dekorasi tambahan?',
    answer: 'Boleh, namun dilarang keras memaku dinding atau plafon. Kami menyarankan penggunaan stand dekorasi mandiri (self-standing).'
  },
  {
    question: 'Bagaimana jika saya ingin membatalkan booking?',
    answer: 'Pembatalan dapat diajukan melalui WhatsApp Admin. Harap baca halaman "Aturan & Prosedur" untuk detail kebijakan pengembalian dana (refund).'
  }
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const config = useAppStore(state => state.config);
  const adminWaNumber = formatWaNumber(config?.contactPhone);

  return (
    <section id="faq" className="py-12 sm:py-16 lg:py-20 bg-[#FCFCFD] border-b border-[#E5E7EB] scroll-mt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E40AF] mb-2">
            <HelpCircle className="w-4 h-4" strokeWidth={1.75} />
            <span>Pusat bantuan</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] tracking-tight mb-3">
            Tanya Jawab Seputar Sewa
          </h2>
          <p className="text-[#4B5563] text-sm sm:text-base">
            Beberapa hal yang paling sering ditanyakan oleh calon penyewa gedung.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-[#FCFCFD] rounded-2xl border border-[#E5E7EB] overflow-hidden transition-colors hover:border-[#1E40AF]/30"
            >
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full min-h-[44px] px-4 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 group cursor-pointer"
              >
                <span className="font-semibold text-[#111827] text-sm sm:text-base leading-snug group-hover:text-[#1E40AF] transition-colors">
                  {faq.question}
                </span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${openIdx === idx ? 'bg-[#1E40AF] text-white' : 'bg-[#F1F3F5] text-[#4B5563]'}`}>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openIdx === idx ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-1">
                      <div className="p-4 sm:p-5 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
                        <p className="text-[#4B5563] text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 p-5 sm:p-8 bg-[#FCFCFD] rounded-2xl border border-[#E5E7EB] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div className="text-left">
              <h4 className="text-base sm:text-lg font-semibold text-[#111827]">Masih belum menemukan jawaban?</h4>
              <p className="text-[#4B5563] text-xs sm:text-sm">Tim pengurus siap membantu Anda secara langsung via WhatsApp.</p>
            </div>
          </div>
          <a 
            href={`https://wa.me/${adminWaNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto min-h-[44px] inline-flex items-center justify-center px-6 py-3 bg-[#1E40AF] hover:bg-[#1D3A8A] text-white rounded-lg font-medium text-xs text-center transition-colors shrink-0"
          >
            Hubungi Pengurus
          </a>
        </div>
      </div>
    </section>
  );
}
