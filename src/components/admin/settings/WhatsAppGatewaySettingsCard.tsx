import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  ExternalLink, 
  Save, 
  Eye, 
  EyeOff, 
  Radio, 
  Bell, 
  Zap, 
  HelpCircle 
} from 'lucide-react';
import { 
  WhatsAppGatewayConfig, 
  DEFAULT_WA_GATEWAY_CONFIG, 
  subscribeToWhatsAppGatewayConfig, 
  updateWhatsAppGatewayConfig, 
  testWhatsAppGatewayConnection 
} from '../../../services/whatsappGatewayService';

export default function WhatsAppGatewaySettingsCard() {
  const [config, setConfig] = useState<WhatsAppGatewayConfig>(DEFAULT_WA_GATEWAY_CONFIG);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test message states
  const [testPhone, setTestPhone] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToWhatsAppGatewayConfig((data) => {
      setConfig(data);
      if (data.adminNotificationPhone && !testPhone) {
        setTestPhone(data.adminNotificationPhone);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateWhatsAppGatewayConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save WA gateway config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!testPhone) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testWhatsAppGatewayConnection(testPhone, config);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal mengirim pesan uji coba.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-tight">Integrasi WhatsApp Gateway Otomatis</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Kirim konfirmasi reservasi, kuitansi lunas, dan alert booking baru otomatis ke WhatsApp tanpa klik manual.
            </p>
          </div>
        </div>

        {/* Master Active Toggle */}
        <label className="inline-flex items-center gap-3 cursor-pointer shrink-0">
          <span className="text-xs font-bold text-gray-700">
            {config.enabled ? 'Otomasi Aktif' : 'Nonaktif'}
          </span>
          <div className="relative">
            <input 
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
          </div>
        </label>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
            Pilihan Provider Gateway
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'fonnte', name: 'Fonnte (Rekomendasi)', desc: 'Setup instan, stabil & mudah digunakan' },
              { id: 'wablas', name: 'Wablas API', desc: 'Enterprise gateway multi-device' },
              { id: 'custom_webhook', name: 'Custom Webhook', desc: 'Integrasi URL endpoint / server sendiri' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setConfig({ ...config, provider: p.id as any })}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  config.provider === p.id 
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' 
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-gray-900">{p.name}</span>
                  {config.provider === p.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">{p.desc}</p>
              </button>
            ))}
          </div>

          {config.provider === 'fonnte' && (
            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
              <span>Belum punya akun Fonnte?</span>
              <a 
                href="https://fonnte.com" 
                target="_blank" 
                rel="noreferrer" 
                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5"
              >
                Daftar gratis di Fonnte.com <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          )}
        </div>

        {/* API Key / Token */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
              API Token / Secret Key ({config.provider.toUpperCase()})
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Masukkan API Token gateway..."
                className="w-full pl-4 pr-11 py-3 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs font-medium text-gray-800 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Toggle password visibility"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
              Nomor WhatsApp Admin (Notifikasi Booking Baru)
            </label>
            <div className="relative">
              <input
                type="text"
                value={config.adminNotificationPhone || ''}
                onChange={(e) => setConfig({ ...config, adminNotificationPhone: e.target.value })}
                placeholder="Contoh: 081234567890"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs font-medium text-gray-800 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Custom Webhook URL if applicable */}
        {config.provider === 'custom_webhook' && (
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
              URL Endpoint Webhook Kustom (POST)
            </label>
            <input
              type="url"
              value={config.webhookUrl || ''}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              placeholder="https://api.domain-anda.com/webhook/wa"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs font-medium text-gray-800 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all outline-none"
            />
          </div>
        )}

        {/* Automation Triggers Checklist */}
        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
          <span className="block text-[11px] font-black uppercase tracking-wider text-gray-400">
            Pemicu Notifikasi Otomatis (Automation Triggers)
          </span>

          <label className="flex items-center gap-3 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              checked={config.autoNotifyAdminOnNewBooking}
              onChange={(e) => setConfig({ ...config, autoNotifyAdminOnNewBooking: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
            />
            <span>Kirim notifikasi ke HP Pengurus saat warga mengajukan booking baru</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              checked={config.autoNotifyCitizenOnBookingApproval}
              onChange={(e) => setConfig({ ...config, autoNotifyCitizenOnBookingApproval: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
            />
            <span>Kirim surat konfirmasi persetujuan otomatis ke pemohon saat booking di-ACC</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              checked={config.autoNotifyCitizenOnPaymentReceipt}
              onChange={(e) => setConfig({ ...config, autoNotifyCitizenOnPaymentReceipt: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
            />
            <span>Kirim kuitansi tanda terima lunas otomatis saat pembayaran diverifikasi</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Test Dispatch Form */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="No HP tes (08...)"
              className="w-36 sm:w-44 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
            />
            <button
              type="button"
              disabled={isTesting || !testPhone || !config.apiKey}
              onClick={handleTestSend}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Mengirim...' : 'Tes Kirim'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Menyimpan...' : saveSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi'}</span>
          </button>
        </div>

        {/* Test Result Alert */}
        {testResult && (
          <div className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5 ${
            testResult.success 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{testResult.success ? 'Uji Coba Berhasil' : 'Uji Coba Gagal'}</p>
              <p className="mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
