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
  Flame
} from 'lucide-react';
import { addBooking } from '../../lib/db';
import { useAppStore } from '../../store/useAppStore';
import HallLayoutCanvas, { HallLayoutData, LayoutTemplate, StagePosition } from './HallLayoutCanvas';

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
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setStep(1);
        setFormData({
          customerName: '',
          phone: '',
          nik: '',
          address: '',
          organization: '',
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
      }, 3000);
    } catch (err: any) {
      setError('Gagal mengirimkan permohonan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[min(900px,90vh)] flex flex-col transition-all"
          >
            {isSuccess ? (
              <div className="p-8 sm:p-12 text-center text-balance flex-1 flex flex-col justify-center">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Permohonan Terkirim!</h3>
                <p className="text-gray-500 mb-0">Admin akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi paket, tata letak gedung, dan detail pembayaran.</p>
              </div>
            ) : (
              <>
                <div className="bg-primary p-6 sm:p-8 text-white relative shrink-0">
                  <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl sm:text-2xl font-black mb-1">Permohonan Sewa Gedung</h3>
                  
                  {/* Stepper with 4 Stages */}
                  <div className="mt-4 sm:mt-6 flex items-center gap-2">
                    {[1, 2, 3, 4].map((s) => {
                      const labels = ["Identitas", "Waktu", "Tata Letak", "Selesai"];
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${step >= s ? 'bg-white text-primary' : 'bg-white/10 text-white/50'}`}>
                            {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                          </div>
                          <span className={`hidden sm:inline text-[9px] font-black uppercase tracking-wider ${step >= s ? 'text-white' : 'text-white/30'}`}>{labels[s-1]}</span>
                          {s < 4 && <div className={`w-4 sm:w-6 h-0.5 rounded-full ${step > s ? 'bg-white' : 'bg-white/10'}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none">
                  <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                    {error && (
                      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 animate-bounce" />
                        {error}
                      </div>
                    )}

                    {/* STEP 1: Citizen Identity & Package */}
                    {step === 1 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-5"
                      >
                        <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <User className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Langkah 1</p>
                            <h4 className="text-sm font-black text-gray-900">Identitas Diri & Pemilihan Paket</h4>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nama Lengkap</label>
                            <input 
                              required
                              type="text" 
                              value={formData.customerName}
                              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                              placeholder="Contoh: Budi Prasetyo"
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">No. WhatsApp (Aktif)</label>
                            <input 
                              required
                              type="text" 
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              placeholder="08xxxxxxxxxx"
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">No. NIK KTP (Sesuai KTP)</label>
                            <input 
                              required
                              type="text" 
                              value={formData.nik}
                              onChange={(e) => setFormData({...formData, nik: e.target.value})}
                              placeholder="7203xxxxxxxxxxxx"
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Organisasi/Lembaga (Opsional)</label>
                            <input 
                              type="text" 
                              value={formData.organization}
                              onChange={(e) => setFormData({...formData, organization: e.target.value})}
                              placeholder="Karang Taruna / CV..."
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Alamat Domisili Sekarang</label>
                          <textarea 
                            rows={2}
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            placeholder="Alamat lengkap RT/RW di Huntap Tondo 2"
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Pilihan Paket Paling Cocok</label>
                          <div className="relative">
                            <select 
                              required
                              value={formData.packageName}
                              onChange={(e) => handlePackageChange(e.target.value)}
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-black text-gray-700 appearance-none text-sm shadow-inner"
                            >
                              <option value="">-- Pilih Paket Sewa Gedung --</option>
                              {packages.map(p => (
                                <option key={p.id} value={p.title}>{p.title} ~ ({p.price})</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
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
                        <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <Clock className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Langkah 2</p>
                            <h4 className="text-sm font-black text-gray-900">Jadwal Acara & Keperluan</h4>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tanggal Penyewaan</label>
                            <input 
                              required
                              type="date" 
                              value={formData.startDate}
                              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Estimasi Jumlah Undangan / Tamu</label>
                            <input 
                              type="number" 
                              value={formData.guests}
                              onChange={(e) => setFormData({...formData, guests: e.target.value})}
                              placeholder="Jumlah orang (e.g. 300)"
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Jam Mulai</label>
                            <input 
                              type="time" 
                              value={formData.startTime}
                              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Jam Selesai</label>
                            <input 
                              type="time" 
                              value={formData.endTime}
                              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                              className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tujuan / Deskripsi Acara</label>
                          <input 
                            required
                            type="text" 
                            value={formData.purpose}
                            onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                            placeholder="Contoh: Resepsi Pernikahan, Khitanan, Rapat Akbar..."
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Catatan Tambahan Kepada Pengurus</label>
                          <textarea 
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Tambahkan catatan khusus bila panggung ingin disetup sehari sebelum acara, dll..."
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Sifat Acara</span>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                checked={formData.isPublic}
                                onChange={() => setFormData({...formData, isPublic: true})}
                                className="w-4 h-4 text-primary"
                              />
                              <span className="text-sm font-semibold text-gray-700">Terbuka untuk Umum (Ditampilkan di Kalender Warga)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                checked={!formData.isPublic}
                                onChange={() => setFormData({...formData, isPublic: false})}
                                className="w-4 h-4 text-primary"
                              />
                              <span className="text-sm font-semibold text-gray-700">Privat / Tertutup</span>
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
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <Layers className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Langkah 3</p>
                              <h4 className="text-sm font-black text-gray-900">Tata Letak Gedung & Inventaris Opsional</h4>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Interaktif
                          </span>
                        </div>

                        {/* Interactive Canvas Drawing */}
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

                        {/* Inventory stock control list */}
                        <div className="space-y-3.5 mt-2">
                          <div className="flex items-center gap-2 pl-1">
                            <Warehouse className="w-4 h-4 text-gray-400" />
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Inventaris Tambahan Tersertifikasi</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableInventory
                              .filter(item => !item.name.toLowerCase().includes('kursi') && !item.name.toLowerCase().includes('meja'))
                              .map(item => {
                                const remainingStock = getRemainingStock(item.id, item.goodQuantity);
                                const currentQty = selectedInventory[item.id] || 0;
                                
                                return (
                                  <div 
                                    key={item.id} 
                                    className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${currentQty > 0 ? 'bg-blue-50/40 border-primary/30 shadow-md shadow-primary/5' : 'bg-gray-50/60 border-gray-100'}`}
                                  >
                                    <div>
                                      <div className="flex justify-between items-start">
                                        <p className="font-extrabold text-sm text-gray-800 leading-tight line-clamp-2">{item.name}</p>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase bg-white border border-gray-100 px-2 py-0.5 rounded-lg shrink-0">
                                          {item.category || 'Lainnya'}
                                        </span>
                                      </div>
                                      
                                      <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs font-black text-primary">Rp {Number(item.price || 0).toLocaleString('id-ID')}<span className="text-gray-400 font-medium">/hari</span></p>
                                        <p className={`text-[10px] font-bold ${remainingStock > 0 ? 'text-green-600' : 'text-red-500 bg-red-50 px-2 py-0.5 rounded-md font-black'}`}>
                                          Sisa Stok: {remainingStock} {remainingStock <= 0 ? 'HABIS!' : 'Unit'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-gray-100/50">
                                      <span className="text-[10px] text-gray-400 font-extrabold uppercase">Jumlah Sewa</span>
                                      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-1.5 py-1">
                                        <button 
                                          type="button" 
                                          onClick={() => handleInventoryQuantity(item.id, false)}
                                          disabled={currentQty <= 0}
                                          className="w-7 h-7 flex items-center justify-center font-bold text-gray-500 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30"
                                        >
                                          -
                                        </button>
                                        <span className="w-10 text-center font-mono font-black text-sm text-gray-800">{currentQty}</span>
                                        <button 
                                          type="button" 
                                          onClick={() => handleInventoryQuantity(item.id, true)}
                                          disabled={remainingStock <= 0 || currentQty >= remainingStock}
                                          className="w-7 h-7 flex items-center justify-center font-bold text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30"
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
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 rounded-2xl border border-green-100">
                          <ClipboardCheck className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Langkah 4</p>
                            <h4 className="text-sm font-black text-gray-900">Review & Konfirmasi Pengajuan</h4>
                          </div>
                        </div>

                        {/* Beautiful Invoice Breakdown breakdown */}
                        <div className="bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 space-y-4 shadow-xl">
                          <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Biaya Komparatif</span>
                              <p className="text-[9px] text-gray-500 font-bold uppercase">Sudah termasuk sewa gedung & alat</p>
                            </div>
                            <span className="text-2xl font-black text-amber-400">Rp {calculatedBills.grandTotal.toLocaleString('id-ID')}</span>
                          </div>
                          
                          <div className="space-y-2 text-xs font-bold divide-y divide-white/5 pt-1">
                            <div className="flex justify-between py-2">
                              <span className="text-gray-400 font-extrabold uppercase text-[10px]">Paket Sewa Utama ({formData.packageName}):</span>
                              <span className="text-gray-200">Rp {calculatedBills.basePrice.toLocaleString('id-ID')}</span>
                            </div>

                            {calculatedBills.itemsList.length > 0 ? (
                              <div className="pt-2.5 pb-1 text-xs space-y-1.5">
                                <span className="text-gray-400 font-extrabold uppercase text-[10px] block">Rincian Inventaris & Penataan:</span>
                                {calculatedBills.itemsList.map((itm, i) => (
                                  <div key={i} className="flex justify-between text-[11px] font-semibold text-gray-300">
                                    <span>• {itm.name} (x{itm.quantity})</span>
                                    <span>Rp {itm.cost.toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            <div className="flex justify-between py-2 text-gray-400 text-[10.5px]">
                              <span className="font-extrabold uppercase">Rencana Tata Ruang:</span>
                              <span className="text-amber-400 uppercase font-black tracking-wider">{layout.template} • {layout.stagePosition === 'depan' ? 'Panggung Depan' : layout.stagePosition === 'samping' ? 'Panggung Samping' : 'Tanpa Panggung'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Booking Summary parameters details */}
                        <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 uppercase">Pemegang Hak</span>
                              <p className="text-gray-900 line-clamp-1">{formData.customerName}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 uppercase">Tanggal Acara</span>
                              <p className="text-gray-900">{formData.startDate}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 uppercase">Mulai - Selesai</span>
                              <p className="text-gray-900">{formData.startTime} - {formData.endTime}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 uppercase">Keperluan</span>
                              <p className="text-gray-900 line-clamp-1">{formData.purpose}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-start gap-3 p-4 border border-gray-150 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors group">
                            <div className="relative flex items-center mt-1">
                              <input 
                                type="checkbox"
                                required
                                id="chk-agree"
                                checked={formData.agreeTerms}
                                onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:bg-primary checked:border-primary"
                              />
                              <CheckCircle2 className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[11px] font-bold text-gray-600 block group-hover:text-gray-900 transition-colors leading-relaxed">
                                Saya menyetujui <button type="button" onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }} className="text-primary underline hover:text-blue-700 font-extrabold">Syarat & Ketentuan</button> penyewaan Gedung Serbaguna Huntap Tondo 2 secara penuh.
                              </span>
                            </div>
                          </label>
                        </div>

                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest text-center leading-relaxed">
                            Formulir ini adalah permohonan digital resmi. Pengurus Gedung akan memvalidasi jadwal dan ketersediaan stok fisik gudang sebelum menghubungi Anda.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Core Step Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button 
                        type={step === 4 ? "submit" : "button"}
                        onClick={step < 4 ? nextStep : undefined}
                        disabled={isSubmitting}
                        className={`w-full py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 order-1 sm:order-2 ${step === 4 ? 'bg-green-500 hover:bg-green-600 shadow-green-200' : 'bg-primary hover:bg-blue-800 shadow-primary/20'} text-white`}
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {step === 4 ? (
                              <>
                                <Send className="w-4 h-4" />
                                Kirim Permohonan Sewa
                              </>
                            ) : (
                              <>
                                Lanjutkan Ke Tahap Berikutnya
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </>
                        )}
                      </button>

                      {step > 1 && (
                        <button 
                          type="button" 
                          onClick={prevStep}
                          className="w-full sm:w-auto px-8 bg-gray-100 text-gray-600 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all order-2 sm:order-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Kembali
                        </button>
                      )}
                    </div>

                    <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed pt-2">
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-gray-900">Syarat & Ketentuan</h4>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Penyewaan Gedung RT 02</p>
                </div>
                <button onClick={() => setIsTermsOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto">
                {TERMS.map((term, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="shrink-0 w-6 h-6 bg-blue-50 text-primary rounded-lg flex items-center justify-center text-[10px] font-black">
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">{term}</p>
                  </div>
                ))}
              </div>
              <div className="p-8 pt-0">
                <button 
                  onClick={() => setIsTermsOpen(false)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
