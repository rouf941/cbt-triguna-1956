# Deploy CBT TRIGUNA 1956 ke GitHub Pages

## 1. Firebase
- Project: `cbt-triguna-1956`
- Authentication → Settings → Authorized domains → tambahkan `rouf941.github.io`
- Authentication → Sign-in method → aktifkan Email/Password dan Google
- Firestore Database → deploy `firestore.rules`
- Storage → deploy `storage.rules`

## 2. File Firebase Web
Isi `firebase-config.js` dengan konfigurasi Web App dari project `cbt-triguna-1956`. Jangan memasukkan private key/service account.

## 3. GitHub Pages
Setelah file diperbarui:
```bash
git add .
git commit -m "Fix CBT Triguna Firebase and menu"
git push origin main
```

Pastikan Pages memakai branch/folder tempat file `index.html` berada.

## 4. Uji
Buka:
`https://rouf941.github.io/cbt-triguna-1956/`

Lakukan hard refresh (`Ctrl+Shift+R`), lalu uji:
- Login Username/NIS/NIP
- Login Google
- Daftar akun
- Dashboard
- Data Master
- Input/Edit soal
- Download soal Excel
- Hasil ujian
- Mode siswa
- Logout
