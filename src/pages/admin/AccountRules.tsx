import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  AlertCircle,
  CheckCircle2,
  Edit2,
  Save,
  X,
  FileText,
  Upload
} from 'lucide-react';
import { 
  addAdminAccount, 
  updateAdminAccount,
  removeAdminAccount,
  updateGlobalConfig
} from '../../lib/db';
import { useAppStore } from '../../store/useAppStore';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useOutletContext } from 'react-router-dom';

interface AdminAccount {
  id: string;
  email: string;
  displayName?: string;
  role: 'owner' | 'admin' | 'editor' | 'finance' | 'bendahara';
  addedAt: any;
}

export default function AccountRules() {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAuthorized = ['owner', 'admin'].includes(userRole);
  
  const admins = useAppStore(state => state.admins);
  const storeConfig = useAppStore(state => state.config);
  const isLoaded = useAppStore(state => state.isAdminsLoaded && state.isConfigLoaded);
  const [config, setConfig] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'editor'>('admin');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [uploadingFields, setUploadingFields] = useState<{ [key: string]: boolean }>({});

  const handleFileUpload = async (field: string, file: File) => {
    if (!file) return;
    setUploadingFields(prev => ({ ...prev, [field]: true }));
    setError(null);
    setSuccess(null);
    try {
      const { url } = await uploadToCloudinary(file);
      setConfig((prev: any) => ({
        ...prev,
        [field]: url
      }));
      setSuccess(`Berhasil mengunggah berkas.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah berkas.");
    } finally {
      setUploadingFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleRemoveField = (field: string) => {
    setConfig((prev: any) => ({
      ...prev,
      [field]: null
    }));
    setSuccess(`Berkas berhasil dihapus.`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Berkas harus berupa gambar.");
        return;
      }
      handleFileUpload(field, file);
    }
  };

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    adminId: string;
    adminEmail: string;
  }>({
    isOpen: false,
    adminId: '',
    adminEmail: ''
  });

  useEffect(() => {
    if (storeConfig) {
      setConfig(storeConfig);
    }
  }, [storeConfig]);

  const handleSaveConfig = async () => {
    if (!isAuthorized) return;
    setSaveStatus('saving');
    try {
      await updateGlobalConfig(config);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('idle');
      setError("Gagal memperbarui pengaturan laporan.");
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsAdding(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (admins.find(a => a.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Email ini sudah terdaftar sebagai admin.");
      }

      await addAdminAccount(email, role, displayName);
      setSuccess(`Berhasil menambahkan ${displayName || email} sebagai ${role}.`);
      setEmail('');
      setDisplayName('');
    } catch (err: any) {
      setError(err.message || "Gagal menambahkan admin.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditClick = (admin: AdminAccount) => {
    setEditingId(admin.id);
    setEditName(admin.displayName || admin.email.split('@')[0]);
  };

  const handleUpdateName = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateAdminAccount(id, { displayName: editName.trim() });
      setEditingId(null);
      setSuccess("Nama tampilan berhasil diperbarui.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Gagal memperbarui nama tampilan.");
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    setConfirmModal({
      isOpen: true,
      adminId: id,
      adminEmail: email
    });
  };

  const confirmDeleteAdmin = async () => {
    try {
      await removeAdminAccount(confirmModal.adminId);
      setSuccess("Administrator berhasil dihapus.");
    } catch (err) {
      setError("Gagal menghapus administrator.");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">Owner</span>;
      case 'admin':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">Admin</span>;
      case 'editor':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">Editor</span>;
      case 'finance':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">Keuangan</span>;
      case 'bendahara':
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">Bendahara</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">{role}</span>;
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Izin Diperlukan</h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            Halaman ini berisi pengaturan keamanan sistem yang sensitif. 
            Hanya <strong>System Owner</strong> dan <strong>Super Admin</strong> yang memiliki akses untuk mengelola akun administrator.
          </p>
          <div className="p-4 bg-gray-50 rounded-2xl text-xs font-bold text-gray-400 uppercase tracking-widest">
            Level Akses Anda: {
              userRole === 'owner' ? 'System Owner' :
              userRole === 'admin' ? 'Administrator' :
              userRole === 'bendahara' ? 'Bendahara Gedung Serbaguna' :
              userRole === 'finance' ? 'Administrasi Keuangan' :
              userRole === 'editor' ? 'Editor Konten' : userRole
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Aturan & Akun Admin
          </h2>
          <p className="text-gray-500 mt-1">Kelola akses dashboard dan identitas penandatangan laporan.</p>
        </div>
        <button 
          onClick={handleSaveConfig}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-blue-800 transition-all"
        >
          {saveStatus === 'saving' ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saveStatus === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'success' ? 'Tersimpan!' : 'Simpan Semua Aturan'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PDF Signatory Settings */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-6 h-6 text-primary" />
            <h3 className="font-bold text-gray-900">Identitas Laporan & Penandatangan</h3>
          </div>
          
          <div className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nama Instansi / Gedung</label>
                <input 
                  type="text" 
                  value={config?.reportOrgName || 'GEDUNG SERBAGUNA HUNTAP TONDO 2'}
                  onChange={(e) => setConfig({...config, reportOrgName: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Penanggung Jawab (Oleh:)</label>
                <input 
                  type="text" 
                  value={config?.reportAuthorName || ''}
                  placeholder="Contoh: Bpk. Syaiful (Ketua)"
                  onChange={(e) => setConfig({...config, reportAuthorName: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nama Bendahara (Tanda Tangan)</label>
                <input 
                  type="text" 
                  value={config?.reportBendaharaName || ''}
                  onChange={(e) => setConfig({...config, reportBendaharaName: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nama Keuangan (Tanda Tangan)</label>
                <input 
                  type="text" 
                  value={config?.reportFinanceName || ''}
                  onChange={(e) => setConfig({...config, reportFinanceName: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tanda Tangan pada Kwitansi / Receipt PDF</label>
              <select 
                value={config?.receiptSignatureMode || 'both'}
                onChange={(e) => setConfig({...config, receiptSignatureMode: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="both">Tampilkan Keduanya (Staf Keuangan & Bendahara)</option>
                <option value="finance">Tampilkan Staf Keuangan Saja</option>
                <option value="bendahara">Tampilkan Bendahara Saja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upload TTD & Cap Stempel Settings */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Upload className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-gray-900">Upload Tanda Tangan & Cap Stempel</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {/* TTD Bendahara */}
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider px-1">TTD Bendahara</label>
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'reportBendaharaSignature')}
                  className="relative border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] text-center transition-all bg-gray-50/50 group"
                >
                  {uploadingFields['reportBendaharaSignature'] ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-[9px] font-bold text-gray-400">Mengunggah...</span>
                    </div>
                  ) : config?.reportBendaharaSignature ? (
                    <div className="relative w-full flex flex-col items-center justify-center">
                      <img 
                        src={config.reportBendaharaSignature} 
                        alt="TTD Bendahara" 
                        className="max-h-16 object-contain rounded-lg border border-gray-100 p-1 bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveField('reportBendaharaSignature')}
                        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors shadow-md"
                        title="Hapus"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="text-[9px] text-green-600 font-bold mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Terunggah
                      </span>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold text-gray-500">Klik / Tarik berkas</span>
                      <span className="text-[8px] text-gray-400">PNG / JPG</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('reportBendaharaSignature', file);
                        }} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* TTD Keuangan */}
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider px-1">TTD Keuangan</label>
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'reportFinanceSignature')}
                  className="relative border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] text-center transition-all bg-gray-50/50 group"
                >
                  {uploadingFields['reportFinanceSignature'] ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-[9px] font-bold text-gray-400">Mengunggah...</span>
                    </div>
                  ) : config?.reportFinanceSignature ? (
                    <div className="relative w-full flex flex-col items-center justify-center">
                      <img 
                        src={config.reportFinanceSignature} 
                        alt="TTD Keuangan" 
                        className="max-h-16 object-contain rounded-lg border border-gray-100 p-1 bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveField('reportFinanceSignature')}
                        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors shadow-md"
                        title="Hapus"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="text-[9px] text-green-600 font-bold mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Terunggah
                      </span>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold text-gray-500">Klik / Tarik berkas</span>
                      <span className="text-[8px] text-gray-400">PNG / JPG</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('reportFinanceSignature', file);
                        }} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Cap Stempel Resmi */}
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider px-1">Cap / Stempel</label>
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'reportStamp')}
                  className="relative border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] text-center transition-all bg-gray-50/50 group"
                >
                  {uploadingFields['reportStamp'] ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-[9px] font-bold text-gray-400">Mengunggah...</span>
                    </div>
                  ) : config?.reportStamp ? (
                    <div className="relative w-full flex flex-col items-center justify-center">
                      <img 
                        src={config.reportStamp} 
                        alt="Cap Stempel" 
                        className="max-h-16 object-contain rounded-lg border border-gray-100 p-1 bg-white"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveField('reportStamp')}
                        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors shadow-md"
                        title="Hapus"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="text-[9px] text-green-600 font-bold mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Terunggah
                      </span>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold text-gray-500">Klik / Tarik berkas</span>
                      <span className="text-[8px] text-gray-400">PNG / JPG</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('reportStamp', file);
                        }} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 leading-normal">
              Unggah berkas tanda tangan transparan (PNG) dan cap stempel resmi. TTD dan cap akan disematkan secara otomatis di dokumen laporan PDF. Jangan lupa klik <strong>Simpan Semua Aturan</strong> di atas untuk menyimpan perubahan permanen.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Add */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 sticky top-28">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Tambah Admin Baru
            </h3>
            
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Nama Panggilan / Nama Lengkap
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Pak RT 02"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Email Google
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Level Akses
                </label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none cursor-pointer"
                >
                  <option value="admin">Administrator</option>
                  <option value="bendahara">Bendahara (Keuangan Utama)</option>
                  <option value="finance">Administrasi Keuangan</option>
                  <option value="editor">Editor (Konten Saja)</option>
                  <option value="owner">System Owner</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={isAdding}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isAdding ? "Memproses..." : "Daftarkan Akun"}
              </button>
            </form>

            <AnimatePresence>
              {(error || success) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-6 p-4 rounded-2xl text-xs font-bold flex items-start gap-3 ${
                    error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                  }`}
                >
                  {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{error || success}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* List Admin */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                Daftar Administrator Aktif
              </h3>
              <div className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                {admins.length} Terdaftar
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Administrator</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Akses</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!isLoaded ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">Memverifikasi Database...</p>
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="text-gray-300 w-6 h-6" />
                        </div>
                        <p className="text-gray-500 font-bold mb-1">Belum Ada Admin</p>
                        <p className="text-sm text-gray-400">Silakan tambahkan admin melalui formulir di samping.</p>
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-all">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              {editingId === admin.id ? (
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                    className="flex-1 bg-white border border-primary/20 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10"
                                  />
                                  <button onClick={() => handleUpdateName(admin.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Save className="w-4 h-4" /></button>
                                  <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900">{admin.displayName || admin.email.split('@')[0]}</p>
                                  <button 
                                    onClick={() => handleEditClick(admin)}
                                    className="p-1.5 text-gray-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {admin.email}
                              </p>
                              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter mt-1">
                                Ditambahkan {new Date(admin.addedAt?.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          {getRoleBadge(admin.role)}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Akses"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-gray-50/50 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-xs leading-relaxed text-gray-500 italic">
                <strong className="text-gray-700 block mb-1">Informasi Keamanan:</strong>
                Gunakan fitur ini dengan bijak. Hanya akun Gmail yang terdaftar di sini yang dapat mengakses dashboard manajemen. Akun yang dihapus akan segera kehilangan akses setelah sesi mereka berakhir.
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDeleteAdmin}
        title="Hapus Administrator?"
        message={`Apakah Anda yakin ingin menghapus akses untuk ${confirmModal.adminEmail}? Pengguna ini tidak akan bisa masuk ke dashboard lagi.`}
      />
    </div>
  );
}
