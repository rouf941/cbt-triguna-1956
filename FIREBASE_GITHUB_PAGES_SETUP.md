# CBT TRIGUNA 1956 — Firebase + GitHub Pages

## Masalah `auth/unauthorized-domain`

Jika website dibuka dari:
`https://rouf941.github.io/cbt-triguna-1956/`

maka domain yang harus diizinkan adalah:
`rouf941.github.io`

### Firebase Console
1. Buka project `cbt-triguna-1956`.
2. Buka **Authentication → Settings → Authorized domains**.
3. Klik **Add domain**.
4. Masukkan `rouf941.github.io` (tanpa `https://` dan tanpa path `/cbt-triguna-1956`).
5. Simpan.
6. Pada **Authentication → Sign-in method**, pastikan **Google** dan **Email/Password** aktif.

### Catatan
Firebase memeriksa hostname halaman yang menjalankan Authentication. Path repository GitHub Pages bukan domain terpisah, jadi yang ditambahkan adalah hostname `rouf941.github.io`.

## Firebase Web App
Pastikan `firebase-config.js` menggunakan konfigurasi Web App dari project `cbt-triguna-1956`, terutama:
- `projectId: "cbt-triguna-1956"`
- `authDomain`: biasanya `cbt-triguna-1956.firebaseapp.com`

Jangan menaruh service account/private key di file web.

## Setelah pengaturan selesai
1. Commit/push file web terbaru ke GitHub Pages.
2. Buka ulang website dalam mode Incognito atau lakukan hard refresh (`Ctrl+Shift+R`).
3. Coba login Google.
4. Jika login berhasil, pengguna akan diarahkan otomatis ke `dashboard.html` (guru/admin) atau `attempt.html` (siswa).

## Firebase Hosting (opsional)
Project ini juga menyertakan `firebase.json` untuk Firebase Hosting. Jika nanti website dipindahkan ke Firebase Hosting, domain bawaan `cbt-triguna-1956.web.app` / `cbt-triguna-1956.firebaseapp.com` dapat digunakan bersama Authentication project yang sama.
