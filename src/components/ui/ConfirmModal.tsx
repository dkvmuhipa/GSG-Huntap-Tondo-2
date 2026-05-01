import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

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
  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'success': return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      default: return <Info className="w-8 h-8 text-primary" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 shadow-red-200/50';
      case 'success': return 'bg-green-500 hover:bg-green-600 shadow-green-200/50';
      default: return 'bg-primary hover:bg-blue-800 shadow-primary/20';
    }
  };

  const getHeaderClass = () => {
    switch (type) {
      case 'danger': return 'bg-red-50';
      case 'success': return 'bg-green-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className={`p-8 ${getHeaderClass()} flex items-center gap-4`}>
              <div className="shrink-0">
                {getIcon()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-gray-900 leading-tight">{title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8">
              <p className="text-gray-600 font-medium leading-relaxed mb-8">
                {message.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== message.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
              
              <div className="flex gap-3">
                {!isAlert && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black text-sm hover:bg-gray-200 transition-all uppercase tracking-widest"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`${isAlert ? 'w-full' : 'flex-1'} px-6 py-4 rounded-2xl text-white font-black text-sm transition-all uppercase tracking-widest shadow-xl ${getButtonClass()} active:scale-95`}
                >
                  {isAlert ? 'OK' : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
