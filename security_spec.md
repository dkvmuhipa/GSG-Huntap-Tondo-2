# Security Specification - Admin & Access Rules

## Data Invariants
1. Koleksi `admins` hanya dapat dibaca oleh pengguna yang sudah login (untuk verifikasi login).
2. Hanya pengguna dengan peran `owner` atau `admin` yang dapat menambah/menghapus admin lain.
3. Email di koleksi `admins` harus berupa string valid dan bersifat immutable setelah dibuat.
4. `transactions` hanya dapat diakses oleh admin yang terverifikasi.

## The Eight Pillars Implementation
1. **Master Gate**: Akses admin dikelola via `/admins/$(request.auth.uid)`.
2. **Validation Blueprints**: Fungsi `isValidAdmin`, `isValidTransaction`, dan `isValidConfig`.
3. **Path Hardening**: Menggunakan `isValidId()` pada semua ID dokumen.
4. **Tiered Identity**: Membedakan `owner`, `admin`, dan `editor`.
5. **Total Array Guarding**: Memvalidasi ukuran array jika ada.
6. **PII Isolation**: Mengamankan email admin.
7. **Atomicity**: Memastikan timestamp server digunakan.
8. **Secure List Queries**: Memastikan query list admin divalidasi.

## The Dirty Dozen (Test Payloads)
1. Menghapus admin lain sebagai `editor` (Harus DENIED).
2. Mendaftarkan diri sendiri sebagai `owner` tanpa login (Harus DENIED).
3. Mengubah email admin yang sudah ada (Harus DENIED).
4. Menambahkan field "ghost" ke dokumen admin (Harus DENIED).
... dsb.
