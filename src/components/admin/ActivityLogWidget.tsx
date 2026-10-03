import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Wallet, 
  FileText, 
  User, 
  AlertTriangle 
} from 'lucide-react';
import { subscribeToAuditLogs, AdminActivityLog } from '../../lib/db';

export default function ActivityLogWidget() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuditLogs((data) => {
      setLogs(data);
      setIsLoading(false);
    }, 10);

    return () => unsub();
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes('APPROVED')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (action.includes('REJECTED') || action.includes('DELETED')) return <XCircle className="w-4 h-4 text-rose-500" />;
    if (action.includes('FINANCE') || action.includes('TRANSACTION')) return <Wallet className="w-4 h-4 text-primary" />;
    if (action.includes('CONFIG')) return <ShieldCheck className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  const formatLogTime = (createdAt: any) => {
    if (!createdAt) return 'Baru saja';
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt.seconds * 1000);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Log Aktivitas Pengurus</h3>
            <p className="text-xs text-gray-400 mt-0.5">Audit trail transparansi internal (tidak dapat dimanipulasi)</p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Audit
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-gray-400 animate-pulse">
          Memuat riwayat aktivitas...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          Belum ada catatan aktivitas pengurus baru.
        </div>
      ) : (
        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto pr-1">
          {logs.map((log, idx) => (
            <div key={log.id || idx} className="py-3 flex items-start gap-3 group hover:bg-gray-50/50 rounded-xl px-2 transition-colors">
              <div className="mt-0.5 shrink-0">
                {getActionIcon(log.action)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 leading-snug break-words">
                  {log.description}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-gray-400">
                  <span className="font-bold text-gray-600 flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-400" />
                    {log.actorName} ({log.actorRole})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-300" />
                    {formatLogTime(log.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
