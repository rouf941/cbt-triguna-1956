# CBT TRIGUNA 1956 — Web Only

Versi web dari CBT sekolah dengan branding **TRIGUNA 1956 VOCATIONAL SCHOOL**.

Fitur yang dipertahankan dari basis aplikasi: login username/NIS/ID Guru, Google Login opsional, registrasi siswa/guru, bank soal multi-tipe, pengaturan jadwal/durasi/token/acak, pelaksanaan ujian, hasil, export Excel, media soal via Firebase Storage, dan PWA web.

## Yang sudah diubah

- Semua branding lama diganti menjadi CBT TRIGUNA 1956.
- Semua referensi logo lama diganti menggunakan `logo-triguna.png` dari logo yang Anda lampirkan.
- Ikon PWA/favicon menggunakan emblem Triguna.
- Warna utama disesuaikan dengan identitas biru Triguna.
- Konfigurasi Firebase lama dihapus dari paket.
- Firebase Functions/App Inventor tidak disertakan; paket ini fokus **web only**.
- `firebase.json` sudah siap untuk Firestore + Storage + Firebase Hosting.

## Langkah pertama

1. Buat Firebase project baru.
2. Salin Web App Config Firebase ke `firebase-config.js`.
3. Ikuti `FIREBASE_SETUP.md`.
4. Jalankan local server/static hosting, bukan membuka file HTML dengan `file://`.

