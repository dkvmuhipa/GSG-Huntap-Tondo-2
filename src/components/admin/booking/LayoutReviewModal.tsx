import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XCircle, LayoutGrid, Warehouse } from 'lucide-react';
import HallLayoutCanvas from '../../ui/HallLayoutCanvas';

interface LayoutReviewModalProps {
  selectedBooking: any;
  onClose: () => void;
  inventoryList: any[];
}

export default function LayoutReviewModal({
  selectedBooking,
  onClose,
  inventoryList,
}: LayoutReviewModalProps) {
  if (!selectedBooking) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] z-10"
        >
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <LayoutGrid className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xl font-black text-gray-900">Denah Ruang & Alat Dipesan</h3>
                <p className="text-xs text-gray-500 font-bold mt-1">Pemohon: {selectedBooking.customerName}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all rounded-2xl"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 block mb-3">
                Tata Letak Rencana Visual
              </span>
              <HallLayoutCanvas
                layoutData={{
                  template: selectedBooking.layoutDraft?.template || 'wedding',
                  stagePosition: selectedBooking.layoutDraft?.stagePosition || 'depan',
                  tableQuantity: selectedBooking.layoutDraft?.tableQuantity || 0,
                  chairQuantity: selectedBooking.layoutDraft?.chairQuantity || 0,
                  selectedElementIds: selectedBooking.layoutDraft?.selectedElementIds || []
                }}
                onChange={() => {}}
                interactive={false}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                <Warehouse className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Inventaris Untuk Acara Ini</h4>
              </div>

              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100/50 space-y-2.5">
                {Object.entries(selectedBooking.selectedInventory || {}).filter(([_, qty]) => Number(qty) > 0).length === 0 ? (
                  <p className="text-xs text-gray-400 font-bold italic py-2 text-center">Tidak memesan alat tambahan.</p>
                ) : (
                  Object.entries(selectedBooking.selectedInventory || {}).map(([id, qty]) => {
                    const invDoc = inventoryList.find(i => i.id === id);
                    const cleanName = invDoc ? invDoc.name : (id === 'inv-kursi' ? 'Kursi Lipat Chitose' : id === 'inv-meja' ? 'Meja Bulat Banquet' : id);
                    return (
                      <div key={id} className="flex justify-between items-center text-xs text-gray-700 font-bold border-b border-gray-150/50 pb-2 last:border-none last:pb-0">
                        <span className="text-gray-900">• {cleanName}</span>
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-primary font-mono font-black">
                          {qty as number} Unit
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
