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
              <h3 className="font-semibold text-[#171717] leading-tight">Moderasi Ulasan & Testimoni Penyewa</h3>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                  {pendingCount} Menunggu
                </span>
              )}
            </div>
            <p className="text-xs text-[#737373] mt-0.5">
              Setujui ulasan positif warga untuk ditampilkan pada carousel testimoni di halaman depan website.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-[#F4F4F5] p-1 rounded-lg border border-[#E4E4E7] self-start sm:self-auto">
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
              className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono tabular-nums transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-white text-[#171717] shadow-xs border border-[#E4E4E7]'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="text-center py-10 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E4E4E7]">
          <MessageSquare className="w-7 h-7 text-[#A1A1AA] mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-xs font-medium text-[#525252]">Belum ada ulasan warga pada kategori filter ini.</p>
          <p className="text-[11px] text-[#737373] mt-0.5">
            Saat ini halaman publik menampilkan 3 testimoni arsip standar hingga ada ulasan warga yang disetujui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-4 ${
                item.status === 'pending'
                  ? 'bg-[#FFFBEB]/60 border-[#FDE68A]'
                  : item.status === 'approved'
                  ? 'bg-[#F0FDF4]/50 border-[#BBF7D0]'
                  : 'bg-[#FAFAFA] border-[#E4E4E7] opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-semibold text-[#171717] text-xs">{item.name}</h4>
                    <span className="text-[11px] font-mono tabular-nums text-[#737373]">
                      {item.eventType || 'Acara Warga'} · {item.eventDate || '-'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border shrink-0 ${
                      item.status === 'approved'
                        ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                        : item.status === 'pending'
                        ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                        : 'bg-[#F4F4F5] text-[#525252] border-[#E4E4E7]'
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
                        idx < (item.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-[#D4D4D8]'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-[#525252] leading-relaxed bg-white p-3 rounded-lg border border-[#E4E4E7]">
                  "{item.comment}"
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E4E7]">
                {item.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={processingId === item.id}
                    onClick={() => handleStatusChange(item.id, 'approved')}
                    className="px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
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
                    className="px-3 py-1.5 rounded-lg bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#171717] border border-[#E4E4E7] text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Sembunyikan
                  </button>
                )}
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] transition-colors disabled:opacity-50 cursor-pointer"
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
