import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  User as UserIcon, 
  Upload, 
  Receipt, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  Loader,
  Search
} from 'lucide-react';

interface TransactionTableProps {
  filteredTransactions: any[];
  allTransactions: any[];
  transactions: any[];
  displayCategory: (cat: string) => string;
  downloadKwitansi: (tx: any) => void;
  handleEdit: (tx: any) => void;
  handleDeleteTransaction: (id: string, info: string) => void;
  isLoadingMore: boolean;
  limitCount: number;
  setLimitCount: React.Dispatch<React.SetStateAction<number>> | ((val: number | ((prev: number) => number)) => void);
}

export default function TransactionTable({
  filteredTransactions,
  allTransactions,
  transactions,
  displayCategory,
  downloadKwitansi,
  handleEdit,
  handleDeleteTransaction,
  isLoadingMore,
  limitCount,
  setLimitCount
}: TransactionTableProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden" id="transaction-table-section">
      {/* Desktop View Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Tanggal</th>
              <th className="px-8 py-5">Keterangan</th>
              <th className="px-8 py-5">Total Transaksi</th>
              <th className="px-8 py-5 text-accent text-center">Alokasi Dana Peng.</th>
              <th className="px-8 py-5">Input Oleh</th>
              <th className="px-8 py-5 text-right pr-12">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTransactions.length === 0 ? (
              <tr key="no-data">
                <td colSpan={7} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-bold text-gray-900">Data Tidak Ditemukan</p>
                    <p className="text-sm text-gray-400">Coba ubah filter atau kata kunci pencarian anda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => (
                <tr 
                  key={t.id}
                  className="group hover:bg-gray-50/50 transition-colors"
                >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {t.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${t.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {t.status === 'completed' ? 'SELESAI' : t.status === 'pending' ? 'PENDING' : 'BATAL'}
                        </span>
                        {t.type === 'reallocation' && (
                           <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-1">Transfer</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-gray-700">{t.date}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{t.source}</p>
                      {t.organizerName ? (
                        <p className="text-[10px] text-primary font-black uppercase mt-0.5 tracking-wider">
                          Penyelenggara: {t.organizerName} ({t.organizerType || 'Perorangan'})
                        </p>
                      ) : (t.organizerType && t.organizerType !== 'Perorangan / Keluarga' && (
                        <p className="text-[10px] text-primary font-black uppercase mt-0.5 tracking-wider">
                          Kategori Penyelenggara: {t.organizerType}
                        </p>
                      ))}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {t.receiptNo && (
                          <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wide border border-indigo-100 font-mono">
                            {t.receiptNo}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 bg-gray-100 rounded-md uppercase tracking-wider">
                          {displayCategory(t.category)}
                        </span>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest italic">
                          {t.paymentMethod === 'cash' ? 'TUNAI' : t.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${t.type === 'income' ? 'text-emerald-500' : t.type === 'reallocation' ? 'text-accent' : 'text-red-500'}`}>
                          {t.type === 'income' ? '• Pemasukan' : t.type === 'reallocation' ? '• Reallokasi' : '• Pengeluaran'}
                        </span>
                      </div>
                      {t.notes && (
                        <p className="text-[10px] text-gray-400 mt-2 italic max-w-md line-clamp-1">"{t.notes}"</p>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-sm font-black ${t.type === 'income' ? 'text-gray-900' : t.type === 'reallocation' ? 'text-accent italic' : 'text-red-500'}`}>
                         {t.type === 'income' ? '+' : t.type === 'reallocation' ? '' : '-'} {t.type === 'reallocation' ? 'PENYESUAIAN' : `Rp ${Math.abs(t.amount).toLocaleString('id-ID')}`}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        {t.devFund !== 0 ? (
                          <div className="flex flex-col items-center">
                            <span className={`${t.devFund > 0 ? 'bg-accent/10 text-accent' : 'bg-red-50 text-accent'} px-3 py-1 rounded-full text-[10px] font-black tracking-tight`}>
                              {t.devFund > 0 ? '+' : ''}Rp {Math.floor(t.devFund).toLocaleString('id-ID')}
                            </span>
                            {t.type === 'income' && (
                              <span className="text-[8px] font-bold text-gray-300 uppercase mt-1">
                                {t.allocationMode === 'full_dev' ? 'MANUAL 100%' : t.allocationMode === 'full_ops' ? 'MANUAL 0%' : 'AUTO SPLIT'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserIcon className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 truncate max-w-[100px]">{t.addedBy?.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right pr-12">
                      <div className="flex justify-end items-center gap-2">
                        {t.receiptUrl && (
                          <a 
                            href={t.receiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary bg-blue-50 hover:bg-blue-100 transition-all shadow-sm"
                            title="Lihat Bukti Upload"
                          >
                            <Upload className="w-4 h-4" />
                          </a>
                        )}
                        {t.type === 'income' && (
                          <button 
                            onClick={() => downloadKwitansi(t)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all shadow-sm"
                            title="Download Kwitansi PDF"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(t)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-blue-50 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                          title="Edit Transaksi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id, `${t.source} - Rp ${t.amount.toLocaleString()}`)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>

      {/* Mobile View Card List */}
      <div className="lg:hidden p-4 space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="py-20 text-center italic text-gray-300 font-bold">Data transaksi tidak ditemukan...</div>
        ) : (
          filteredTransactions.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4"
            >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.date}</p>
                      {t.receiptNo && (
                        <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-mono">
                          {t.receiptNo}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-gray-900 mt-1 leading-tight">{t.source}</h4>
                    {t.organizerName ? (
                      <p className="text-[10px] text-primary font-black uppercase mt-0.5 tracking-wider">
                        Penyelenggara: {t.organizerName} ({t.organizerType || 'Perorangan'})
                      </p>
                    ) : (t.organizerType && t.organizerType !== 'Perorangan / Keluarga' && (
                      <p className="text-[10px] text-primary font-black uppercase mt-0.5 tracking-wider">
                        Kategori Penyelenggara: {t.organizerType}
                      </p>
                    ))}
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1 ${t.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {t.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {t.status.toUpperCase()}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Nominal</p>
                    <p className={`text-lg font-black ${t.type === 'income' ? 'text-gray-900' : t.type === 'reallocation' ? 'text-amber-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : t.type === 'reallocation' ? '' : '-'} Rp {Math.abs(t.amount).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {t.devFund !== 0 && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Saving 20%</p>
                      <p className="text-xs font-black text-accent">{t.devFund > 0 ? '+' : ''}Rp {Math.floor(Math.abs(t.devFund)).toLocaleString('id-ID')}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-bold text-gray-400 px-2 py-1 bg-gray-100 rounded-md uppercase tracking-wider">{displayCategory(t.category)}</span>
                  <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-tighter italic">{t.paymentMethod?.toUpperCase()}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {t.receiptUrl && (
                    <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-primary py-3 rounded-xl border border-blue-100 font-black text-[10px] uppercase tracking-widest">
                      <Upload className="w-4 h-4" /> Bukti
                    </a>
                  )}
                  {t.type === 'income' && (
                    <button onClick={() => downloadKwitansi(t)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-3 rounded-xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest">
                      <Receipt className="w-4 h-4" /> Kwitansi
                    </button>
                  )}
                  <button onClick={() => handleEdit(t)} className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-500 rounded-xl border border-gray-100">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteTransaction(t.id, `${t.source} - Rp ${t.amount.toLocaleString()}`)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-400 rounded-xl border border-red-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
      </div>

      {/* Pagination controls */}
      <div className="border-t border-gray-100 px-8 py-6 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-gray-500 font-medium">
          {isLoadingMore ? (
            <div className="flex items-center gap-2">
              <Loader className="w-3.5 h-3.5 text-primary animate-spin" />
              <span>Menghubungkan ke server & menyinkronkan data...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <span>Tidak ada data transaksi yang dapat ditampilkan.</span>
          ) : transactions.length >= allTransactions.length ? (
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Semua total {allTransactions.length} riwayat transaksi telah termuat & tersedia offline ✨
            </span>
          ) : (
            <span>
              Menampilkan <strong className="text-gray-900 font-semibold">{filteredTransactions.length}</strong> dari <strong className="text-gray-900 font-semibold">{transactions.length}</strong> data terunduh (Total: <strong className="text-gray-900 font-semibold">{allTransactions.length}</strong> transaksi di sistem)
            </span>
          )}
        </div>

        {transactions.length < allTransactions.length && (
          <button
            onClick={() => setLimitCount(prev => prev + 20)}
            disabled={isLoadingMore}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white border border-gray-200 hover:border-primary text-gray-700 hover:text-primary font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            id="btn-load-more"
          >
            {isLoadingMore ? (
              <>
                <Loader className="w-3.5 h-3.5 animate-spin text-primary" />
                Memuat...
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Muat Lebih Banyak
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
