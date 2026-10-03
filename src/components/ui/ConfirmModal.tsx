import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  ShieldAlert, 
  ArrowRight 
} from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'info';
  isAlert?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  type = 'info',
  isAlert = false
}: ConfirmModalProps) {
  // Keyboard listeners: Escape to close, Enter to confirm
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        onConfirm();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  const config = {
    danger: {
      badgeBg: 'bg-rose-50 border-rose-200/80 text-rose-600',
      glowBg: 'bg-rose-500/10',
      icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
      btnClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25 text-white',
      accentBorder: 'border-t-rose-500'
    },
    success: {
      badgeBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-600',
      glowBg: 'bg-emerald-500/10',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 text-white',
      accentBorder: 'border-t-emerald-500'
    },
    info: {
      badgeBg: 'bg-blue-50 border-blue-200/80 text-primary',
      glowBg: 'bg-blue-500/10',
      icon: <Info className="w-6 h-6 text-primary" />,
      btnClass: 'bg-primary hover:bg-blue-800 shadow-primary/25 text-white',
      accentBorder: 'border-t-primary'
    }
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl shadow-slate-950/20 border border-slate-100 overflow-hidden z-10 border-t-4 ${config.accentBorder}`}
          >
            {/* Ambient Background Glow */}
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full ${config.glowBg} blur-3xl pointer-events-none -mr-12 -mt-12`} />

            <div className="p-7 sm:p-8 relative z-10">
              {/* Header with Icon Badge & Close Button */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className={`w-13 h-13 rounded-2xl p-3 border flex items-center justify-center shadow-sm shrink-0 ${config.badgeBg}`}>
                  {config.icon}
                </div>

                <button 
                  onClick={onClose}
                  type="button"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Body Message */}
              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                  {title}
                </h3>
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {message.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i !== message.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-3 pt-2">
                {!isAlert && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
                  >
                    {cancelText}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`${isAlert ? 'w-full' : 'flex-1'} px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] ${config.btnClass}`}
                >
                  {isAlert ? 'Mengerti' : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
