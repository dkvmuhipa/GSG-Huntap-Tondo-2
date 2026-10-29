# Security Policy & Audit Report (OWASP Standards)

**Proyek**: Gedung Serbaguna Huntap Tondo 2  
**Tanggal Audit Terakhir**: 29 Oktober 2026  
**Status Audit**: 🟢 PASSED (Semua Temuan Telah Dimitigasi & Diamankan)  
**Tingkat Keamanan**: Standar Produksi Enterprise (OWASP Top 10 Compliant)

---

## 🛡️ Ringkasan Eksekutif Keamanan

Audit keamanan menyeluruh dilakukan secara periodik dengan fokus pada pencegahan OWASP Top 10: perlindungan kredensial (*Secrets Detection*), pencegahan injeksi & Cross-Site Scripting (XSS), kontrol akses berbasis peran (*Role-Based Access Control / Broken Access Control*), pengamanan skema basis data (*Firestore Security Rules*), dan ketahanan API terhadap penyalahgunaan (*Rate Limiting & Security Headers*).

| Kategori Audit | Status | Tindakan / Mitigasi |
|---|:---:|---|
| **1. Secrets & Credentials Detection** | 🟢 PASSED | Kredensial telah disanitasi dari kode sumber dan `.env.example`. File `.env` lokal dikecualikan dari version control melalui `.gitignore` (`.env*`). |
| **2. Injection & XSS Prevention (OWASP #1)** | 🟢 PASSED | Tidak ditemukan penggunaan `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, atau `document.write()`. Seluruh input disanitasi otomatis oleh JSX React engine. Tautan eksternal terproteksi dengan `rel="noopener noreferrer"`. |
| **3. Broken Access Control (OWASP #2)** | 🟢 PASSED | Rute admin (`/admin/*`) dilindungi verifikasi ganda via Firebase Auth dan lookup peran di Firestore. Dokumen kredensial sensitif `/config/whatsapp_gateway` dikunci khusus hanya untuk pengurus berwenang. |
| **4. Insecure Design & IDOR Guard** | 🟢 PASSED | Skema permohonan reservasi warga terkunci pada status `pending` & `unpaid`. Pendaftaran UMKM mitra warga divalidasi via `isValidVendor` dengan status wajib `pending` dan `isVerified == false`. |
| **5. API Protection & Rate Limiting** | 🟢 PASSED | Endpoint upload (`/api/upload`) diproteksi rate limiter (*sliding window* per IP), filter ekstensi MIME, batas ukuran 5MB, serta HTTP Security Headers (`nosniff`, `SAMEORIGIN`, `XSS-Protection`). |
| **6. Supply Chain & Dependencies** | 🟢 PASSED | Paket dependensi terkelola bersih tanpa dependensi kritis yang rentan. `xlsx-js-style` digunakan secara terkontrol untuk ekspor laporan keuangan. |

---

## 🔍 Temuan Audit & Resolusi (Detailed Findings)

### 1. Kredensial & Secrets Management
- **Audit**: Pemindaian menyeluruh terhadap pola `API_KEY`, `SECRET`, `PASSWORD`, `BEARER`, dan `TOKEN`.
- **Status Resolusi**: **PASSED**.
  - `whatsappGatewayService.ts` membaca kunci dari environment variable client atau konfigurasi Firestore admin tanpa *hardcoded fallback*.
  - `.env.example` hanya memuat placeholder aman (`your_api_key`, `your_api_secret`).
  - `.gitignore` aktif mengecualikan semua varian `.env*` kecuali `.env.example`.

### 2. Pengerasan Aturan Keamanan Firestore (`firestore.rules`)
- **Temuan 1 (Dokumen Kredensial Gateway)**: Dokumen `/config/whatsapp_gateway` sebelumnya terbaca oleh publik karena aturan umum `match /config/{docId}` (`allow read: if true`).
  - **Resolusi**: Diterapkan isolasi dokumen sensitif:
    ```javascript
    allow read: if docId != 'whatsapp_gateway' || hasAnyRole(['owner', 'admin', 'editor', 'bendahara', 'finance']);
    ```
- **Temuan 2 (Validasi Pendaftaran Mitra Vendor UMKM)**: Koleksi `vendors` sebelumnya memiliki `allow create: if true` tanpa validasi skema dan status verifikasi.
  - **Resolusi**: Ditambahkan fungsi validasi `isValidVendor(incoming())` dan pembatasan izin pendaftaran:
    ```javascript
    allow create: if (
      hasAnyRole(['owner', 'admin', 'editor', 'bendahara']) ||
      (isValidVendor(incoming()) && incoming().status == 'pending' && incoming().isVerified == false)
    );
    ```
    Hal ini mencegah publik mempublikasikan profil vendor secara otomatis tanpa persetujuan pengurus (*privilege escalation prevented*).

### 3. Perlindungan API & Ketahanan DoS (`server.ts`)
- **Temuan**: Endpoint `/api/upload` belum memiliki pembatasan laju (*rate limiting*) dan header keamanan HTTP standar.
- **Status Resolusi**: **HARDENED**.
  - Diterapkan middleware keamanan:
    - `X-Content-Type-Options: nosniff` (mencegah MIME-type sniffing).
    - `X-Frame-Options: SAMEORIGIN` (mencegah serangan Clickjacking).
    - `X-XSS-Protection: 1; mode=block`.
    - `Referrer-Policy: strict-origin-when-cross-origin`.
    - `app.disable('x-powered-by')` (menyembunyikan fingerprint server Express).
  - Diterapkan *in-memory sliding window rate limiter* untuk mencegah spam atau serangan Denial-of-Service (DoS) pada unggahan berkas (maksimal 25 unggahan per 15 menit per IP).
  - Validasi ketat tipe MIME (hanya PNG, JPEG, PDF) dan batas memori maksimal 5MB.

### 4. Proteksi Rute & Hak Akses Pengurus (`AdminLayout.tsx`)
- Rute sensitif `/admin/*` diverifikasi berlapis:
  1. *Authentication Layer*: `onAuthStateChanged` Firebase Auth.
  2. *Authorization Layer*: `checkIsAdminAuthorized()` memverifikasi email terhadap dokumen resmi di Firestore `admins/{email}` dan system owner.
  3. Pengguna yang tidak terdaftar otomatis ditolak dan diarahkan keluar (*Access Denied & Redirect*).

---

## 📋 Rekomendasi Pemeliharaan Rutin

1. **Rotasi Kunci Berkala**: Lakukan rotasi berkala Secret Key Cloudinary dan SIDOBE WA Gateway setiap 6 bulan sekali.
2. **Review Pengurus Aktif**: Audit berkala daftar akun pengurus di menu *Aturan & Hak Akses* (`/admin/rules`) untuk mencabut hak akses pengurus yang telah purnatugas.
3. **Backup Data**: Lakukan ekspor cadangan data transaksi keuangan dan reservasi gedung ke format Excel secara berkala melalui modul Keuangan.

---
*Laporan ini dihasilkan secara otomatis melalui protokol Systematic Security Audit (OWASP Standards).*
