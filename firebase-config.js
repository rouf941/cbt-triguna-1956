// firebase-config.js
// CBT TRIGUNA 1956 — konfigurasi Firebase BARU.
// Jangan masukkan service-account / private key di file web ini.
// Setelah membuat project Firebase baru, salin object konfigurasi Web App dari
// Firebase Console ke bagian firebaseConfig di bawah.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

export const firebaseConfig = {
    apiKey: "AIzaSyBikFD8eitIaDswJezUWcNYKYd3Tjeneuo",
    authDomain: "cbt-triguna-1956.firebaseapp.com",
    projectId: "cbt-triguna-1956",
    storageBucket: "cbt-triguna-1956.firebasestorage.app",
    messagingSenderId: "137964378872",
    appId: "1:137964378872:web:fb5971d50136a04bafb90d",
    measurementId: "G-S7H3DXT9D4"
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
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
