import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Receipt, 
  Calendar, 
  User, 
  Building2, 
  ArrowLeft, 
  Clock, 
  Search, 
  ExternalLink,
  Lock
} from 'lucide-react';

export default function DocumentVerification() {
  const [searchParams] = useSearchParams();
  const idFromUrl = searchParams.get('id') || '';
  const typeFromUrl = searchParams.get('type') || '';

  const [searchId, setSearchId] = useState(idFromUrl);
  const [docData, setDocData] = useState<any>(null);
  const [docType, setDocType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearched, setIsSearched] = useState(false);

  const verifyDocument = async (targetId: string, preferredType?: string) => {
    if (!targetId.trim()) {
      setIsLoading(false);
      setDocData(null);
      return;
    }

    setIsLoading(true);
    setIsSearched(true);
    setDocData(null);
    const cleanId = targetId.trim();

    try {
      // 1. Try checking 'bookings' collection
      if (!preferredType || preferredType === 'booking' || preferredType === 'contract') {
        const bookingRef = doc(db, 'bookings', cleanId);
        const bookingSnap = await getDoc(bookingRef);
        if (bookingSnap.exists()) {
          setDocData({ id: bookingSnap.id, ...bookingSnap.data() });
          setDocType('booking');
          setIsLoading(false);
          return;
        }

        // Try lookup by receiptNo or partial id
        const bq = query(collection(db, 'bookings'), where('receiptNo', '==', cleanId));
        const bSnap = await getDocs(bq);
        if (!bSnap.empty) {
          const docItem = bSnap.docs[0];
          setDocData({ id: docItem.id, ...docItem.data() });
          setDocType('booking');
          setIsLoading(false);
          return;
        }
      }

      // 2. Try checking 'transactions' collection
      if (!preferredType || preferredType === 'receipt') {
        const txRef = doc(db, 'transactions', cleanId);
        const txSnap = await getDoc(txRef);
        if (txSnap.exists()) {
          setDocData({ id: txSnap.id, ...txSnap.data() });
          setDocType('transaction');
          setIsLoading(false);
          return;
        }

        // Try lookup by receiptNo in transactions
        const tq = query(collection(db, 'transactions'), where('receiptNo', '==', cleanId));
        const tSnap = await getDocs(tq);
        if (!tSnap.empty) {
          const docItem = tSnap.docs[0];
          setDocData({ id: docItem.id, ...docItem.data() });
          setDocType('transaction');
          setIsLoading(false);
          return;
        }
      }

      // If preferredType was specified but not found, try fallback search in both
      if (preferredType) {
        // Fallback check bookings
        const bFallback = await getDoc(doc(db, 'bookings', cleanId));
        if (bFallback.exists()) {
          setDocData({ id: bFallback.id, ...bFallback.data() });
          setDocType('booking');
          setIsLoading(false);
          return;
        }
        // Fallback check transactions
        const tFallback = await getDoc(doc(db, 'transactions', cleanId));
        if (tFallback.exists()) {
          setDocData({ id: tFallback.id, ...tFallback.data() });
          setDocType('transaction');
          setIsLoading(false);
          return;
        }
      }

      // Not found
      setDocData(null);
    } catch (err) {
      console.error('Error verifying document:', err);
      setDocData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (idFromUrl) {
      verifyDocument(idFromUrl, typeFromUrl);
    } else {
      setIsLoading(false);
    }
  }, [idFromUrl, typeFromUrl]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    verifyDocument(searchId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-100 py-4 px-6 sm:px-12 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">GSG Huntap Tondo 2</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sistem Verifikasi Dokumen Resmi</p>
            </div>
          </Link>

          <Link 
            to="/" 
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary transition-colors py-2 px-3 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Portal Warga</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl w-full mx-auto px-4 py-8 sm:py-12 flex-1">
        {/* Verification Result Card */}
        {isLoading ? (
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-black text-gray-900">Memeriksa Keaslian Dokumen...</h2>
            <p className="text-xs text-gray-400">Menghubungkan ke pangkalan data resmi GSG Huntap Tondo 2</p>
          </div>
        ) : docData ? (
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-emerald-100 overflow-hidden relative">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white text-center relative overflow-hidden">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20 shadow-inner">
                <ShieldCheck className="w-10 h-10 text-emerald-300" />
              </div>
              <span className="inline-block px-4 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-black uppercase tracking-widest border border-emerald-400/30 mb-2">
                Terverifikasi Sah & Asli
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Dokumen Resmi Terdaftar</h2>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-md mx-auto">
                Tercatat sah dalam pangkalan data digital Pengurus Gedung Serbaguna Huntap Tondo 2.
              </p>
            </div>

            {/* Document Details Body */}
            <div className="p-6 sm:p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100 text-left">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Jenis Dokumen</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5">
                    {docType === 'transaction' 
                      ? 'Kwitansi Keuangan' 
                      : (docData.paymentStatus === 'paid' ? 'Kuitansi & Perjanjian Sewa' : 'Surat Reservasi Gedung')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nomor Dokumen / Reg</p>
                  <p className="text-sm font-black text-indigo-700 mt-0.5 font-mono">
                    {docData.receiptNo || `#${docData.id.substring(0, 10).toUpperCase()}`}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-gray-400">
                    <User className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-gray-500">Nama Penerima / Pemesan:</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-gray-900 text-right">
                    {docData.customerName || docData.source || 'Warga GSG'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-gray-400">
                    <Receipt className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-gray-500">Keperluan / Acara:</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-gray-900 text-right">
                    {docData.purpose || docData.notes || docData.category?.toUpperCase() || '-'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-gray-400">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-gray-500">Tanggal Pelaksanaan:</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-gray-900 text-right">
                    {docData.startDate || docData.eventDate || docData.date || '-'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-gray-400">
                    <Lock className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-gray-500">Nominal Transaksi:</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-emerald-600 text-right">
                    Rp {Math.abs(Number(docData.amount || 0)).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-gray-500">Status Validasi:</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider">
                    {docData.paymentStatus === 'paid' || docData.status === 'completed' ? 'Lunas / Sah' : 'Terdaftar (Pending)'}
                  </span>
                </div>
              </div>

              {/* Security Seal Note */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-3 mt-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  Dokumen ini telah divalidasi keasliannya melalui tanda tangan elektronik terdaftar. Pihak penyewa dan pengurus berhak menggunakan dokumen ini sebagai tanda bukti sah.
                </p>
              </div>
            </div>
          </div>
        ) : isSearched ? (
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-rose-100 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Dokumen Tidak Ditemukan</h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
              Nomor dokumen atau ID registrasi <span className="font-mono font-bold text-rose-600">{searchId}</span> tidak ditemukan pada pangkalan data resmi GSG Huntap Tondo 2.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => setSearchId('')} 
                className="text-xs font-bold text-primary hover:underline"
              >
                Coba nomor lain
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-gray-100 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">Verifikasi Dokumen Resmi</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Masukkan Nomor Kuitansi atau ID Registrasi Booking yang tertera pada lembar dokumen Anda.
              </p>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Contoh: KWT-2026-10-001..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold focus:border-primary outline-none transition-all uppercase"
                />
              </div>
              <button 
                type="submit" 
                className="px-6 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Cek
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        <p>© {new Date().getFullYear()} Gedung Serbaguna Huntap Tondo 2. Validasi Dokumen Digital & Transparansi Aset Warga.</p>
      </footer>
    </div>
  );
}
