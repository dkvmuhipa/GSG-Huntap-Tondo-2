import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, ShieldCheck, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';
import { loginWithGoogle, loginWithGoogleRedirect, getRedirectLoginResult, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // 1. Listen for auth changes
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/admin');
      }
    });

    // 2. Handle redirect result on mount
    const checkRedirect = async () => {
      try {
        const result = await getRedirectLoginResult();
        if (result) {
          navigate('/admin');
        }
      } catch (err: any) {
        console.error("Redirect Error:", err);
        // Don't show error unless it's critical, as users might just be loading the page
      }
    };
    
    checkRedirect();
    return () => unsub();
  }, [navigate]);

  const handleLoginPopup = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      navigate('/admin');
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Popup ditutup sebelum login selesai. Jika popup diblokir, gunakan tombol 'Gunakan Redirect'.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Domain ini belum terdaftar di Authorized Domains Firebase Console.");
      } else {
        setError(err.message || "Gagal masuk. Silakan coba lagi.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginRedirect = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      setError("Gagal memulai redirect.");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-low flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-primary/10 border border-gray-100 max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20">
          <Building2 className="text-white w-10 h-10" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Login Admin</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Gunakan akun Google Anda untuk mengakses dashboard manajemen GSG Tondo 2.
        </p>

        {error && (
          <div className="mb-6 p-5 bg-red-50 text-red-600 rounded-3xl text-xs font-bold border border-red-100 flex items-start gap-4 text-left leading-relaxed">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {auth.currentUser ? (
          <button 
            onClick={() => navigate('/admin')}
            className="w-full bg-accent text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-accent/20 group"
          >
            Lanjut ke Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <div className="space-y-4">
            <button 
              onClick={handleLoginPopup}
              disabled={isLoggingIn}
              className="w-full bg-primary text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-lg shadow-primary/20 group disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-1" />
                  Masuk (Popup)
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button 
              onClick={handleLoginRedirect}
              disabled={isLoggingIn}
              className="w-full bg-white border-2 border-gray-100 text-gray-600 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4 opacity-50" />
              Masuk (Redirect)
            </button>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          Sistem Keamanan Terintegrasi
        </div>
      </motion.div>
    </div>
  );
}
