// firebase-config.js
// CBT TRIGUNA 1956 — konfigurasi Firebase BARU.
// Jangan masukkan service-account / private key di file web ini.
// Setelah membuat project Firebase baru, salin object konfigurasi Web App dari
// Firebase Console ke bagian firebaseConfig di bawah.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

export const firebaseConfig = {
    apiKey: "PASTE_API_KEY_FROM_FIREBASE_CONSOLE",
    authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
    projectId: "PASTE_PROJECT_ID",
    storageBucket: "PASTE_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
    appId: "PASTE_APP_ID",
    measurementId: ""
};

// Domain email virtual untuk username/NIS/ID Guru. Tidak perlu mailbox sungguhan
// karena aplikasi memakai Firebase Authentication email/password sebagai identitas.
// Google Login tetap menggunakan email Google asli pengguna.
export const AUTH_EMAIL_DOMAIN = "cbt.triguna1956.id";
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_APP_ID = firebaseConfig.appId;

const placeholders = [
    firebaseConfig.apiKey,
    firebaseConfig.projectId,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId
];
export const FIREBASE_IS_CONFIGURED = placeholders.every(v => v && !String(v).startsWith("PASTE_"));

if (!FIREBASE_IS_CONFIGURED) {
    console.warn("Firebase CBT TRIGUNA 1956 belum dikonfigurasi. Edit firebase-config.js memakai config Web App dari project Firebase baru.");
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
