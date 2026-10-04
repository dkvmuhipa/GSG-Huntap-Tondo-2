import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // Check if already installed / running in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    if (isAppleDevice) {
      setIsIOS(true);
    }

    // Capture Android/Desktop Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // If already installed or dismissed, do not render
  if (isInstalled || isDismissed) return null;
  // If neither deferredPrompt is captured nor iOS device, do not render
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      {/* Floating Bottom Quick Install Banner */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-40 bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-blue-100 flex items-center justify-between gap-3 text-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 leading-tight">Install Aplikasi GSG</h4>
              <p className="text-[11px] text-gray-500 leading-snug">
                Akses reservasi & jadwal lebih cepat dari layar utama HP Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white font-black text-xs transition-all shadow-md shadow-primary/20 active:scale-95 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* iOS Safari instructions modal */}
      <AnimatePresence>
        {showIOSTip && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto mb-4">
                <Share className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900 mb-2">Tambahkan ke Layar Utama</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                Di peramban Safari iPhone/iPad:
                <br />
                1. Ketuk tombol <span className="font-bold text-gray-800">Bagikan (Share)</span> di bilah bawah peramban.
                <br />
                2. Gulir ke bawah lalu pilih <span className="font-bold text-primary">"Tambahkan ke Layar Utama"</span> (+).
              </p>
              <button
                type="button"
                onClick={() => setShowIOSTip(false)}
                className="w-full py-2.5 rounded-2xl bg-gray-900 text-white font-bold text-xs"
              >
                Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
