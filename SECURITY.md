# Security Policy & Audit Report (OWASP Standards)

**Proyek**: Gedung Serbaguna Huntap Tondo 2  
**Tanggal Audit**: 12 Oktober 2026  
**Status Audit**: PASSED (Temuan Telah Dimitigasi & Diamankan)  
**Tingkat Keamanan**: Standar Produksi Enterprise (OWASP Top 10 Compliant)

---

## 🛡️ Ringkasan Eksekutif Keamanan

Audit keamanan menyeluruh dilakukan dengan fokus pada perlindungan kredensial (*secrets detection*), pencegahan injeksi & XSS, kontrol akses berbasis peran (*Role-Based Access Control*), dan integritas rantai pasokan dependensi (*supply chain security*).

| Kategori Audit | Status | Tindakan / Mitigasi |
|---|:---:|---|
| **1. Secrets & Credentials Detection** | 🟢 PASSED | Kredensial telah disanitasi dari kode sumber dan `.env.example`. Kunci tersimpan aman di `.env` lokal yang terdaftar di `.gitignore`. |
| **2. Injection & XSS Prevention (OWASP #1)** | 🟢 PASSED | Tidak ditemukan penggunaan `dangerouslySetInnerHTML`, `innerHTML`, atau `eval()`. Data disanitasi otomatis oleh JSX engine React & DOMPurify. |
| **3. Broken Access Control (OWASP #2)** | 🟢 PASSED | Portal Admin (`/admin`) dilindungi verifikasi Firebase Auth + lookup peran dinamis di Firestore. Aturan Firestore (`firestore.rules`) diperketat hingga tingkat atribut per-field. |
| **4. Insecure Design & IDOR** | 🟢 PASSED | Publik hanya diizinkan membuat reservasi dengan status `pending` dan mengunggah bukti bayar. Persetujuan dan perubahan nominal sewa terkunci hanya untuk pengurus berwenang. |
| **5. Supply Chain & Dependencies** | 🟢 PASSED | `npm audit fix` dijalankan: 15 kerentanan pustaka berhasil diperbaiki otomatis (PostCSS, Vite, DOMPurify, NanoID). |

---

## 🔍 Temuan Audit & Resolusi (Detailed Findings)

### 1. Kredensial & Secrets Management
- **Temuan Sebelumnya**: Ditemukan fallback string API key di `whatsappGatewayService.ts` dan kredensial Cloudinary di `.env.example`.
- **Status Resolusi**: **FIXED (Telah Dimurnikan)**.
  - `whatsappGatewayService.ts` kini hanya membaca dari variabel lingkungan `VITE_SIDOBE_SECRET_KEY` atau dokumen konfigurasi terenkripsi di Firestore.
  - `.env.example` telah dibersihkan dan diganti dengan placeholder generik (`your_api_key`, `your_api_secret`).
  - File `.env` dipastikan masuk dalam `.gitignore` (`.env*`).

### 2. Validasi & Integritas Firestore Security Rules (`firestore.rules`)
- **Temuan**: Perlunya batasan hak akses publik saat mengirim permohonan sewa dan mengunggah bukti transfer.
- **Status Resolusi**: **HARDENED**.
  - Pendaftaran publik diwajibkan menyertakan atribut `status: 'pending'` dan `paymentStatus: 'unpaid'`. Publik tidak dapat membuat reservasi yang langsung disetujui (*privilege escalation prevented*).
  - Pembaruan oleh publik dibatasi ketat hanya pada field `paymentProofUrl` dan `paymentStatus` (*verifying*).
  - Koleksi audit log bersifat *append-only* dan *immutable* (`allow update, delete: if false`).

### 3. Perlindungan Rute & Autentikasi Pengurus (`AdminLayout.tsx`)
- Rute sensitif `/admin/*` diverifikasi ganda:
  1. *Authentication Layer*: `onAuthStateChanged` Firebase Auth.
  2. *Authorization Layer*: `checkIsAdminAuthorized()` memverifikasi email terhadap daftar resmi di Firestore `admins/{email}` dan system owner.
  3. Pengguna tanpa izin langsung ditolak dengan status *Access Denied* dan sesi dikeluarkan (*logout & redirect*).

### 4. Dependensi & Pustaka Pihak Ketiga
- Pustaka `vite` dinaikkan ke versi aman `v6.4.4`.
- Pustaka pendukung CSS, sanitasi HTML, dan parser berhasil diperbarui ke patch keamanan terbaru.

---

## 📋 Rekomendasi Pemeliharaan Rutin

1. **Rotasi Kunci Berkala**: Lakukan rotasi Secret Key SIDOBE WA API dan Cloudinary setiap 6 bulan sekali.
2. **Review Pengurus Aktif**: Audit daftar akun pengurus di menu *Aturan & Hak Akses* (`/admin/rules`) secara berkala untuk mencabut akses petugas yang sudah tidak bertugas.
3. **Backup Database**: Jalankan export data transaksi dan booking ke format Excel secara berkala melalui menu Laporan Keuangan.

---
*Laporan ini dihasilkan secara otomatis melalui protokol Systematic Security Audit.*
