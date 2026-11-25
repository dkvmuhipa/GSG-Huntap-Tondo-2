import React, { useState } from 'react';
import { BellRing, CreditCard, Clock, MessageCircle, Check, Loader2, ArrowRight } from 'lucide-react';
import { getLocalDateISO, getOffsetLocalDateISO } from '../../../lib/dateUtils';
import { notifyCitizenHMinus1Reminder } from '../../../services/whatsappGatewayService';

interface BookingActionAlertsProps {
  bookings: any[];
  config: any;
  onFilterVerifying: () => void;
  onNotifyResult: (success: boolean, message: string) => void;
}

export default function BookingActionAlerts({
  bookings,
  config,
  onFilterVerifying,
  onNotifyResult,
}: BookingActionAlertsProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Record<string, boolean>>({});

  const todayStr = getLocalDateISO();
  const tomorrowStr = getOffsetLocalDateISO(1);

  const tomorrowBookings = bookings.filter(
    (b) => (b.status === 'approved' || b.status === 'completed') && b.startDate === tomorrowStr
  );
  const verifyingBookings = bookings.filter((b) => b.paymentStatus === 'verifying');
  const unpaidApprovedBookings = bookings.filter(
    (b) => b.status === 'approved' && b.paymentStatus === 'unpaid' && (b.startDate || '') >= todayStr
  );

  if (
    tomorrowBookings.length === 0 &&
    verifyingBookings.length === 0 &&
    unpaidApprovedBookings.length === 0
  ) {
    return null;
  }

  const handleSendHMinus1 = async (booking: any) => {
    setSendingId(booking.id);
    try {
      const res = await notifyCitizenHMinus1Reminder(booking, config);
      if (res.sent) {
        setSentIds((prev) => ({ ...prev, [booking.id]: true }));
        onNotifyResult(true, `Pengingat H-1 berhasil dikirim ke ${booking.customerName}.`);
      } else {
        onNotifyResult(false, res.message || 'Gagal mengirim pengingat WhatsApp.');
      }
    } catch (err: any) {
      onNotifyResult(false, err?.message || 'Terjadi kesalahan saat mengirim pengingat.');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="bg-white border border-[#E4E4E7] border-l-4 border-l-[#B45309] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">Perlu Tindakan Hari Ini</h3>
            <p className="text-xs text-[#737373]">
              Ringkasan prioritas acara besok (H-1), verifikasi bukti bayar, dan tindak lanjut DP.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {tomorrowBookings.length > 0 && (
          <div className="lg:col-span-2 bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#15803D] flex items-center gap-1.5 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                Acara Besok ({tomorrowStr}) · {tomorrowBookings.length} Jadwal
              </span>
            </div>
            <div className="space-y-2">
              {tomorrowBookings.map((b) => {
                const isSent = !!sentIds[b.id];
                const isSending = sendingId === b.id;
                return (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white border border-[#E4E4E7]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#171717] truncate">
                        {b.purpose || 'Acara Warga'} — {b.customerName}
                      </p>
                      <p className="text-[11px] font-mono tabular-nums text-[#737373] mt-0.5">
                        {b.startTime || '08:00'} - {b.endTime || '17:00'} WITA ·{' '}
                        {b.paymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSending || isSent}
                      onClick={() => handleSendHMinus1(b)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer disabled:opacity-65 ${
                        isSent
                          ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                          : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
                      }`}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengirim...</span>
                        </>
                      ) : isSent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Pengingat Terkirim</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Kirim Pengingat H-1 (WA)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(verifyingBookings.length > 0 || unpaidApprovedBookings.length > 0) && (
          <div className={`${tomorrowBookings.length === 0 ? 'lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'}`}>
            {verifyingBookings.length > 0 && (
              <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-[#1E40AF] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Bukti Transfer Masuk
                  </span>
                  <p className="text-sm font-semibold font-mono tabular-nums text-[#171717] mt-1">
                    {verifyingBookings.length} Pembayaran Menunggu Verifikasi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onFilterVerifying}
                  className="px-3.5 py-2 rounded-lg bg-[#1E40AF] hover:bg-[#1D3A8A] text-white text-xs font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <span>Tinjau</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {unpaidApprovedBookings.length > 0 && (
              <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-[#B45309] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Tagihan DP Aktif
                  </span>
                  <p className="text-sm font-semibold font-mono tabular-nums text-[#171717] mt-1">
                    {unpaidApprovedBookings.length} Jadwal Disetujui Belum Lunas
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-[11px] font-medium shrink-0">
                  Perlu Tindak Lanjut
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
