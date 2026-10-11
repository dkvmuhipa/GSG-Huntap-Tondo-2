import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader } from 'lucide-react';
import { uploadToCloudinary } from '../../../lib/cloudinary';

interface ReportSignaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  onSave: (data: {
    reportFinanceName: string;
    reportBendaharaName: string;
    reportFinanceSignature: string | null;
    reportBendaharaSignature: string | null;
    receiptSignatureMode: string;
  }) => Promise<void>;
  onErrorAlert?: (title: string, message: string) => void;
}

export default function ReportSignaturesModal({
  isOpen,
  onClose,
  config,
  onSave,
  onErrorAlert
}: ReportSignaturesModalProps) {
  const [localFinanceName, setLocalFinanceName] = useState('');
  const [localBendaharaName, setLocalBendaharaName] = useState('');
  const [localFinanceSig, setLocalFinanceSig] = useState<string | null>(null);
  const [localBendaharaSig, setLocalBendaharaSig] = useState<string | null>(null);
  const [localReceiptSignatureMode, setLocalReceiptSignatureMode] = useState('both');
  
  const [isUploadingFinance, setIsUploadingFinance] = useState(false);
  const [isUploadingBendahara, setIsUploadingBendahara] = useState(false);
  const [dragActiveFinance, setDragActiveFinance] = useState(false);
  const [dragActiveBendahara, setDragActiveBendahara] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalFinanceName(config?.reportFinanceName || '');
      setLocalBendaharaName(config?.reportBendaharaName || '');
      setLocalFinanceSig(config?.reportFinanceSignature || null);
      setLocalBendaharaSig(config?.reportBendaharaSignature || null);
      setLocalReceiptSignatureMode(config?.receiptSignatureMode || 'both');
    }
  }, [isOpen, config]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignatureUpload = async (file: File, type: 'finance' | 'bendahara') => {
    if (file.size > 2 * 1024 * 1024) {
      onErrorAlert?.('Ukuran Berkas Terlalu Besar', 'Batas maksimal ukuran berkas tanda tangan adalah 2MB.');
      return;
    }

    try {
      if (type === 'finance') setIsUploadingFinance(true);
      else setIsUploadingBendahara(true);

      const url = await uploadToCloudinary(file);
      if (type === 'finance') {
        setLocalFinanceSig(url);
      } else {
        setLocalBendaharaSig(url);
      }
    } catch (err: any) {
      onErrorAlert?.('Gagal Mengunggah Berkas', err?.message || 'Terjadi kesalahan saat mengunggah gambar ke server.');
    } finally {
      if (type === 'finance') setIsUploadingFinance(false);
      else setIsUploadingBendahara(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave({
        reportFinanceName: localFinanceName,
        reportBendaharaName: localBendaharaName,
        reportFinanceSignature: localFinanceSig,
        reportBendaharaSignature: localBendaharaSig,
        receiptSignatureMode: localReceiptSignatureMode
      });
      onClose();
    } catch (err: any) {
      onErrorAlert?.('Gagal Menyimpan', err?.message || 'Terjadi kesalahan saat menyimpan pengaturan laporan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl overflow-hidden relative my-6 border border-slate-100"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-primary to-blue-600" />
        
        <div className="flex justify-between items-start mb-6 pt-1">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 inline-block mb-1.5">
              Format Berkas PDF Resmi
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Pengaturan Laporan & Tanda Tangan</h3>
            <p className="text-slate-500 text-xs mt-0.5">Nama penandatangan & gambar tanda tangan digital transparan pada lembar laporan keuangan.</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            {/* Administrasi Keuangan block */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-md tracking-wider uppercase border border-indigo-150">
                  Pihak 1 (Pembuat)
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Adm. Keuangan</span>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Petugas Keuangan
                </label>
                <input 
                  type="text"
                  value={localFinanceName}
                  onChange={(e) => setLocalFinanceName(e.target.value)}
                  placeholder="Contoh: Safira S.Ak."
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Tanda Tangan Digital (Transparan)
                </label>
                
                {isUploadingFinance ? (
                  <div className="border border-dashed border-indigo-200 rounded-xl p-6 bg-white flex flex-col items-center justify-center text-indigo-600">
                    <Loader className="w-5 h-5 animate-spin mb-1.5" />
                    <span className="text-[10px] font-bold">Mengunggah...</span>
                  </div>
                ) : localFinanceSig ? (
                  <div className="relative border border-dashed border-indigo-200 rounded-xl p-3 bg-white flex flex-col items-center justify-center shadow-xs">
                    <img 
                      src={localFinanceSig} 
                      alt="Tanda Tangan Administrasi"
                      className="max-h-20 object-contain mb-2 bg-slate-50/50 border border-slate-100 p-1.5 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setLocalFinanceSig(null)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-black uppercase tracking-wider transition-colors"
                    >
                      Hapus Tanda Tangan
                    </button>
                  </div>
                ) : (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragActiveFinance(true); }}
                    onDragLeave={() => setDragActiveFinance(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActiveFinance(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleSignatureUpload(file, 'finance');
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white ${
                      dragActiveFinance ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400'
                    }`}
                    onClick={() => document.getElementById('financeSigInputModal')?.click()}
                  >
                    <Upload className="w-4 h-4 text-slate-400 mb-1" />
                    <span className="text-[11px] font-bold text-slate-700">Pilih atau Seret Gambar</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">PNG Transparan disarankan</span>
                    <input 
                      id="financeSigInputModal"
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSignatureUpload(file, 'finance');
                      }}
                      className="hidden" 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bendahara block */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-md tracking-wider uppercase border border-emerald-150">
                  Pihak 2 (Mengetahui)
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Bendahara / RT</span>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Bendahara / Ketua RT
                </label>
                <input 
                  type="text"
                  value={localBendaharaName}
                  onChange={(e) => setLocalBendaharaName(e.target.value)}
                  placeholder="Contoh: Bpk. H. Ahmad Fauzi"
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Tanda Tangan Digital (Transparan)
                </label>
                
                {isUploadingBendahara ? (
                  <div className="border border-dashed border-emerald-200 rounded-xl p-6 bg-white flex flex-col items-center justify-center text-emerald-600">
                    <Loader className="w-5 h-5 animate-spin mb-1.5" />
                    <span className="text-[10px] font-bold">Mengunggah...</span>
                  </div>
                ) : localBendaharaSig ? (
                  <div className="relative border border-dashed border-emerald-200 rounded-xl p-3 bg-white flex flex-col items-center justify-center shadow-xs">
                    <img 
                      src={localBendaharaSig} 
                      alt="Tanda Tangan Bendahara"
                      className="max-h-20 object-contain mb-2 bg-slate-50/50 border border-slate-100 p-1.5 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setLocalBendaharaSig(null)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-black uppercase tracking-wider transition-colors"
                    >
                      Hapus Tanda Tangan
                    </button>
                  </div>
                ) : (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragActiveBendahara(true); }}
                    onDragLeave={() => setDragActiveBendahara(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActiveBendahara(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleSignatureUpload(file, 'bendahara');
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white ${
                      dragActiveBendahara ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-400'
                    }`}
                    onClick={() => document.getElementById('bendaharaSigInputModal')?.click()}
                  >
                    <Upload className="w-4 h-4 text-slate-400 mb-1" />
                    <span className="text-[11px] font-bold text-slate-700">Pilih atau Seret Gambar</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">PNG Transparan disarankan</span>
                    <input 
                      id="bendaharaSigInputModal"
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSignatureUpload(file, 'bendahara');
                      }}
                      className="hidden" 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2">
              Pilihan Tanda Tangan pada Kuitansi PDF
            </label>
            <select 
              value={localReceiptSignatureMode}
              onChange={(e) => setLocalReceiptSignatureMode(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition-all text-xs cursor-pointer"
            >
              <option value="both">Tampilkan Keduanya (Administrasi Keuangan & Bendahara)</option>
              <option value="finance">Tampilkan Administrasi Keuangan Saja</option>
              <option value="bendahara">Tampilkan Bendahara Saja</option>
            </select>
          </div>

          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-[11px] text-indigo-800 font-medium leading-relaxed">
            💡 <span className="font-bold">Tips Kejernihan PDF:</span> Menggunakan gambar tanda tangan digital berlatar belakang transparan (format PNG) akan memberikan hasil cetak paling presisi tanpa menutupi cap stempel fisik dokumen RT 02.
          </div>

          <div className="flex gap-3 pt-1">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
