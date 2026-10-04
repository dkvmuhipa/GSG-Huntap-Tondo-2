import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar as CalendarIcon, 
  User, 
  Phone, 
  FileText, 
  Send, 
  CheckCircle2, 
  ChevronDown, 
  MapPin, 
  Building2, 
  Users, 
  Clock, 
  ClipboardCheck, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle,
  Layers,
  Sparkles,
  Zap,
  Tag,
  Warehouse,
  Flame,
  Copy,
  Check,
  Store,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { addBooking } from '../../lib/db';
import { useAppStore } from '../../store/useAppStore';
import HallLayoutCanvas, { HallLayoutData, LayoutTemplate, StagePosition } from './HallLayoutCanvas';
import { notifyAdminNewBooking } from '../../services/whatsappGatewayService';

// Fallback Inventory items with standard pricing if Firestore behaves empty
const DEFAULT_INVENTORY = [
  { id: 'inv-kursi', name: 'Kursi Lipat Chitose (Fasilitas Utama)', goodQuantity: 300, price: 5000, category: 'Fasilitas Utama' },
  { id: 'inv-meja', name: 'Meja Bulat Banquet (Fasilitas Utama)', goodQuantity: 45, price: 20000, category: 'Fasilitas Utama' },
  { id: 'inv-sound', name: 'Sound System Utama 5000W + Mic Wireless', goodQuantity: 2, price: 500000, category: 'Sound System' },
  { id: 'inv-genset', name: 'Genset Honda Silent 10kVA', goodQuantity: 2, price: 300000, category: 'Lainnya' },
  { id: 'inv-tenda', name: 'Tenda Sarnafil VIP 5x5m', goodQuantity: 8, price: 150000, category: 'Lainnya' },
  { id: 'inv-ac', name: 'Air Conditioner Portable 2PK', goodQuantity: 4, price: 250000, category: 'Pendingin Ruangan' },
  { id: 'inv-catering', name: 'Peralatan Prasmanan Lengkap (Set)', goodQuantity: 10, price: 100000, category: 'Peralatan Dapur' }
];

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage?: string | null;
}

