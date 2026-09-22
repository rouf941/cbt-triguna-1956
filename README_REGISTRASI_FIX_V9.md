# CBT TRIGUNA 1956 — Registrasi Fix V9

Perbaikan:
- Registrasi siswa/guru memakai Firebase Auth + Firestore secara konsisten pada SDK 10.8.1.
- Public registration membuat akun lewat `auth` utama, menyimpan profil ke `users/{UID}`, lalu sign-out dan kembali ke login.
- Admin registration menggunakan Auth app kedua sehingga sesi admin utama tidak terganggu.
- Validasi NIS/ID Guru, password, kelas, dan mapel diperbaiki.
- Pesan error Firebase dibuat lebih jelas.
- Registrasi massal tidak dieksekusi dari akun publik; hanya Admin.

Jangan mengganti `firebase-config.js`.
