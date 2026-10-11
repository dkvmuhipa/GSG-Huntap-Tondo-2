import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, X, Plus, CheckCircle2, Save } from 'lucide-react';

export const DEFAULT_FACILITY_ICONS = [
  { name: 'Users2', label: 'Komunitas & Rapat' },
  { name: 'HeartHandshake', label: 'Pernikahan & Resepsi' },
  { name: 'Sparkles', label: 'Acara Khusus / Pesta' },
  { name: 'Dumbbell', label: 'Olahraga & Senam' },
  { name: 'Building', label: 'Lainnya / Umum' },
];

interface FacilityEditModalProps {
  editingFacility: any;
  onClose: () => void;
  onUpdateField: (field: string, value: any) => void;
  onToggleFeature: (feature: string) => void;
  onAddCustomFeature: (e: React.FormEvent) => void;
  onSave: () => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'success';
  iconOptions?: { name: string; label: string }[];
}

export default function FacilityEditModal({
  editingFacility,
  onClose,
  onUpdateField,
  onToggleFeature,
  onAddCustomFeature,
  onSave,
  saveStatus,
  iconOptions = DEFAULT_FACILITY_ICONS
}: FacilityEditModalProps) {
  if (!editingFacility) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
        >
          <div className="p-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Settings2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">Detail Paket Sewa</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Konfigurasi Fasilitas & Penawaran</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Fasilitas/Paket</label>
                <input 
                  type="text" 
                  value={editingFacility.title}
                  onChange={(e) => onUpdateField('title', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pilih Icon Representatif</label>
                <select 
                  value={editingFacility.iconName}
                  onChange={(e) => onUpdateField('iconName', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  {iconOptions.map(opt => (
                    <option key={opt.name} value={opt.name}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tarif Sewa (Format Bebas)</label>
                <input 
                  type="text" 
                  value={editingFacility.price}
                  onChange={(e) => onUpdateField('price', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/10 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Satuan Durasi</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Per Acara / Per Jam"
                  value={editingFacility.duration}
                  onChange={(e) => onUpdateField('duration', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-500 outline-none focus:ring-2 focus:ring-primary/10 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estimasi Kapasitas</label>
                <input 
                  type="text" 
                  placeholder="Contoh: 500 Orang"
                  value={editingFacility.capacity || ''}
                  onChange={(e) => onUpdateField('capacity', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onUpdateField('highlight', !editingFacility.highlight)}
                  className={`flex-1 p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${editingFacility.highlight ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
                >
                  {editingFacility.highlight ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  <span className="font-black text-xs uppercase tracking-widest">Tandai Populer</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Daftar Keunggulan/Fitur</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {(editingFacility.features || []).map((feat: string, i: number) => (
                  <div key={i} className="bg-blue-50 text-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-100 group">
                    {feat}
                    <button 
                      onClick={() => onToggleFeature(feat)}
                      className="p-1 hover:bg-white rounded-md text-primary/40 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <form onSubmit={onAddCustomFeature} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Tambah fitur (Contoh: Panggung Besar, AC, Kursi Lipat)"
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button type="submit" className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-colors">
                  <Plus className="w-6 h-6" />
                </button>
              </form>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Deskripsi Singkat (Opsional)</label>
              <textarea 
                rows={3}
                value={editingFacility.description || ''}
                onChange={(e) => onUpdateField('description', e.target.value)}
                placeholder="Tuliskan penjelasan singkat paket ini..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="pt-8 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Batalkan
              </button>
              <button 
                onClick={onSave}
                disabled={saveStatus === 'saving'}
                className="flex-[2] px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-3 disabled:opacity-75"
              >
                {saveStatus === 'saving' ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Simpan Perubahan Paket
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
