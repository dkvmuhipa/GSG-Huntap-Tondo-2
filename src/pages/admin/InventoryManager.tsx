import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  AlertCircle,
  CheckCircle2,
  Wrench,
  History,
  ArrowRight,
  X,
  ChevronDown,
  Package,
  Tag,
  Layers
} from 'lucide-react';
import { db, handleFirestoreError, OperationType, auth } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useAppStore } from '../../store/useAppStore';

interface InventoryItem {
  id: string;
  name: string;
  totalQuantity: number;
  goodQuantity: number;
  brokenQuantity: number;
  category: string;
  lastUpdated: any;
}

interface MaintenanceLog {
  id: string;
  itemId?: string;
  itemName?: string;
  action: string;
  date: string;
  performedBy: string;
  notes: string;
}

export default function InventoryManager() {
  const items = useAppStore(state => state.inventory);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs'>('inventory');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    totalQuantity: 0,
    goodQuantity: 0,
    brokenQuantity: 0,
    category: 'Fasilitas Utama'
  });

  // Keyboard Escape listener
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    let unsubLogs: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubLogs = onSnapshot(query(collection(db, 'maintenance_logs'), orderBy('date', 'desc')), (snap) => {
          setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceLog)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'maintenance_logs'));
      } else {
        if (unsubLogs) {
          unsubLogs();
          unsubLogs = null;
        }
        setLogs([]);
      }
    });

    return () => {
      if (unsubLogs) {
        unsubLogs();
      }
      unsubAuth();
    };
  }, []);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const invPath = 'inventory';
    const logPath = 'maintenance_logs';
    try {
      const data = {
        ...formData,
        lastUpdated: serverTimestamp()
      };

      if (editingItem) {
        try {
          await updateDoc(doc(db, invPath, editingItem.id), data);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `${invPath}/${editingItem.id}`);
        }
        
        // Add log entry for change
        try {
          await addDoc(collection(db, logPath), {
            itemName: data.name,
            action: 'Update Stok/Kondisi',
            date: new Date().toISOString().split('T')[0],
            performedBy: 'Admin',
            notes: `Update kuantitas: Baik(${data.goodQuantity}), Rusak(${data.brokenQuantity})`
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, logPath);
        }
      } else {
        try {
          await addDoc(collection(db, invPath), data);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, invPath);
        }
        
        try {
          await addDoc(collection(db, logPath), {
            itemName: data.name,
            action: 'Item Baru Terdaftar',
            date: new Date().toISOString().split('T')[0],
            performedBy: 'Admin',
            notes: `Pendaftaran aset baru ke dalam sistem.`
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, logPath);
        }
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ name: '', totalQuantity: 0, goodQuantity: 0, brokenQuantity: 0, category: 'Fasilitas Utama' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus ${name} dari inventaris?`)) {
      const invPath = 'inventory';
      try {
        await deleteDoc(doc(db, invPath, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${invPath}/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Aset & Log</h2>
          <p className="text-gray-500 text-sm mt-1">Pantau ketersediaan barang dan histori pemeliharaan gedung.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-gray-100 p-1.5 rounded-2xl flex items-center gap-1">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              Inventaris
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              Log Maintenance
            </button>
          </div>
          
          {activeTab === 'inventory' && (
            <button 
              onClick={() => {
                setEditingItem(null);
                setFormData({ name: '', totalQuantity: 0, goodQuantity: 0, brokenQuantity: 0, category: 'Fasilitas Utama' });
                setIsModalOpen(true);
              }}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              TAMBAH ASET
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'inventory' ? (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {items.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
                    <Box className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setEditingItem(item);
                        setFormData({
                          name: item.name,
                          totalQuantity: item.totalQuantity,
                          goodQuantity: item.goodQuantity,
                          brokenQuantity: item.brokenQuantity,
                          category: item.category
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-300 hover:text-primary transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/10">
                    {item.category}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-3">{item.name}</h3>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-gray-50 border border-gray-100 text-center">
                    <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-base sm:text-xl font-black text-gray-900">{item.totalQuantity}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-emerald-50/50 border border-emerald-100 text-center">
                    <p className="text-[8px] sm:text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Baik</p>
                    <p className="text-base sm:text-xl font-black text-emerald-600">{item.goodQuantity}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-red-50/50 border border-red-100 text-center">
                    <p className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Rusak</p>
                    <p className="text-base sm:text-xl font-black text-red-600">{item.brokenQuantity}</p>
                  </div>
                </div>

                {item.brokenQuantity > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <p className="text-[10px] font-bold text-orange-600">Perlu perbaikan segera</p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu & User</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aset / Item</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tindakan</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <History className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900">{log.date}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">{log.performedBy}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-gray-900">{log.itemName || 'Gedung'}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          log.action.includes('Bersih') ? 'bg-emerald-50 text-emerald-600' :
                          log.action.includes('Perbaikan') ? 'bg-orange-50 text-orange-600' :
                          'bg-primary/5 text-primary'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-500 italic max-w-xs">{log.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Tambah/Edit Item */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 overflow-hidden border border-slate-100 z-10"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-600" />
              
              <div className="flex justify-between items-start mb-6 pt-1">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-primary border border-blue-200/80 inline-block mb-1.5">
                    Logistik & Gudang GSG
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {editingItem ? 'Edit Aset Inventaris' : 'Tambah Aset Baru'}
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Pencatatan rincian jumlah & status kelaikan fisik barang.
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4"/>
                </button>
              </div>
              
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                    <Package className="w-3.5 h-3.5 text-primary" />
                    <span>Nama Item / Barang</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Kursi Lipat Chitose / Meja Bulat"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Kategori</span>
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer pr-10"
                      >
                        <option>Fasilitas Utama</option>
                        <option>Sound System</option>
                        <option>Peralatan Dapur</option>
                        <option>Pendingin Ruangan</option>
                        <option>Lainnya</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Total Stok (Unit)</span>
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input 
                      required
                      type="number"
                      min={0}
                      value={formData.totalQuantity}
                      onChange={(e) => setFormData({...formData, totalQuantity: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 font-mono outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kondisi Baik</span>
                    </label>
                    <input 
                      required
                      type="number"
                      min={0}
                      value={formData.goodQuantity}
                      onChange={(e) => setFormData({...formData, goodQuantity: parseInt(e.target.value) || 0})}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-black text-emerald-700 font-mono outline-none focus:ring-3 focus:ring-emerald-500/20 transition-all"
                    />
                    <p className="text-[9px] text-emerald-600 font-medium">Siap dipinjamkan</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-1.5">
                    <label className="text-[10px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Kondisi Rusak</span>
                    </label>
                    <input 
                      required
                      type="number"
                      min={0}
                      value={formData.brokenQuantity}
                      onChange={(e) => setFormData({...formData, brokenQuantity: parseInt(e.target.value) || 0})}
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-sm font-black text-rose-700 font-mono outline-none focus:ring-3 focus:ring-rose-500/20 transition-all"
                    />
                    <p className="text-[9px] text-rose-600 font-medium">Perlu perbaikan</p>
                  </div>
                </div>

                <div className="pt-3 flex gap-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 font-black text-xs text-slate-700 uppercase tracking-wider transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-primary hover:bg-blue-800 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-[0.99] transition-all"
                  >
                    Simpan Aset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
