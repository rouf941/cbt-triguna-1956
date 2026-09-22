import { auth, db, firebaseConfig, AUTH_EMAIL_DOMAIN, FIREBASE_IS_CONFIGURED } from './firebase-config.js';
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    const registerForm = $('register-form');
    const btnSubmit = $('btn-submit');
    const regStatus = $('reg-status');
    const boxSiswa = $('select-siswa');
    const boxGuru = $('select-guru');
    const roleInput = $('reg-role');
    const usernameInput = $('reg-username');
    const usernameLabel = $('username-label');
    const regTitle = $('reg-title');
    const warningBox = $('reg-warning');
    const massBox = $('mass-upload-box');
    const adminOptions = $('admin-registration-options');

    let statusRegSiswa = true;
    let statusRegGuru = true;
    let isAdminRegistrar = false;
    let currentRoles = ['siswa'];
    let listKelas = [];
    let listMapel = [];

    const safeText = (value) => String(value ?? '').trim();
    const esc = (value) => safeText(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

    const message = (type, text) => {
        if (!regStatus) return;
        regStatus.className = `auth-status ${type}`;
        regStatus.textContent = text;
    };

    const busy = (flag) => {
        if (!btnSubmit) return;
        btnSubmit.disabled = flag;
        btnSubmit.innerHTML = flag
            ? '<i class="fas fa-spinner fa-spin"></i> MEMPROSES...'
            : (btnSubmit.dataset.defaultText || 'DAFTAR MANUAL');
    };

    const normalizeUsername = (value) => safeText(value).replace(/\s+/g, '').toUpperCase();
    const normalizeEmail = (value) => {
        const raw = safeText(value).toLowerCase();
        return raw.includes('@') ? raw : `${raw}@${AUTH_EMAIL_DOMAIN}`;
    };

    const authErrorMessage = (error) => {
        const code = error?.code || '';
        switch (code) {
            case 'auth/email-already-in-use': return 'Username/NIS/ID Guru tersebut sudah terdaftar.';
            case 'auth/invalid-email': return 'Format email akun tidak valid.';
            case 'auth/weak-password': return 'Password minimal 6 karakter.';
            case 'auth/network-request-failed': return 'Koneksi ke Firebase gagal. Periksa internet, API Key, dan Authorized Domains.';
            case 'auth/invalid-api-key': return 'Firebase API Key tidak valid. Periksa firebase-config.js.';
            case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.': return 'Firebase API Key tidak valid.';
            case 'auth/operation-not-allowed': return 'Provider Email/Password belum diaktifkan di Firebase Authentication.';
            case 'auth/admin-restricted-operation': return 'Pembuatan akun sedang dibatasi oleh konfigurasi Firebase.';
            case 'permission-denied': return 'Akses Firestore ditolak. Pastikan rules Firestore dan role Admin sudah benar.';
            case 'failed-precondition': return 'Firestore belum siap. Pastikan database Firestore sudah dibuat.';
            default: return error?.message || 'Terjadi kesalahan saat mendaftarkan akun.';
        }
    };

    const roleList = () => {
        if (isAdminRegistrar) {
            const selected = Array.from(document.querySelectorAll('.reg-admin-role-cb:checked')).map(cb => cb.value);
            return selected;
        }
        return [roleInput?.value || 'siswa'];
    };

    const syncAll = (allId, selector) => {
        const all = $(allId);
        const boxes = Array.from(document.querySelectorAll(selector));
        if (!all) return;
        const checked = boxes.filter(x => x.checked).length;
        all.checked = boxes.length > 0 && checked === boxes.length;
        all.indeterminate = checked > 0 && checked < boxes.length;
    };

    const syncUI = () => {
        currentRoles = roleList();
        const student = currentRoles.includes('siswa');
        const teacher = currentRoles.includes('guru');
        const admin = currentRoles.includes('admin');
        const primary = currentRoles.length === 1 ? currentRoles[0] : (teacher ? 'guru' : 'siswa');
        if (roleInput) roleInput.value = primary;

        const siswaActive = currentRoles.length === 1 && currentRoles[0] === 'siswa';
        const guruActive = currentRoles.length === 1 && currentRoles[0] === 'guru';
        boxSiswa?.classList.toggle('active', siswaActive);
        boxGuru?.classList.toggle('active', guruActive);
        boxSiswa?.setAttribute('aria-pressed', String(siswaActive));
        boxGuru?.setAttribute('aria-pressed', String(guruActive));

        if (currentRoles.length === 1 && currentRoles[0] === 'siswa') {
            if (regTitle) regTitle.textContent = 'REGISTRASI SISWA';
            if (usernameLabel) usernameLabel.textContent = 'Nomor Peserta / NIS';
            if (usernameInput) {
                usernameInput.inputMode = 'numeric';
                usernameInput.maxLength = 10;
                usernameInput.placeholder = 'Masukkan NIS (10 Digit Angka)';
            }
        } else if (currentRoles.length === 1 && currentRoles[0] === 'guru') {
            if (regTitle) regTitle.textContent = 'REGISTRASI GURU';
            if (usernameLabel) usernameLabel.textContent = 'ID Guru';
            if (usernameInput) {
                usernameInput.inputMode = 'text';
                usernameInput.maxLength = 64;
                usernameInput.placeholder = 'Contoh: E24H6-223';
            }
        } else {
            if (regTitle) regTitle.textContent = admin ? 'REGISTRASI ADMIN' : 'REGISTRASI MULTI-ROLE';
            if (usernameLabel) usernameLabel.textContent = 'Username / NIS / ID Guru';
            if (usernameInput) {
                usernameInput.inputMode = 'text';
                usernameInput.maxLength = 64;
                usernameInput.placeholder = 'Masukkan username';
            }
        }

        const gs = $('group-kelas-siswa');
        const gg = $('group-kelas-guru');
        const gm = $('group-mapel-guru');
        const ga = $('group-kelas-admin');
        const ks = $('reg-kelas-siswa');
        if (isAdminRegistrar) {
            if (gs) gs.style.display = 'none';
            if (gg) gg.style.display = 'none';
            if (ga) ga.style.display = (student || teacher || admin) ? 'block' : 'none';
            if (gm) gm.style.display = teacher ? 'block' : 'none';
            ks?.removeAttribute('required');
        } else {
            if (ga) ga.style.display = 'none';
            if (gs) gs.style.display = student && !teacher ? 'block' : 'none';
            if (gg) gg.style.display = teacher ? 'block' : 'none';
            if (gm) gm.style.display = teacher ? 'block' : 'none';
            if (student && !teacher && !admin) ks?.setAttribute('required','true'); else ks?.removeAttribute('required');
        }

        let allowed = true;
        if (!isAdminRegistrar) {
            if (student && !statusRegSiswa) allowed = false;
            if (teacher && !statusRegGuru) allowed = false;
        }
        if (warningBox) {
            warningBox.style.display = allowed ? 'none' : 'block';
            warningBox.textContent = allowed ? '' : `Pendaftaran ${teacher ? 'guru' : 'siswa'} sedang ditutup oleh Admin.`;
        }
        if (btnSubmit) {
            btnSubmit.disabled = !allowed;
            btnSubmit.style.opacity = allowed ? '1' : '0.5';
        }
        if (massBox) massBox.style.display = isAdminRegistrar ? 'block' : 'none';
    };

    const renderAcademic = () => {
        const kelas = Array.from(new Set(listKelas.map(safeText).filter(Boolean)));
        const mapel = Array.from(new Set(listMapel.map(safeText).filter(Boolean)));
        const siswaSelect = $('reg-kelas-siswa');
        if (siswaSelect) {
            siswaSelect.innerHTML = '<option value="" disabled selected>Pilih Kelas...</option>' + kelas.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('');
            if (kelas.length === 0) {
                siswaSelect.innerHTML += '<option value="" disabled>Master kelas belum tersedia</option>';
            }
        }

        const mapelBox = $('reg-mapel-container');
        if (mapelBox) {
            mapelBox.innerHTML = (isAdminRegistrar && mapel.length ? '<label><input type="checkbox" id="reg-mapel-all"> Semua</label>' : '') + mapel.map(m => `<label><input type="checkbox" class="reg-mapel-cb" value="${esc(m)}"> ${esc(m)}</label>`).join('');
            $('reg-mapel-all')?.addEventListener('change', (e) => {
                document.querySelectorAll('.reg-mapel-cb').forEach(cb => cb.checked = e.target.checked);
                syncAll('reg-mapel-all', '.reg-mapel-cb');
            });
            document.querySelectorAll('.reg-mapel-cb').forEach(cb => cb.addEventListener('change', () => syncAll('reg-mapel-all', '.reg-mapel-cb')));
        }

        const kelasGuruBox = $('reg-kelas-guru-container');
        if (kelasGuruBox) {
            kelasGuruBox.innerHTML = (isAdminRegistrar && kelas.length ? '<label><input type="checkbox" id="reg-kelas-guru-all"> Semua</label>' : '') + kelas.map(k => `<label><input type="checkbox" class="reg-kelas-cb" value="${esc(k)}"> ${esc(k)}</label>`).join('');
            $('reg-kelas-guru-all')?.addEventListener('change', (e) => {
                document.querySelectorAll('.reg-kelas-cb').forEach(cb => cb.checked = e.target.checked);
                syncAll('reg-kelas-guru-all', '.reg-kelas-cb');
            });
            document.querySelectorAll('.reg-kelas-cb').forEach(cb => cb.addEventListener('change', () => syncAll('reg-kelas-guru-all', '.reg-kelas-cb')));
        }

        const kelasAdminBox = $('reg-kelas-admin-container');
        if (kelasAdminBox && isAdminRegistrar) {
            kelasAdminBox.innerHTML = (kelas.length ? '<label><input type="checkbox" id="reg-kelas-admin-all"> Semua</label>' : '') + kelas.map(k => `<label><input type="checkbox" class="reg-kelas-admin-cb" value="${esc(k)}"> ${esc(k)}</label>`).join('');
            $('reg-kelas-admin-all')?.addEventListener('change', (e) => {
                document.querySelectorAll('.reg-kelas-admin-cb').forEach(cb => cb.checked = e.target.checked);
                syncAll('reg-kelas-admin-all', '.reg-kelas-admin-cb');
            });
            document.querySelectorAll('.reg-kelas-admin-cb').forEach(cb => cb.addEventListener('change', () => syncAll('reg-kelas-admin-all', '.reg-kelas-admin-cb')));
        }
        syncUI();
    };

    const findAdmin = async (user) => {
        if (!user) return false;
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (!snap.exists()) return false;
            const data = snap.data() || {};
            const roles = Array.isArray(data.role) ? data.role : [data.role];
            return roles.includes('admin');
        } catch (error) {
            console.error('Gagal membaca profil admin:', error);
            return false;
        }
    };

    const loadData = async () => {
        if (!FIREBASE_IS_CONFIGURED) {
            message('error', 'Firebase belum dikonfigurasi. Periksa firebase-config.js.');
            busy(false);
            return;
        }
        try {
            const [statusSnap, academicSnap] = await Promise.all([
                getDoc(doc(db, 'pengaturan', 'status_registrasi')),
                getDoc(doc(db, 'pengaturan', 'data_akademik'))
            ]);
            if (statusSnap.exists()) {
                const s = statusSnap.data() || {};
                statusRegSiswa = s.siswa_aktif !== false;
                statusRegGuru = s.guru_aktif !== false;
            }
            if (academicSnap.exists()) {
                const a = academicSnap.data() || {};
                listKelas = Array.isArray(a.list_kelas) ? a.list_kelas : [];
                listMapel = Array.isArray(a.list_mapel) ? a.list_mapel : [];
            }
            renderAcademic();
            message('info', isAdminRegistrar ? 'Mode Admin aktif. Anda dapat membuat akun siswa/guru.' : 'Pilih jenis akun dan isi formulir pendaftaran.');
        } catch (error) {
            console.error('Gagal memuat data registrasi:', error);
            const code = error?.code || '';
            message('error', code === 'permission-denied'
                ? 'Firestore menolak pembacaan pengaturan. Cek Firestore Rules.'
                : 'Data akademik belum dapat dimuat. Periksa koneksi Firebase lalu muat ulang halaman.');
        }
        syncUI();
    };

    async function createAccount() {
        const roles = roleList();
        if (!roles.length) throw new Error('Pilih minimal satu role.');
        const name = safeText($('reg-name')?.value);
        const username = normalizeUsername(usernameInput?.value);
        const password = $('reg-password')?.value || '';
        const confirmPassword = $('reg-confirm-password')?.value || '';

        if (!name) throw new Error('Nama lengkap wajib diisi.');
        if (!username) throw new Error('Username/NIS/ID Guru wajib diisi.');
        if (password.length < 6) throw new Error('Password minimal 6 karakter.');
        if (password !== confirmPassword) throw new Error('Konfirmasi password tidak sama.');

        const studentOnly = roles.length === 1 && roles[0] === 'siswa';
        const teacherOnly = roles.length === 1 && roles[0] === 'guru';
        if (!isAdminRegistrar && studentOnly && !/^\d{10}$/.test(username)) {
            throw new Error('NIS siswa harus 10 digit angka.');
        }
        if (!isAdminRegistrar && teacherOnly && !/^[A-Z]\d{2}[A-Z]\d-\d{3}$/.test(username)) {
            throw new Error('ID Guru harus berformat seperti E24H6-223.');
        }

        const payload = { nama: name, username, role: roles, createdAt: serverTimestamp() };
        if (roles.includes('guru')) {
            const selectedMapel = Array.from(document.querySelectorAll('.reg-mapel-cb:checked')).map(cb => cb.value);
            const selectedKelas = isAdminRegistrar
                ? Array.from(document.querySelectorAll('.reg-kelas-admin-cb:checked')).map(cb => cb.value)
                : Array.from(document.querySelectorAll('.reg-kelas-cb:checked')).map(cb => cb.value);
            if (!selectedMapel.length && !isAdminRegistrar) throw new Error('Pilih minimal 1 mata pelajaran.');
            if (!selectedKelas.length) throw new Error('Pilih minimal 1 kelas.');
            payload.mapel = selectedMapel;
            payload.kelas = selectedKelas;
        } else if (roles.includes('siswa')) {
            const kelasSiswa = $('reg-kelas-siswa')?.value || '';
            if (!kelasSiswa) throw new Error('Pilih kelas siswa terlebih dahulu.');
            payload.kelas = kelasSiswa;
        } else if (roles.includes('admin')) {
            const selectedKelas = Array.from(document.querySelectorAll('.reg-kelas-admin-cb:checked')).map(cb => cb.value);
            if (selectedKelas.length) payload.kelas = selectedKelas;
            payload.mapel = [];
        }

        const email = normalizeEmail(username);
        const creator = isAdminRegistrar ? getAdminCreatorAuth() : auth;
        message('info', `Membuat akun ${roles.join(', ')}...`);
        const cred = await createUserWithEmailAndPassword(creator, email, password);
        try {
            await updateProfile(cred.user, { displayName: name });
            await setDoc(doc(db, 'users', cred.user.uid), payload);
        } catch (error) {
            try { await cred.user.delete(); } catch (_) {}
            throw error;
        }
        if (isAdminRegistrar) {
            try { await signOut(creator); } catch (_) {}
            return { adminCreated: true, email };
        }
        await signOut(auth);
        return { adminCreated: false, email };
    }

    function getAdminCreatorAuth() {
        const name = 'cbt-triguna-admin-registration';
        const existing = getApps().find(app => app.name === name);
        const app = existing || initializeApp(firebaseConfig, name);
        return getAuth(app);
    }

    async function initAuthMode() {
        const current = auth.currentUser || await new Promise(resolve => {
            const unsub = onAuthStateChanged(auth, user => { unsub(); resolve(user); });
            setTimeout(() => { try { unsub(); } catch (_) {} resolve(auth.currentUser || null); }, 1500);
        });
        isAdminRegistrar = await findAdmin(current);
        if (adminOptions) adminOptions.style.display = isAdminRegistrar ? 'block' : 'none';
        if (!isAdminRegistrar && massBox) massBox.style.display = 'none';
        syncUI();
    }

    function setRole(role) {
        roleInput.value = role;
        currentRoles = [role];
        if (isAdminRegistrar) {
            document.querySelectorAll('.reg-admin-role-cb').forEach(cb => cb.checked = cb.value === role);
            syncAll('reg-role-all', '.reg-admin-role-cb');
        }
        syncUI();
    }

    const bindRoleBox = (box, role) => {
        if (!box) return;
        box.addEventListener('click', () => setRole(role));
        box.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setRole(role);
            }
        });
    };
    bindRoleBox(boxSiswa, 'siswa');
    bindRoleBox(boxGuru, 'guru');

    document.querySelectorAll('[data-toggle-password]').forEach((button) => {
        button.addEventListener('click', () => {
            const input = $(button.dataset.togglePassword);
            if (!input) return;
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            button.innerHTML = show ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            button.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
        });
    });

    registerForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (btnSubmit?.disabled) return;
        busy(true);
        try {
            const result = await createAccount();
            if (result.adminCreated) {
                registerForm.reset();
                setRole('siswa');
                message('success', `Akun berhasil dibuat. Email login internal: ${result.email}`);
            } else {
                message('success', `Akun berhasil dibuat. Silakan masuk dengan username dan password yang baru.`);
                setTimeout(() => { window.location.href = 'index.html'; }, 700);
            }
        } catch (error) {
            console.error('Registrasi gagal:', error);
            message('error', authErrorMessage(error));
        } finally {
            busy(false);
            syncUI();
        }
    });

    $('btn-download-template')?.addEventListener('click', () => {
        if (!isAdminRegistrar) {
            message('error', 'Registrasi massal hanya dapat digunakan oleh Admin.');
            return;
        }
        if (typeof XLSX === 'undefined') {
            message('error', 'Library Excel belum termuat. Muat ulang halaman.');
            return;
        }
        const role = roleInput.value;
        const data = role === 'guru'
            ? [{ 'Nama Lengkap':'Guru Contoh','ID Guru':'E24H6-223','Password':'password123','Mata Pelajaran (Pisahkan koma)':'Informatika','Kelas Ajar (Pisahkan koma)':'X, XI' }]
            : [{ 'Nama Lengkap':'Siswa Contoh','NIS':'1234567890','Password':'password123','Kelas':'X' }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data Registrasi');
        XLSX.writeFile(wb, role === 'guru' ? 'Template_Registrasi_Guru.xlsx' : 'Template_Registrasi_Siswa.xlsx');
    });

    $('upload-massal')?.addEventListener('change', () => {
        message('info', 'Fitur registrasi massal akan diaktifkan setelah akun Admin Anda lolos uji registrasi manual.');
    });

    (async () => {
        try {
            message('info', 'Menyiapkan formulir registrasi...');
            await initAuthMode();
            await loadData();
        } catch (error) {
            console.error(error);
            message('error', authErrorMessage(error));
        }
    })();
});
