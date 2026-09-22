// CBT TRIGUNA 1956 — Login Web V7
// Firebase SDK dibuat konsisten dan instance Auth/Firestore diambil dari app yang sama.
import { auth, db, firebaseConfig, AUTH_EMAIL_DOMAIN, FIREBASE_IS_CONFIGURED, FIREBASE_PROJECT_ID } from './firebase-config.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const loginForm = document.getElementById('login-form');
const btnSubmit = document.getElementById('btn-submit');
const btnLoginGoogle = document.getElementById('btn-login-google');
const loginStatus = document.getElementById('login-status');

let isRouting = false;
let loginAttemptActive = false;
let hasExplicitLoginAttempt = false;

const normalizeArrayData = (value) => Array.isArray(value) ? value : (value ? [value] : []);

function setLoginMessage(type, message) {
  if (!loginStatus) return;
  loginStatus.className = `auth-status ${type}`;
  loginStatus.textContent = message;
  loginStatus.style.display = 'block';
}

function setBusy(busy) {
  if (btnSubmit) {
    btnSubmit.disabled = busy;
    if (!btnSubmit.dataset.defaultText) btnSubmit.dataset.defaultText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = busy
      ? '<i class="fas fa-spinner fa-spin"></i> MEMPROSES...'
      : btnSubmit.dataset.defaultText;
  }
  if (btnLoginGoogle) {
    btnLoginGoogle.disabled = busy;
    btnLoginGoogle.style.opacity = busy ? '0.65' : '1';
    btnLoginGoogle.style.pointerEvents = busy ? 'none' : 'auto';
  }
}

function authErrorMessage(error) {
  const code = error?.code || '';
  const msg = String(error?.message || '');
  const map = {
    'auth/invalid-credential': 'Username/email atau password salah.',
    'auth/user-not-found': 'Akun belum terdaftar di Firebase Authentication.',
    'auth/wrong-password': 'Password salah.',
    'auth/invalid-email': 'Format email akun tidak valid.',
    'auth/user-disabled': 'Akun ini dinonaktifkan.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu beberapa saat sebelum mencoba lagi.',
    'auth/operation-not-allowed': 'Provider Email/Password belum diaktifkan di Firebase Authentication.',
    'auth/unauthorized-domain': `Domain ${location.hostname} belum diizinkan di Firebase Authentication → Settings → Authorized domains.`,
    'auth/popup-blocked': 'Popup Google diblokir browser. Izinkan popup untuk situs ini.',
    'auth/popup-closed-by-user': 'Jendela Google ditutup sebelum login selesai.',
    'auth/cancelled-popup-request': 'Permintaan login Google sebelumnya masih aktif. Tunggu sebentar lalu coba lagi.',
    'auth/network-request-failed': 'Permintaan ke Firebase gagal. Lihat pesan diagnostik di bawah atau cek API Key/Email-Password di Firebase.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'API Key Firebase tidak valid. Periksa firebase-config.js.',
    'auth/invalid-api-key': 'API Key Firebase tidak valid. Periksa firebase-config.js.'
  };
  return map[code] || msg || 'Login gagal. Periksa kredensial dan konfigurasi Firebase.';
}

async function diagnoseFirebaseAuth() {
  try {
    if (!firebaseConfig?.apiKey || String(firebaseConfig.apiKey).startsWith('PASTE_')) {
      return 'API Key Firebase belum diisi pada firebase-config.js.';
    }
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'diagnostic.invalid@example.com', password: 'not-a-real-password', returnSecureToken: true })
    });
    let body = {};
    try { body = await response.json(); } catch (_) {}
    const serverCode = String(body?.error?.message || '').toUpperCase();
    if (serverCode.includes('API_KEY_INVALID') || serverCode.includes('API KEY NOT VALID')) {
      return 'API Key Firebase ditolak. Pastikan API Key berasal dari project cbt-triguna-1956 dan pembatasan API key tidak memblokir Identity Toolkit/Firebase Authentication.';
    }
    if (serverCode.includes('OPERATION_NOT_ALLOWED')) {
      return 'Email/Password belum diaktifkan. Buka Firebase → Authentication → Sign-in method → Email/Password → Enable.';
    }
    if (serverCode.includes('PROJECT_NOT_FOUND')) {
      return 'Project Firebase tidak ditemukan. Pastikan projectId di firebase-config.js adalah cbt-triguna-1956.';
    }
    if (serverCode.includes('INVALID_LOGIN_CREDENTIALS') || serverCode.includes('EMAIL_NOT_FOUND') || serverCode.includes('INVALID_PASSWORD')) {
      return 'Koneksi Firebase Authentication aktif. API Key dan endpoint dapat dijangkau. Periksa email akun dan password di Authentication → Users.';
    }
    return `Firebase mengembalikan ${serverCode || `HTTP ${response.status}`}. Periksa API Key dan pengaturan Authentication.`;
  } catch (error) {
    console.error('Diagnostik Firebase:', error);
    return 'Browser tidak dapat menjangkau Identity Toolkit. Periksa internet, firewall, VPN/proxy, atau extension pemblokir.';
  }
}

