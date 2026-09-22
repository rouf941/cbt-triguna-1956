# CBT TRIGUNA 1956 — Setup Firebase BARU (Web Only)

Paket ini sudah dipisahkan dari project Firebase lama. **Jangan memakai project Firebase sebelumnya.** Buat satu project Firebase baru khusus CBT TRIGUNA 1956.

## 1. Buat project Firebase baru

1. Buka Firebase Console dan pilih **Create a project / Tambah project**.
2. Nama project boleh `CBT TRIGUNA 1956`; Firebase akan meminta **Project ID** yang unik. Contoh yang disarankan: `cbt-triguna-1956`. Bila sudah dipakai orang lain, pilih ID lain.
3. Google Analytics boleh dinonaktifkan untuk instalasi sederhana ini karena aplikasi tidak menggunakannya.

## 2. Tambahkan Web App

Di **Project settings → Your apps**, pilih ikon **Web (</>)** lalu daftarkan aplikasi, misalnya `CBT TRIGUNA Web`. Firebase akan memberikan **Firebase Config Object**. Salin nilai object tersebut ke `firebase-config.js`. Firebase memang meminta project dibuat dan web app diregistrasikan agar memperoleh config yang menghubungkan aplikasi web dengan layanan Firebase.

Contoh bentuk file:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

Gunakan config yang diberikan oleh Firebase Console, jangan menebak `apiKey`, `appId`, atau `messagingSenderId`.

## 3. Aktifkan Authentication

Masuk ke **Authentication → Sign-in method** dan aktifkan:

- **Email/Password** — wajib, karena username/NIS/ID Guru aplikasi dipetakan ke email virtual Firebase.
- **Google** — opsional, jika ingin tombol “Masuk dengan Akun Google” tetap aktif.

Pada Authentication → Settings, tambahkan domain website CBT ke **Authorized domains** jika domain tersebut belum otomatis terdaftar.

## 4. Buat Cloud Firestore

Masuk ke **Build / Databases & Storage → Firestore Database → Create database**. Untuk produksi sekolah, gunakan rules yang ada di `firestore.rules`, bukan membuka database untuk publik.

Aplikasi menggunakan collection berikut:

| Collection | Fungsi |
|---|---|
| `users` | profil, username, role, kelas, mapel |
| `pengaturan` | akademik, status registrasi, jadwal, durasi, token, acak soal |
| `bank_soal` | bank soal CBT |
| `hasil_ujian` | hasil dan skor ujian |

Dokumen awal yang disarankan:

`pengaturan/status_registrasi`
```json
{
  "siswa_aktif": true,
  "guru_aktif": true
}
```

`pengaturan/data_akademik`
```json
{
  "list_mapel": ["Informatika", "Matematika", "Bahasa Indonesia"],
  "list_kelas": ["X-1", "X-2", "XI-1", "XI-2", "XII-1", "XII-2"]
}
```
Sesuaikan daftar tersebut dengan data SMK Triguna.

## 5. Aktifkan Cloud Storage

Aplikasi menggunakan Storage untuk media soal seperti gambar/audio/video. Masuk ke **Databases & Storage → Storage → Get started**, pilih lokasi bucket, lalu gunakan `storage.rules` yang disertakan. Dokumentasi Firebase saat ini menyatakan Cloud Storage untuk Firebase memerlukan project pada paket Blaze pay-as-you-go; cek paket dan biaya di project Anda sebelum mengaktifkannya.

## 6. Buat Admin pertama

Karena pendaftaran publik tidak boleh membuat role `admin`, buat admin pertama secara manual:

1. **Authentication → Users → Add user**.
2. Buat email admin, misalnya `admin@cbt.triguna1956.id`, dan password yang kuat.
3. Salin **UID** user tersebut.
4. Di Firestore buat dokumen `users/{UID}` dengan data:

```json
{
  "nama": "Administrator CBT",
  "username": "admin",
  "role": ["admin"],
  "kelas": [],
  "mapel": []
}
```

Setelah itu login lewat `index.html`. Admin sudah dapat mengelola pengguna, mapel, kelas, bank soal, jadwal, token, hasil, dan pengaturan aplikasi.

## 7. Deploy Firestore rules, Storage rules, dan Hosting

Install Firebase CLI lalu login. Dari folder root paket ini jalankan:

```bash
firebase login
firebase use --add
```

Pilih project Firebase **BARU** yang baru Anda buat. Perintah ini akan memperbarui `.firebaserc`.

Kemudian deploy:

```bash
firebase deploy --only firestore:rules,storage,hosting
```

Karena `firebase.json` sudah diarahkan ke root web, hasil hosting akan tersedia pada domain Firebase seperti `PROJECT_ID.web.app` dan `PROJECT_ID.firebaseapp.com`.

## 8. Checklist sebelum dipakai siswa

- `firebase-config.js` sudah berisi config project baru.
- Authentication Email/Password aktif.
- Google provider aktif hanya bila memang diperlukan.
- Firestore sudah dibuat.
- `firestore.rules` sudah dideploy.
- Storage sudah dibuat dan `storage.rules` sudah dideploy.
- Admin pertama sudah dibuat.
- `pengaturan/data_akademik` sudah berisi mapel dan kelas Triguna.
- Uji akun siswa, guru, dan admin.
- Uji unggah gambar/audio/video pada bank soal.
- Uji jadwal, token, pengacakan, submit ujian, dan laporan hasil.

### Penting
Firebase Web Config (misalnya `apiKey`, `projectId`, `appId`) bukan service-account private key. Jangan memasukkan service-account JSON/private key ke website. Keamanan aplikasi bergantung pada Authentication dan Security Rules.
