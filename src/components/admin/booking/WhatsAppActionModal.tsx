import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  X, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  User, 
  Calendar 
} from 'lucide-react';
import { 
  createWhatsAppUrl, 
  generateBookingApprovalMessage, 
  generatePaymentReminderMessage, 
  generatePaymentReceiptMessage 
} from '../../../lib/whatsapp';

interface WhatsAppActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  config?: any;
}

export default function WhatsAppActionModal({
  isOpen,
  onClose,
  booking,
  config
}: WhatsAppActionModalProps) {
  const [activeTemplate, setActiveTemplate] = useState<'approval' | 'reminder' | 'receipt'>('approval');
  const [customMessage, setCustomMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!booking) return;

    // Set default active template based on payment/booking status
    if (booking.paymentStatus === 'paid') {
      setActiveTemplate('receipt');
      setCustomMessage(generatePaymentReceiptMessage(booking, config));
    } else if (booking.status === 'approved') {
      setActiveTemplate('reminder');
      setCustomMessage(generatePaymentReminderMessage(booking, config));
    } else {
      setActiveTemplate('approval');
      setCustomMessage(generateBookingApprovalMessage(booking, config));
    }
  }, [booking, config, isOpen]);

  const handleTemplateChange = (tmpl: 'approval' | 'reminder' | 'receipt') => {
    setActiveTemplate(tmpl);
    if (!booking) return;
    if (tmpl === 'approval') {
      setCustomMessage(generateBookingApprovalMessage(booking, config));
    } else if (tmpl === 'reminder') {
      setCustomMessage(generatePaymentReminderMessage(booking, config));
    } else {
      setCustomMessage(generatePaymentReceiptMessage(booking, config));
    }
  };

  const handleCopy = () => {
    if (!customMessage) return;
    navigator.clipboard.writeText(customMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!booking?.phone || !customMessage) return;
    const url = createWhatsAppUrl(booking.phone, customMessage);
    window.open(url, '_blank');
  };

  if (!isOpen || !booking) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-gray-100 p-6 sm:p-8 relative my-auto overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Kirim Pesan WhatsApp</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {booking.customerName} • <span className="font-mono text-emerald-700">{booking.phone}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Template Selector Tabs */}
          <div className="mt-6">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">
              Pilih Template Notifikasi
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
              <button
                type="button"
                onClick={() => handleTemplateChange('approval')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTemplate === 'approval' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="truncate">Persetujuan</span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('reminder')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTemplate === 'reminder' 
                    ? 'bg-white text-amber-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="truncate">Tagihan</span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('receipt')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTemplate === 'receipt' 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="truncate">Bukti Lunas</span>
              </button>
            </div>
          </div>

          {/* Interactive Message Preview & Editor */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Pratinjau / Sunting Teks Pesan
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] font-bold text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin Teks</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={9}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-mono text-gray-800 leading-relaxed outline-none focus:border-emerald-500 transition-all resize-none shadow-inner"
              placeholder="Tulis pesan untuk pemesan..."
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto flex-1 py-3 px-5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full sm:w-auto flex-2 py-3 px-6 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Buka WhatsApp & Kirim
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