export default function BookingModal({ isOpen, onClose, selectedPackage }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const packages = useAppStore(state => state.facilities);
  const bookings = useAppStore(state => state.bookings);
  const dbInventory = useAppStore(state => state.inventory);

  const TERMS = [
    "Pembayaran DP minimal 30% dilakukan maksimal 3 hari setelah permohonan disetujui.",
    "Pelunasan wajib dilakukan paling lambat 7 hari sebelum hari H.",
    "Pembatalan kurang dari 7 hari sebelum acara dikenakan denda 50% dari uang muka.",
    "Penyewa wajib menjaga kebersihan dan fasilitas gedung selama acara berlangsung.",
    "Kerusakan fasilitas gedung yang disebabkan oleh kelalaian penyewa menjadi tanggung jawab penyewa.",
    "Penggunaan gedung tidak boleh melebihi batas waktu yang telah disepakati.",
    "Dilarang membawa barang berbahaya, narkotika, atau melakukan aktivitas ilegal di area gedung."
  ];

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    nik: '',
    address: '',
    organization: '',
    organizerType: 'Perorangan / Keluarga',
    organizerName: '',
    purpose: '',
    isPublic: true,
    startDate: '',
    startTime: '08:00',
    endTime: '17:00',
    guests: '',
    amount: 0,
    notes: '',
    packageName: '',
    agreeTerms: false
  });

  // Custom interactive layout states
  const [layout, setLayout] = useState<HallLayoutData>({
    template: 'wedding',
    stagePosition: 'depan',
    tableQuantity: 6,
    chairQuantity: 36,
    selectedElementIds: []
  });

  // Chosen inventory items quantity. itemId => quantity
  const [selectedInventory, setSelectedInventory] = useState<Record<string, number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected elements on first load matching the layout template
  useEffect(() => {
    if (layout.selectedElementIds.length === 0) {
      const initialElements: string[] = [];
      if (layout.template === 'wedding') {
        for (let t = 0; t < 6; t++) {
          initialElements.push(`table-${t}`);
          for (let c = 0; c < 6; c++) {
            initialElements.push(`chair-${t}-${c}`);
          }
        }
      }
      setLayout(prev => ({ ...prev, selectedElementIds: initialElements }));
    }
  }, []);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTermsOpen) {
          setIsTermsOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isTermsOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !selectedPackage || packages.length === 0) return;
    const pkg = packages.find(p => p.title === selectedPackage);
    if (pkg) {
      const numericPrice = parseInt(pkg.price.replace(/[^0-9]/g, '')) || 0;
      setFormData(prev => ({ 
        ...prev, 
        packageName: pkg.title, 
        amount: numericPrice 
      }));
    }
  }, [isOpen, selectedPackage, packages]);

  // Combine DB inventory and default inventory to ensure data is always present
  const availableInventory = React.useMemo(() => {
    const list = [...dbInventory];
    DEFAULT_INVENTORY.forEach(defItem => {
      if (!list.some(item => item.name.toLowerCase() === defItem.name.toLowerCase() || item.id === defItem.id)) {
        list.push(defItem);
      }
    });
    return list;
  }, [dbInventory]);

  // Real-time remaining stock calculation for a specific item on the chosen date
  const getRemainingStock = (id: string, goodQty: number) => {
    if (!formData.startDate) return goodQty;
    
    // Aggregate reserved quantites across approved, completed, or pending bookings for this specific date
    const reservedQty = bookings
      .filter(b => b.startDate === formData.startDate && (b.status === 'approved' || b.status === 'completed' || b.status === 'pending'))
      .reduce((total, b) => {
        const qtyInBooking = b.selectedInventory?.[id] || 0;
        return total + qtyInBooking;
      }, 0);
    
    return Math.max(0, goodQty - reservedQty);
  };

  // Synchronize layout table/chair selections with inventory and calculate cost
  const calculatedBills = React.useMemo(() => {
    const basePkg = packages.find(p => p.title === formData.packageName);
    const basePrice = basePkg ? (parseInt(basePkg.price.replace(/[^0-9]/g, '')) || 0) : 0;

    let subtotalInventory = 0;
    const itemsList: Array<{ name: string; quantity: number; cost: number }> = [];

    // 1. Calculate cost of extra manual inventory
    Object.entries(selectedInventory).forEach(([itemId, val]) => {
      const qty = Number(val) || 0;
      if (qty <= 0) return;
      const invRef = availableInventory.find(i => i.id === itemId);
      if (invRef) {
        const rate = Number(invRef.price) || 0;
        const cost = rate * qty;
        subtotalInventory += cost;
        itemsList.push({ name: invRef.name, quantity: qty, cost });
      }
    });

    // 2. Automatically sync layout elements to main table & chair items
    const totalExtraChairsInLayout = layout.chairQuantity;
    const totalExtraTablesInLayout = layout.tableQuantity;

    if (totalExtraChairsInLayout > 0) {
      const chairVal = availableInventory.find(i => i.name.toLowerCase().includes('kursi')) || DEFAULT_INVENTORY[0];
      const chairRate = chairVal.price || 5000;
      const cost = totalExtraChairsInLayout * chairRate;
      subtotalInventory += cost;
      itemsList.push({ name: `${chairVal.name} (Denah)`, quantity: totalExtraChairsInLayout, cost });
    }

    if (totalExtraTablesInLayout > 0) {
      const tableVal = availableInventory.find(i => i.name.toLowerCase().includes('meja')) || DEFAULT_INVENTORY[1];
      const tableRate = tableVal.price || 20000;
      const cost = totalExtraTablesInLayout * tableRate;
      subtotalInventory += cost;
      itemsList.push({ name: `${tableVal.name} (Denah)`, quantity: totalExtraTablesInLayout, cost });
    }

    const grandTotal = basePrice + subtotalInventory;

    return {
      basePrice,
      subtotalInventory,
      grandTotal,
      itemsList
    };
  }, [formData.packageName, selectedInventory, availableInventory, layout.chairQuantity, layout.tableQuantity, packages]);

  const handlePackageChange = (packageName: string) => {
    const pkg = packages.find(p => p.title === packageName);
    const numericPrice = pkg ? (parseInt(pkg.price.replace(/[^0-9]/g, '')) || 0) : 0;
    setFormData(prev => ({
      ...prev,
      packageName,
      amount: numericPrice
    }));
  };

  const checkCollision = (date: string, pkg: string) => {
    return bookings.some(b => 
      b.startDate === date && 
      b.packageName === pkg && 
      (b.status === 'approved' || b.status === 'completed' || b.status === 'pending')
    );
  };

  const handleInventoryQuantity = (itemId: string, increment: boolean) => {
    const item = availableInventory.find(i => i.id === itemId);
    if (!item) return;

    const maxStock = getRemainingStock(itemId, item.goodQuantity);
    const currentVal = selectedInventory[itemId] || 0;

    let newVal = currentVal + (increment ? 1 : -1);
    if (newVal < 0) newVal = 0;
    if (newVal > maxStock) newVal = maxStock;

    setSelectedInventory(prev => ({
      ...prev,
      [itemId]: newVal
    }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.customerName || !formData.phone || !formData.packageName) {
        setError('Mohon lengkapi data identitas dan pilih paket.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.startDate || !formData.purpose) {
        setError('Mohon tentukan tanggal dan tujuan acara.');
        return;
      }
      if (checkCollision(formData.startDate, formData.packageName)) {
        setError('Maaf, tanggal tersebut sudah dipesan untuk paket ini. Silakan pilih tanggal lain.');
        return;
      }
    }
    if (step === 3) {
      // Validate that layout choices do not exceed stock
      const chairAsset = availableInventory.find(i => i.name.toLowerCase().includes('kursi')) || DEFAULT_INVENTORY[0];
      const maxChairs = getRemainingStock(chairAsset.id, chairAsset.goodQuantity);
      if (layout.chairQuantity > maxChairs) {
        setError(`Maaf, jumlah kursi di denah (${layout.chairQuantity}) melebihi stok yang tersedia hari itu (${maxChairs} kursi). Sederhanakan tata letak Anda.`);
        return;
      }

      const tableAsset = availableInventory.find(i => i.name.toLowerCase().includes('meja')) || DEFAULT_INVENTORY[1];
      const maxTables = getRemainingStock(tableAsset.id, tableAsset.goodQuantity);
      if (layout.tableQuantity > maxTables) {
        setError(`Maaf, jumlah meja di denah (${layout.tableQuantity}) melebihi stok yang tersedia hari itu (${maxTables} meja). Sederhanakan tata letak Anda.`);
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    onClose();
    setStep(1);
    setFormData({
      customerName: '',
      phone: '',
      nik: '',
      address: '',
      organization: '',
      organizerType: 'Perorangan / Keluarga',
      organizerName: '',
      purpose: '',
      isPublic: true,
      startDate: '',
      startTime: '08:00',
      endTime: '17:00',
      guests: '',
      amount: 0,
      notes: '',
      packageName: '',
      agreeTerms: false
    });
    setLayout({
      template: 'wedding',
      stagePosition: 'depan',
      tableQuantity: 6,
      chairQuantity: 36,
      selectedElementIds: []
    });
    setSelectedInventory({});
  };

  const generateWAMessage = () => {
    return `Yth. Pengelola Gedung Serbaguna Huntap 2 Tondo,

Saya ingin mengonfirmasi pengajuan sewa gedung yang telah saya kirimkan melalui website. Berikut adalah detail permohonan saya:

📌 *IDENTITAS PENYEWA*
- Nama Pemohon: ${formData.customerName}
- Kategori Penyelenggara: ${formData.organizerType}
- Nama Penyelenggara/Lembaga: ${formData.organizerName || formData.customerName}
- No. WhatsApp: ${formData.phone}
- NIK KTP: ${formData.nik}
- Domisili: ${formData.address || '-'}

📅 *WAKTU & DETIL ACARA*
- Hari/Tanggal: ${formData.startDate}
- Estimasi Jam: ${formData.startTime} s/d ${formData.endTime}
- Paket Sewa: ${formData.packageName}
- Tujuan Acara: ${formData.purpose}
- Jumlah Tamu: ${formData.guests || '-'} Orang

📐 *TATA LETAK & INVENTARIS*
- Rencana Tata Letak: ${layout.template.toUpperCase()} (${layout.chairQuantity} Kursi, ${layout.tableQuantity} Meja)
${Object.entries(selectedInventory).some(([_, qty]) => (qty as number) > 0) ? `\n- Fasilitas Tambahan:\n${Object.entries(selectedInventory).map(([id, qty]) => {
  if ((qty as number) <= 0) return '';
  const item = availableInventory.find(inv => inv.id === id);
  return item ? `  • ${item.name} (x${qty})` : '';
}).filter(Boolean).join('\n')}` : ''}

💰 *ESTIMASI BIAYA*
- Total Biaya: Rp ${calculatedBills.grandTotal.toLocaleString('id-ID')}

Mohon informasi selanjutnya terkait prosedur verifikasi dan rincian transfer pembayaran uang muka (DP). Terima kasih.`;
  };

  const getWALink = () => {
    const text = encodeURIComponent(generateWAMessage());
    return `https://wa.me/6281234567890?text=${text}`;
  };

  const copyWAMessage = () => {
    navigator.clipboard.writeText(generateWAMessage());
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 4) {
      nextStep();
      return;
    }

    if (!formData.agreeTerms) {
      setError('Anda harus menyetujui syarat & ketentuan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Prepare synchronized final inventory array/object, including the layout counts & custom selections
    const finalizedInventoryToSave: Record<string, number> = { ...selectedInventory };
    
    // Add layout chairs
    const chairAsset = availableInventory.find(i => i.name.toLowerCase().includes('kursi')) || DEFAULT_INVENTORY[0];
    if (layout.chairQuantity > 0) {
      finalizedInventoryToSave[chairAsset.id] = (finalizedInventoryToSave[chairAsset.id] || 0) + layout.chairQuantity;
    }
    // Add layout tables
    const tableAsset = availableInventory.find(i => i.name.toLowerCase().includes('meja')) || DEFAULT_INVENTORY[1];
    if (layout.tableQuantity > 0) {
      finalizedInventoryToSave[tableAsset.id] = (finalizedInventoryToSave[tableAsset.id] || 0) + layout.tableQuantity;
    }

    try {
      await addBooking({
        ...formData,
        endDate: formData.startDate, // Single day event
        status: 'pending',
        paymentStatus: 'unpaid',
        financeAdded: false,
        amount: calculatedBills.grandTotal, // Computed total cost including package + inventory add-ons
        layoutDraft: {
          template: layout.template,
          stagePosition: layout.stagePosition,
          tableQuantity: layout.tableQuantity,
          chairQuantity: layout.chairQuantity,
          selectedElementIds: layout.selectedElementIds
        },
        selectedInventory: finalizedInventoryToSave,
        createdAt: new Date().toISOString()
      });
      
      // Automated alert to Admin WhatsApp via Gateway if active
      notifyAdminNewBooking({
        ...formData,
        amount: calculatedBills.grandTotal
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError('Gagal mengirimkan permohonan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            className="relative bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[min(900px,90vh)] flex flex-col transition-all border border-slate-100"
          >
            {isSuccess ? (
              <div className="p-6 sm:p-10 text-center flex-1 flex flex-col justify-between overflow-y-auto max-h-[90vh]">
                <div>
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm shadow-emerald-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Permohonan Berhasil Dikirim!</h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
                    Data Anda telah tercatat rapi di sistem kami. <strong className="text-slate-900">Sangat Direkomendasikan:</strong> Kirim salinan rincian pengajuan ini langsung ke WhatsApp Admin agar diverifikasi lebih cepat.
                  </p>

                  {/* Copyable Template Box */}
                  <div className="text-left bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 relative group mb-6 shadow-inner">
                    <button
                      onClick={copyWAMessage}
                      type="button"
                      className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all font-bold backdrop-blur-sm"
                      title="Salin Template"
                    >
                      {copiedMsg ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                    <span className="text-[9px] uppercase font-black text-indigo-400 tracking-wider block mb-2">Template Pesan Konfirmasi WhatsApp</span>
                    <pre className="text-[11px] sm:text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto scrollbar-none select-all pr-2">
                      {generateWAMessage()}
                    </pre>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <a
                    href={getWALink()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Kirim Konfirmasi ke WhatsApp Admin
                  </a>

                  <button
                    onClick={handleResetAndClose}
                    type="button"
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                  >
                    Tutup & Selesai
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Modern Stepper Header */}
                <div className="bg-gradient-to-r from-primary via-blue-700 to-indigo-800 p-6 sm:p-7 text-white relative shrink-0 shadow-sm">
                  <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all text-white backdrop-blur-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[10px] uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Layanan Warga RT 02
                    </span>
                    <span className="text-[11px] text-blue-150 font-bold opacity-80">Tahap {step} dari 4</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Permohonan Sewa Gedung</h3>
                  <p className="text-xs text-blue-100 font-medium mt-0.5">Formulir digital reservasi, tata letak, & rincian fasilitas gedung.</p>
                  
                  {/* Stepper Progress Bar */}
                  <div className="mt-4 sm:mt-5 space-y-2">
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {[
                        { num: 1, label: "Identitas" },
                        { num: 2, label: "Waktu" },
                        { num: 3, label: "Tata Letak" },
                        { num: 4, label: "Selesai" }
                      ].map((s) => (
                        <div 
                          key={s.num} 
                          className={`flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 rounded-xl transition-all ${
                            step === s.num 
                              ? 'bg-white text-primary font-black shadow-md' 
                              : step > s.num 
                              ? 'bg-white/20 text-white font-extrabold' 
                              : 'bg-white/5 text-white/50 font-semibold'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] shrink-0 ${
                            step === s.num 
                              ? 'bg-primary text-white' 
                              : step > s.num 
                              ? 'bg-emerald-400 text-slate-900' 
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {step > s.num ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                          </div>
                          <span className="hidden sm:inline text-[10px] tracking-tight uppercase truncate">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-300 to-emerald-400 transition-all duration-300 ease-out"
                        style={{ width: `${stepPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none">
                  <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                    {error && (
                      <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-200/80 flex items-start gap-2.5 shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-bounce" />
                        <span className="leading-relaxed">{error}</span>
                      </div>
                    )}

                    {/* STEP 1: Citizen Identity & Package */}
                    {step === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-3 p-4 bg-blue-50/80 rounded-2xl border border-blue-100/80 shadow-xs">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Tahap 1</p>
                            <h4 className="text-sm font-black text-slate-900">Identitas Pemohon & Pilihan Paket</h4>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <User className="w-3.5 h-3.5 text-primary" />
                              <span>Nama Lengkap</span>
                              <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input 
                              required
                              type="text" 
                              value={formData.customerName}
                              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                              placeholder="Contoh: Budi Prasetyo"
                              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300"
                            />
                            <p className="text-[10px] text-slate-400 pl-1">Nama lengkap penanggung jawab acara.</p>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>No. WhatsApp (Aktif)</span>
                              <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input 
                              required
                              type="text" 
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              placeholder="08xxxxxxxxxx"
                              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300"
                            />
                            <p className="text-[10px] text-slate-400 pl-1">Nomor untuk koordinasi dan konfirmasi sewa.</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                              <span>No. NIK KTP (16 Digit)</span>
                              <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input 
                              required
                              type="text" 
                              maxLength={16}
                              value={formData.nik}
                              onChange={(e) => setFormData({...formData, nik: e.target.value})}
                              placeholder="7203xxxxxxxxxxxx"
                              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold text-sm font-mono transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300"
                            />
                            <p className="text-[10px] text-slate-400 pl-1">Digunakan untuk validasi hak warga & perjanjian sewa.</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Kategori Penyelenggara</span>
                              <span className="text-red-500 font-bold">*</span>
                            </label>
                            <div className="relative">
                              <select 
                                required
                                value={formData.organizerType}
                                onChange={(e) => setFormData({...formData, organizerType: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 appearance-none cursor-pointer pr-10"
                              >
                                <option value="Perorangan / Keluarga">Perorangan / Keluarga</option>
                                <option value="Instansi Pemerintah">Instansi Pemerintah</option>
                                <option value="Organisasi Kemasyarakatan / Komunitas">Organisasi / Komunitas</option>
                                <option value="Swasta / Perusahaan / Komersil">Swasta / Komersil</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            <p className="text-[10px] text-slate-400 pl-1">Pilih entitas pemohon acara.</p>
                          </div>

                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              <span>Nama Penyelenggara / Kepanitiaan (Opsional)</span>
                            </label>
                            <input 
                              type="text" 
                              value={formData.organizerName}
                              onChange={(e) => setFormData({...formData, organizerName: e.target.value, organization: e.target.value})}
                              placeholder="Contoh: Panitia Pernikahan Budi & Ani / Karang Taruna RT 02"
                              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>Alamat Domisili Sekarang</span>
                          </label>
                          <textarea 
                            rows={2}
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            placeholder="Alamat lengkap (Blok/No. Rumah di Huntap Tondo 2 atau alamat luar)..."
                            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 resize-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                            <Tag className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pilihan Paket Sewa Gedung</span>
                            <span className="text-red-500 font-bold">*</span>
                          </label>
                          <div className="relative">
                            <select 
                              required
                              value={formData.packageName}
                              onChange={(e) => handlePackageChange(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 font-bold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 appearance-none cursor-pointer pr-10"
                            >
                              <option value="">-- Pilih Paket Sewa Gedung --</option>
                              {packages.map(p => (
                                <option key={p.id} value={p.title}>{p.title} ~ ({p.price})</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                          <p className="text-[10px] text-slate-400 pl-1">Paket menentukan durasi standar pemakaian gedung dan fasilitas dasar.</p>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: Dates, Times, and Agenda Details */}
                    {step === 2 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-3 p-4 bg-blue-50/80 rounded-2xl border border-blue-100/80 shadow-xs">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Tahap 2</p>
                            <h4 className="text-sm font-black text-slate-900">Jadwal Acara & Keperluan Pemakaian</h4>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                              <span>Tanggal Acara</span>
                              <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input 
                              required
                              type="date" 
                              value={formData.startDate}
                              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300"
                            />
                            <p className="text-[10px] text-slate-400 pl-1">Pilih tanggal hari H pelaksanaan.</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <Users className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Estimasi Jumlah Tamu</span>
                            </label>
                            <input 
                              type="number" 
                              value={formData.guests}
                              onChange={(e) => setFormData({...formData, guests: e.target.value})}
                              placeholder="Contoh: 300"
                              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300"
                            />
                            <p className="text-[10px] text-slate-400 pl-1">Kapasitas maksimal gedung ±600 orang.</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>Jam Mulai</span>
                            </label>
                            <input 
                              type="time" 
                              value={formData.startTime}
                              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Jam Selesai</span>
                            </label>
                            <input 
                              type="time" 
                              value={formData.endTime}
                              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            <span>Tujuan / Keperluan Acara</span>
                            <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input 
                            required
                            type="text" 
                            value={formData.purpose}
                            onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                            placeholder="Contoh: Resepsi Pernikahan, Khitanan, Syukuran, Rapat Warga..."
                            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Catatan Tambahan untuk Pengurus</span>
                          </label>
                          <textarea 
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Contoh: Permohonan izin dekorasi panggung H-1 mulai sore hari..."
                            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 font-semibold text-sm transition-all focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider pl-1 block">Sifat Acara</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${formData.isPublic ? 'border-primary bg-blue-50/40 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'}`}>
                              <input 
                                type="radio" 
                                checked={formData.isPublic}
                                onChange={() => setFormData({...formData, isPublic: true})}
                                className="mt-1 w-4 h-4 text-primary"
                              />
                              <div>
                                <p className="text-xs font-black text-slate-900">Terbuka untuk Umum</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Akan ditampilkan di Kalender Pemakaian Warga.</p>
                              </div>
                            </label>

                            <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${!formData.isPublic ? 'border-primary bg-blue-50/40 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'}`}>
                              <input 
                                type="radio" 
                                checked={!formData.isPublic}
                                onChange={() => setFormData({...formData, isPublic: false})}
                                className="mt-1 w-4 h-4 text-primary"
                              />
                              <div>
                                <p className="text-xs font-black text-slate-900">Privat / Tertutup</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Hanya tanggal terisi yang ditampilkan tanpa rincian nama acara.</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Hall Interactive Layout Design & Custom Extra Inventory Selection */}
                    {step === 3 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-100 rounded-2xl shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0">
                              <Layers className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Tahap 3</p>
                              <h4 className="text-sm font-black text-slate-900">Tata Letak Gedung & Fasilitas Tambahan</h4>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 
                            <span>Interaktif</span>
                          </span>
                        </div>

                        {/* Interactive Canvas Drawing */}
                        <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-50/30">
                          <HallLayoutCanvas
                            layoutData={layout}
                            onChange={(newLayout) => setLayout(newLayout)}
                            interactive={true}
                            maxTablesAvailable={getRemainingStock(
                              (availableInventory.find(i => i.name.toLowerCase().includes('meja')) || DEFAULT_INVENTORY[1]).id, 
                              45
                            )}
                            maxChairsAvailable={getRemainingStock(
                              (availableInventory.find(i => i.name.toLowerCase().includes('kursi')) || DEFAULT_INVENTORY[0]).id, 
                              300
                            )}
                          />
                        </div>

                        {/* Inventory stock control list */}
                        <div className="space-y-3.5 mt-2">
                          <div className="flex items-center gap-2 pl-1">
                            <Warehouse className="w-4 h-4 text-slate-500" />
                            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Inventaris Tambahan Gedung</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {availableInventory
                              .filter(item => !item.name.toLowerCase().includes('kursi') && !item.name.toLowerCase().includes('meja'))
                              .map(item => {
                                const remainingStock = getRemainingStock(item.id, item.goodQuantity);
                                const currentQty = selectedInventory[item.id] || 0;
                                
                                return (
                                  <div 
                                    key={item.id} 
                                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                      currentQty > 0 
                                        ? 'bg-blue-50/50 border-primary/40 shadow-sm shadow-primary/5' 
                                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex justify-between items-start gap-2">
                                        <p className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">{item.name}</p>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-lg shrink-0">
                                          {item.category || 'Lainnya'}
                                        </span>
                                      </div>
                                      
                                      <div className="flex justify-between items-center mt-2.5">
                                        <p className="text-xs font-black text-primary">
                                          Rp {Number(item.price || 0).toLocaleString('id-ID')}
                                          <span className="text-slate-400 font-normal text-[10px]">/hari</span>
                                        </p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                          remainingStock > 0 
                                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' 
                                            : 'text-red-700 bg-red-50 border border-red-100 font-black'
                                        }`}>
                                          Sisa: {remainingStock} {remainingStock <= 0 ? 'HABIS!' : 'Unit'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Jumlah Tambahan</span>
                                      <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-xl px-1.5 py-1">
                                        <button 
                                          type="button" 
                                          onClick={() => handleInventoryQuantity(item.id, false)}
                                          disabled={currentQty <= 0}
                                          className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                                        >
                                          -
                                        </button>
                                        <span className="w-9 text-center font-mono font-black text-xs text-slate-900">{currentQty}</span>
                                        <button 
                                          type="button" 
                                          onClick={() => handleInventoryQuantity(item.id, true)}
                                          disabled={remainingStock <= 0 || currentQty >= remainingStock}
                                          className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:text-primary hover:bg-white rounded-lg transition-colors disabled:opacity-30"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4: Review Bills, Layout, and Confirmation */}
                    {step === 4 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 shadow-xs">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                            <ClipboardCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tahap 4</p>
                            <h4 className="text-sm font-black text-slate-900">Review & Rincian Pengajuan Sewa</h4>
                          </div>
                        </div>

                        {/* Beautiful Modern Invoice Card */}
                        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
                          <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Estimasi Biaya</span>
                              <p className="text-[10px] text-slate-400 font-medium">Sewa paket utama + fasilitas tambahan</p>
                            </div>
                            <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                              Rp {calculatedBills.grandTotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-xs font-medium divide-y divide-white/10 pt-1">
                            <div className="flex justify-between py-2">
                              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                Paket Utama ({formData.packageName}):
                              </span>
                              <span className="text-slate-200 font-mono font-bold">
                                Rp {calculatedBills.basePrice.toLocaleString('id-ID')}
                              </span>
                            </div>

                            {calculatedBills.itemsList.length > 0 ? (
                              <div className="pt-2.5 pb-1 space-y-1.5">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                                  Inventaris & Penataan Denah:
                                </span>
                                {calculatedBills.itemsList.map((itm, i) => (
                                  <div key={i} className="flex justify-between text-[11px] text-slate-300">
                                    <span>• {itm.name} (x{itm.quantity})</span>
                                    <span className="font-mono">Rp {itm.cost.toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            <div className="flex justify-between py-2 text-slate-400 text-[11px]">
                              <span className="font-bold uppercase text-[10px] tracking-wider">Rencana Tata Ruang:</span>
                              <span className="text-amber-400 font-bold uppercase">
                                {layout.template} • {layout.stagePosition === 'depan' ? 'Panggung Depan' : layout.stagePosition === 'samping' ? 'Panggung Samping' : 'Tanpa Panggung'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Booking Summary Parameters Details */}
                        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ringkasan Data Pemohon</h5>
                          <div className="grid grid-cols-2 gap-3.5 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Pemegang Hak</span>
                              <p className="text-slate-900 font-bold line-clamp-1">{formData.customerName}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Tanggal Pelaksanaan</span>
                              <p className="text-slate-900 font-bold">{formData.startDate}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Jam Mulai - Selesai</span>
                              <p className="text-slate-900 font-bold">{formData.startTime} s/d {formData.endTime}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Keperluan Acara</span>
                              <p className="text-slate-900 font-bold line-clamp-1">{formData.purpose}</p>
                            </div>
                          </div>
                        </div>

                        {/* Local Vendor Recommendation Callout */}
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 shrink-0">
                              <Store className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-amber-950">Butuh Katering, Dekorasi, atau Sound System?</p>
                              <p className="text-[10px] text-amber-800">Dukung UMKM warga Huntap Tondo 2 & mitra vendor terpercaya.</p>
                            </div>
                          </div>
                          <a
                            href="/#mitra-vendor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm flex items-center gap-1 transition-colors"
                          >
                            <span>Lihat Mitra</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Terms Agreement Checkbox */}
                        <div className="space-y-3">
                          <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors group bg-white shadow-xs">
                            <div className="relative flex items-center mt-0.5">
                              <input 
                                type="checkbox"
                                required
                                id="chk-agree"
                                checked={formData.agreeTerms}
                                onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-slate-300 transition-all checked:bg-primary checked:border-primary"
                              />
                              <CheckCircle2 className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[11px] font-semibold text-slate-700 block group-hover:text-slate-900 transition-colors leading-relaxed">
                                Saya telah membaca dan menyetujui seluruh <button type="button" onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }} className="text-primary underline hover:text-blue-800 font-extrabold">Syarat & Ketentuan</button> penyewaan Gedung Serbaguna Huntap Tondo 2 secara penuh.
                              </span>
                            </div>
                          </label>
                        </div>

                        <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-wider text-center leading-relaxed flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            <span>Formulir digital resmi. Pengurus RT 02 akan meninjau jadwal & ketersediaan fasilitas fisik sebelum konfirmasi final.</span>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Core Step Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
                      {step > 1 && (
                        <button 
                          type="button" 
                          onClick={prevStep}
                          className="w-full sm:w-auto px-6 bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-[0.99] transition-all order-2 sm:order-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Kembali</span>
                        </button>
                      )}

                      <button 
                        type={step === 4 ? "submit" : "button"}
                        onClick={step < 4 ? nextStep : undefined}
                        disabled={isSubmitting}
                        className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 order-1 sm:order-2 ${
                          step === 4 
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 text-white' 
                            : 'bg-primary hover:bg-blue-800 shadow-primary/20 text-white'
                        }`}
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {step === 4 ? (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Kirim Permohonan Sewa</span>
                              </>
                            ) : (
                              <>
                                <span>Lanjutkan Ke Tahap Berikutnya</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed pt-1">
                      Teras RT 02 Digital Ecosystem • Huntap Tondo 2
                    </p>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Terms & Conditions Detail Modal */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-900">Syarat & Ketentuan Sewa</h4>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Gedung Serbaguna RT 02 Huntap Tondo 2</p>
                </div>
                <button 
                  onClick={() => setIsTermsOpen(false)} 
                  className="w-8 h-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
                {TERMS.map((term, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                    <div className="shrink-0 w-6 h-6 bg-blue-50 text-primary rounded-lg flex items-center justify-center text-[10px] font-black border border-blue-100">
                      {index + 1}
                    </div>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">{term}</p>
                  </div>
                ))}
              </div>
              <div className="p-6 pt-0">
                <button 
                  onClick={() => setIsTermsOpen(false)}
                  className="w-full bg-primary text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:bg-blue-800 active:scale-[0.99] transition-all"
                >
                  Saya Mengerti & Setuju
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
