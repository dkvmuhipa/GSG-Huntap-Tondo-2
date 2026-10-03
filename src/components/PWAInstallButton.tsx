import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'compact' | 'footer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide install trigger
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop standard install
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={install}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-primary text-xs font-bold hover:bg-blue-100 transition-colors w-full"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Install Aplikasi (PWA)</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all"
        title="Install Aplikasi ke Layar Utama"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'compact' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-primary text-xs font-bold hover:bg-blue-100 transition-colors w-full"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Pasang di iPhone / iPad</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Install di iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 mb-2">Pasang di Layar Utama iPhone</h3>
              <p className="text-xs text-gray-500 leading-relaxed space-y-2">
                1. Ketuk tombol <strong className="text-gray-800">Bagikan (Share)</strong> di bagian bawah Safari.<br />
                2. Gulir ke bawah dan pilih <strong className="text-gray-800">Tambahkan ke Layar Utama (Add to Home Screen)</strong>.<br />
                3. Ketuk <strong className="text-primary font-bold">Tambah</strong> di pojok kanan atas.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-2xl bg-primary text-white py-3 text-xs font-bold shadow-md shadow-primary/20"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
