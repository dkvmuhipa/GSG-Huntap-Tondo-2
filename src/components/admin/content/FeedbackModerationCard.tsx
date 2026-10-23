import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, CheckCircle2, EyeOff, Trash2, Clock, Check, Filter } from 'lucide-react';
import { subscribeToAllFeedback, updateFeedbackStatus, removeFeedback, FeedbackItem } from '../../../lib/db';

export default function FeedbackModerationCard() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllFeedback((items) => {
      setFeedbacks(items);
    });
    return () => unsub();
  }, []);

  const pendingCount = feedbacks.filter((f) => f.status === 'pending').length;
  const approvedCount = feedbacks.filter((f) => f.status === 'approved').length;

  const filteredList = feedbacks.filter((f) => (filter === 'all' ? true : f.status === filter));

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(id);
      await updateFeedbackStatus(id, status);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setProcessingId(id);
      await removeFeedback(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 leading-tight">Moderasi Ulasan & Testimoni Penyewa</h3>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 animate-pulse">
                  {pendingCount} Menunggu
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Setujui ulasan positif warga untuk ditampilkan pada carousel testimoni di halaman depan website.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {[
            { id: 'all', label: `Semua (${feedbacks.length})` },
            { id: 'pending', label: `Menunggu (${pendingCount})` },
            { id: 'approved', label: `Tampil (${approvedCount})` },
            { id: 'rejected', label: 'Disembunyikan' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">Belum ada ulasan warga pada kategori filter ini.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Saat ini halaman publik menampilkan 3 testimoni arsip standar hingga ada ulasan warga yang disetujui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                item.status === 'pending'
                  ? 'bg-amber-50/40 border-amber-200/80'
                  : item.status === 'approved'
                  ? 'bg-emerald-50/30 border-emerald-200/70'
                  : 'bg-slate-50 border-slate-200/70 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-black text-slate-900 text-xs">{item.name}</h4>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {item.eventType || 'Acara Warga'} • {item.eventDate || '-'}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      item.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.status === 'approved' ? 'Tampil Publik' : item.status === 'pending' ? 'Menunggu' : 'Disembunyikan'}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`w-3.5 h-3.5 ${
                        idx < (item.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic bg-white/80 p-3 rounded-xl border border-slate-100">
                  "{item.comment}"
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/50">
                {item.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={processingId === item.id}
                    onClick={() => handleStatusChange(item.id, 'approved')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Setujui Tampil
                  </button>
                )}
                {item.status !== 'rejected' && (
                  <button
                    type="button"
                    disabled={processingId === item.id}
                    onClick={() => handleStatusChange(item.id, 'rejected')}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Sembunyikan
                  </button>
                )}
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all disabled:opacity-50"
                  title="Hapus Ulasan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
