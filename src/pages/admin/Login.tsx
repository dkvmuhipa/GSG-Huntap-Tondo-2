import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink, 
  AlertCircle, 
  ArrowLeft,
  Lock,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithGoogleRedirect, 
  getRedirectLoginResult, 
  auth, 
  logout, 
  checkIsAdminAuthorized 
} from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Login() {
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Handle redirect result on mount if coming back from Google redirect
    const checkRedirect = async () => {
      try {
        const result = await getRedirectLoginResult();
        if (result && result.user) {
          setIsVerifying(true);
          const { authorized } = await checkIsAdminAuthorized(result.user);
          if (!isMounted) return;

          if (authorized) {
            navigate('/admin', { replace: true });
            return;
          } else {
            const rejectedEmail = result.user.email || 'Email Anda';
            await logout();
            setError(`Akses Ditolak: Akun Google (${rejectedEmail}) belum terdaftar sebagai pengurus atau administrator Gedung Serbaguna Huntap Tondo 2. Silakan hubungi Administrator atau Ketua RT untuk mendaftarkan akun Anda.`);
          }
        }
      } catch (err: any) {
        console.error("Redirect Error:", err);
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };
    
    checkRedirect();

    // 2. Listen for auth changes
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      if (currentUser) {
        setIsVerifying(true);
        const { authorized } = await checkIsAdminAuthorized(currentUser);
        if (!isMounted) return;

        if (authorized) {
          navigate('/admin', { replace: true });
        } else {
          const rejectedEmail = currentUser.email || 'Email Anda';
          await logout();
          setError(`Akses Ditolak: Akun Google (${rejectedEmail}) belum terdaftar sebagai pengurus atau administrator Gedung Serbaguna Huntap Tondo 2. Silakan hubungi Administrator atau Ketua RT untuk mendaftarkan akun Anda.`);
          setIsVerifying(false);
        }
      } else {
        setIsVerifying(false);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [navigate]);

  const handleLoginPopup = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setIsVerifying(true);
        const { authorized } = await checkIsAdminAuthorized(user);
        if (authorized) {
          navigate('/admin', { replace: true });
        } else {
          const rejectedEmail = user.email || 'Email Anda';
          await logout();
          setError(`Akses Ditolak: Akun Google (${rejectedEmail}) belum terdaftar sebagai pengurus atau administrator Gedung Serbaguna Huntap Tondo 2. Silakan hubungi Administrator atau Ketua RT untuk mendaftarkan akun Anda.`);
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Jendela login ditutup sebelum selesai. Jika popup diblokir oleh browser, gunakan tombol 'Masuk (Redirect)'.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Domain ini belum terdaftar di Authorized Domains Firebase Console.");
      } else {
        setError(err.message || "Gagal masuk. Silakan coba kembali.");
      }
    } finally {
      setIsLoggingIn(false);
      setIsVerifying(false);
    }
  };

  const handleLoginRedirect = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      console.error("Redirect Trigger Error:", err);
      setError("Gagal memulai proses login redirect. Pastikan koneksi internet stabil.");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl sm:rounded-[2.5rem] p-7 sm:p-10 shadow-2xl shadow-slate-950/40 border border-slate-100 max-w-md w-full text-center relative z-10"
      >
        {/* Top Badges */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-primary text-[10px] font-black uppercase tracking-wider mb-6">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Portal Administrasi GSG</span>
        </div>

        {/* Hero Icon */}
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary/25 text-white">
          <Building2 className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Login Pengurus
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mb-6 leading-relaxed">
          Gunakan akun Google yang telah didaftarkan untuk mengelola reservasi, kas warga, dan aset gedung.
        </p>

        {/* Error Notification Alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="mb-6 p-4 bg-rose-50 text-rose-800 rounded-2xl text-xs font-semibold border border-rose-200/90 text-left space-y-2 shadow-xs"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-black text-rose-900 mb-0.5">Akses Khusus Pengurus</p>
                  <p className="text-[11px] text-rose-700">{error}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[10px]">
                <span className="text-rose-600 font-bold">Butuh bantuan pendaftaran?</span>
                <a 
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20GSG,%20mohon%20bantuan%20pendaftaran%20email%20saya%20ke%20sistem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-900 hover:text-rose-950 font-black underline flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3" />
                  Hubungi RT
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verifying Status */}
        {isVerifying ? (
          <div className="py-8 space-y-3">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Memverifikasi hak akses administrator...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Google Sign-in Buttons */}
            <button 
              onClick={handleLoginPopup}
              disabled={isLoggingIn}
              className="w-full bg-primary hover:bg-blue-800 text-white py-3.5 sm:py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-primary/20 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses Login...</span>
                </>
              ) : (
                <>
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="w-4 h-4 bg-white rounded-full p-0.5" 
                  />
                  <span>Masuk dengan Google</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>

            <button 
              onClick={handleLoginRedirect}
              disabled={isLoggingIn}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 py-3 px-5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              title="Gunakan bila browser Anda memblokir popup Google"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Gunakan Mode Redirect</span>
            </button>

            {/* Back to Home Citizen */}
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors py-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda Warga</span>
              </Link>
            </div>
          </div>
        )}

        {/* Security Badge */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Sistem Otorisasi RBAC & Firebase Security</span>
        </div>
      </motion.div>
    </div>
  );
}
