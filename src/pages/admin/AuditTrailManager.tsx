import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Shield, 
  Clock, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  Info, 
  X, 
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit as firestoreLimit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminActivityLog } from '../../lib/db';
import { exportAuditLogsToExcel } from '../../services/excelExportService';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';

export default function AuditTrailManager() {
  const { userRole } = useOutletContext<{ userRole: string; adminProfile: any }>();
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchLimit, setFetchLimit] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedLogDetail, setSelectedLogDetail] = useState<AdminActivityLog | null>(null);

  // Subscribe to audit logs real-time
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, 'audit_logs');
    const q = query(colRef, orderBy('createdAt', 'desc'), firestoreLimit(fetchLimit));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminActivityLog[];
      setLogs(fetchedLogs);
      setLoading(false);
    }, (err) => {
      console.warn('Error reading audit logs:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchLimit]);

  // Keyboard Escape listener for Detail Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLogDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter logs based on search and category
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || 
        (log.description && log.description.toLowerCase().includes(q)) ||
        (log.actorName && log.actorName.toLowerCase().includes(q)) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.targetId && log.targetId.toLowerCase().includes(q));

      const matchAction = selectedActionFilter === 'all' || 
        (selectedActionFilter === 'create' && (log.action.includes('ADD') || log.action.includes('CREATE') || log.action.includes('BOOKING_CREATE'))) ||
        (selectedActionFilter === 'update' && (log.action.includes('UPDATE') || log.action.includes('SYNC') || log.action.includes('EDIT'))) ||
        (selectedActionFilter === 'delete' && (log.action.includes('DELETE') || log.action.includes('REMOVE'))) ||
        (selectedActionFilter === 'approve' && (log.action.includes('APPROVE') || log.action.includes('VERIF'))) ||
        (selectedActionFilter === 'booking' && log.action.toLowerCase().includes('booking')) ||
        (selectedActionFilter === 'finance' && (log.action.toLowerCase().includes('finance') || log.action.toLowerCase().includes('trans')));

      const matchRole = selectedRoleFilter === 'all' || (log.actorRole || '').toLowerCase() === selectedRoleFilter.toLowerCase();

      return matchSearch && matchAction && matchRole;
    });
  }, [logs, searchQuery, selectedActionFilter, selectedRoleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const today = new Date().toDateString();
    
    const todayCount = logs.filter(l => {
      if (!l.createdAt) return false;
      const d = l.createdAt.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
      return d.toDateString() === today;
    }).length;

    // Top active actor
    const actorCounts: Record<string, number> = {};
    logs.forEach(l => {
      const name = l.actorName || l.actorEmail || 'Admin';
      actorCounts[name] = (actorCounts[name] || 0) + 1;
    });

    let topActor = '-';
    let maxCount = 0;
    Object.entries(actorCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topActor = name;
      }
    });

    return { total, todayCount, topActor, maxCount };
  }, [logs]);

  // Format timestamp
  const formatTimestamp = (createdAt: any) => {
    if (!createdAt) return '-';
    try {
      const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WITA';
    } catch {
      return String(createdAt);
    }
  };

  // Action badge style
  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('REJECT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-[10px] font-black tracking-wider uppercase border border-red-100">
          <Trash2 className="w-3 h-3" />
          {act}
        </span>
      );
    }
    if (act.includes('APPROVE') || act.includes('VERIF')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wider uppercase border border-emerald-100">
          <CheckCircle2 className="w-3 h-3" />
          {act}
        </span>
      );
    }
    if (act.includes('ADD') || act.includes('CREATE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black tracking-wider uppercase border border-blue-100">
          <PlusCircle className="w-3 h-3" />
          {act}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black tracking-wider uppercase border border-amber-100">
        <Edit3 className="w-3 h-3" />
        {act}
      </span>
    );
  };

  // Role badge
  const getRoleBadge = (role: string) => {
    const r = (role || 'admin').toLowerCase();
    if (r === 'owner') return <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase">Owner</span>;
    if (r === 'bendahara') return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">Bendahara</span>;
    if (r === 'finance') return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">Finance</span>;
    if (r === 'editor') return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase">Editor</span>;
    return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-extrabold uppercase">Admin</span>;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold mb-3">
            <History className="w-4 h-4" />
            <span>Audit Trail & Rekam Jejak Sistem</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Log Aktivitas Pengurus</h2>
          <p className="text-gray-500 text-sm mt-1 max-w-xl">
            Pencatatan real-time yang tidak dapat diubah (immutable) atas seluruh aksi perubahan data, persetujuan booking, kas keuangan, dan mutasi data oleh administrator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => exportAuditLogsToExcel(filteredLogs)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
            title="Ekspor seluruh rekaman log ini ke Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Total Log Dimuat</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-primary flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-1">Dari batas {fetchLimit} entri terakhir</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Aktivitas Hari Ini</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700">{stats.todayCount}</p>
          <p className="text-xs text-gray-400 mt-1">Tindakan tercatat hari ini</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Pengurus Teraktif</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-black text-gray-900 truncate" title={stats.topActor}>{stats.topActor}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.maxCount} tindakan dicatat</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari deskripsi, nama pengurus, email..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Action Type Filter */}
            <div className="relative">
              <select
                value={selectedActionFilter}
                onChange={(e) => setSelectedActionFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200/80 px-4 py-3 pr-9 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-primary"
              >
                <option value="all">Semua Tipe Aksi</option>
                <option value="create">Tambah Data (Create)</option>
                <option value="update">Ubah / Sync (Update)</option>
                <option value="delete">Hapus (Delete)</option>
                <option value="approve">Persetujuan (Approve)</option>
                <option value="booking">Modul Booking</option>
                <option value="finance">Modul Keuangan</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200/80 px-4 py-3 pr-9 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-primary"
              >
                <option value="all">Semua Peran / Role</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="bendahara">Bendahara</option>
                <option value="finance">Finance</option>
                <option value="editor">Editor</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Log Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-semibold text-sm">Memuat rekam jejak aktivitas...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-4">
              <History className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-gray-800">Tidak ada riwayat aktivitas</h4>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              Tidak ditemukan data log yang sesuai dengan kata kunci pencarian atau filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="py-4 px-6">Waktu Kejadian</th>
                  <th className="py-4 px-6">Aksi & Modul</th>
                  <th className="py-4 px-6">Keterangan Aktivitas</th>
                  <th className="py-4 px-6">Pelaksana / Admin</th>
                  <th className="py-4 px-6 text-right">Opsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/70 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatTimestamp(log.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 line-clamp-2">
                        {log.description || '-'}
                      </div>
                      {log.targetId && (
                        <span className="inline-block mt-1 font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          ID: {log.targetId.substring(0, 12)}...
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900">{log.actorName || 'Admin'}</span>
                          {getRoleBadge(log.actorRole)}
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">{log.actorEmail || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLogDetail(log)}
                        className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200/70 hover:bg-primary hover:border-primary hover:text-white text-gray-700 font-bold text-[11px] transition-all"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Button */}
        {logs.length >= fetchLimit && (
          <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => setFetchLimit(prev => prev + 50)}
              className="px-6 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              Muat 50 Riwayat Terdahulu
            </button>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLogDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative"
            >
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="absolute right-5 top-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Tutup Detail"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Rincian Audit Trail</h3>
                  <p className="text-xs text-gray-400">ID Entri: {selectedLogDetail.id || '-'}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 uppercase font-black text-[10px] tracking-wider">Aksi</span>
                    {getActionBadge(selectedLogDetail.action)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 uppercase font-black text-[10px] tracking-wider">Waktu</span>
                    <span className="font-bold text-gray-800">{formatTimestamp(selectedLogDetail.createdAt)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-gray-400 block mb-1.5">
                    Keterangan Aktivitas
                  </label>
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white font-medium text-xs leading-relaxed">
                    {selectedLogDetail.description || '-'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-black block mb-1">Nama Petugas</span>
                    <p className="font-bold text-gray-900 truncate">{selectedLogDetail.actorName || 'Admin'}</p>
                    <div className="mt-1">{getRoleBadge(selectedLogDetail.actorRole)}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-black block mb-1">Email Petugas</span>
                    <p className="font-mono text-gray-700 truncate" title={selectedLogDetail.actorEmail}>{selectedLogDetail.actorEmail || '-'}</p>
                  </div>
                </div>

                {selectedLogDetail.targetId && (
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-gray-400 block mb-1.5">
                      Referensi Target ID
                    </label>
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 font-mono text-gray-600 text-[11px] select-all">
                      {selectedLogDetail.targetId}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLogDetail(null)}
                  className="px-6 py-2.5 rounded-2xl bg-gray-900 text-white font-bold text-xs hover:bg-black transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