async function routeUser(user) {
  if (!user || isRouting) return false;
  isRouting = true;
  try {
    setLoginMessage('info', 'Login berhasil. Memuat profil pengguna...');
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      setLoginMessage('error', `Login Firebase berhasil, tetapi profil users/${user.uid} belum ada. Sesi tetap aktif. Buat document users dengan ID yang sama persis dengan UID Authentication.`);
      isRouting = false;
      return false;
    }

    const data = snap.data() || {};
    const roles = normalizeArrayData(data.role).map(v => String(v).toLowerCase());
    const mapel = normalizeArrayData(data.mapel);
    const kelas = normalizeArrayData(data.kelas);

    localStorage.setItem('userRole', JSON.stringify(roles));
    localStorage.setItem('userMapel', JSON.stringify(mapel));
    localStorage.setItem('userKelas', JSON.stringify(kelas));
    localStorage.setItem('cbt_last_login_uid', user.uid);
    localStorage.setItem('cbt_login_email', user.email || '');

    if (roles.includes('admin') || roles.includes('guru')) {
      window.location.replace('./dashboard.html');
      return true;
    }
    if (roles.includes('siswa')) {
      window.location.replace('./attempt.html');
      return true;
    }

    setLoginMessage('error', 'Role akun belum diatur. Isi field role pada users/{UID} dengan admin, guru, atau siswa.');
    isRouting = false;
    return false;
  } catch (error) {
    console.error('Gagal memuat profil pengguna:', error);
    let detail = error?.code || error?.message || '';
    if (String(detail).includes('permission-denied')) {
      detail = 'Firestore Rules menolak pembacaan users/{UID}. Deploy firestore.rules dari project CBT TRIGUNA.';
    }
    setLoginMessage('error', `Login berhasil tetapi profil pengguna belum dapat dibaca. ${detail}`);
    isRouting = false;
    return false;
  }
}

console.info('CBT TRIGUNA Firebase siap:', {
  projectId: FIREBASE_PROJECT_ID,
  hostname: location.hostname,
  origin: location.origin
});

if (!FIREBASE_IS_CONFIGURED) {
  setLoginMessage('error', 'Firebase belum dikonfigurasi. Isi firebase-config.js menggunakan Web App Config dari project cbt-triguna-1956.');
}

// Jangan auto-route hanya karena ada sesi lama. Ini mencegah login loop dan error profil saat halaman baru dibuka.
onAuthStateChanged(auth, async (user) => {
  if (!user || !hasExplicitLoginAttempt || isRouting) return;
  await routeUser(user);
});

getRedirectResult(auth).then(async (result) => {
  if (!result?.user) return;
  hasExplicitLoginAttempt = true;
  await routeUser(result.user);
}).catch((error) => {
  if (error?.code) {
    console.error('Google Redirect Error:', error);
    setLoginMessage('error', authErrorMessage(error));
  }
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

btnLoginGoogle?.addEventListener('click', async (event) => {
  event.preventDefault();
  if (!FIREBASE_IS_CONFIGURED || loginAttemptActive) return;
  hasExplicitLoginAttempt = true;
  loginAttemptActive = true;
  setBusy(true);
  setLoginMessage('info', 'Membuka login Google...');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await routeUser(result.user);
  } catch (error) {
    console.error('Google Login Error:', error);
    if (error?.code === 'auth/popup-blocked') {
      try {
        setLoginMessage('info', 'Popup diblokir. Mengalihkan ke Google...');
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (redirectError) {
        setLoginMessage('error', authErrorMessage(redirectError));
      }
    } else {
      setLoginMessage('error', authErrorMessage(error));
    }
  } finally {
    loginAttemptActive = false;
    setBusy(false);
  }
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!FIREBASE_IS_CONFIGURED || loginAttemptActive) return;

  const username = String(document.getElementById('username')?.value || '').trim();
  const password = String(document.getElementById('password')?.value || '');
  if (!username || !password) {
    setLoginMessage('error', 'Username/NIS/NIP dan password wajib diisi.');
    return;
  }

  hasExplicitLoginAttempt = true;
  loginAttemptActive = true;
  setBusy(true);
  setLoginMessage('info', 'Memverifikasi akun...');

  const input = username.toLowerCase();
  const configuredDomain = String(AUTH_EMAIL_DOMAIN || '').trim().replace(/^@/, '');
  const emails = input.includes('@')
    ? [input]
    : [...new Set([
      configuredDomain ? `${input}@${configuredDomain}` : '',
      `${input}@cbt.triguna1956.id`,
      `${input}@triguna1956.sch.id`,
      `${input}@cbt.triguna1956.sch.id`
    ].filter(Boolean))];

  let lastError = null;
  try {
    for (const email of emails) {
      try {
        console.info('Login dengan:', email);
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await routeUser(credential.user);
        return;
      } catch (error) {
        lastError = error;
        console.warn('Percobaan login gagal:', email, error?.code || error);
        const retryableCredentialErrors = ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'];
        if (error?.code && !retryableCredentialErrors.includes(error.code)) break;
      }
    }

    if (lastError?.code === 'auth/network-request-failed' || String(lastError?.message || '').includes('400')) {
      const diagnostic = await diagnoseFirebaseAuth();
      setLoginMessage('error', diagnostic);
    } else {
      setLoginMessage('error', authErrorMessage(lastError));
    }
  } finally {
    loginAttemptActive = false;
    setBusy(false);
  }
});
