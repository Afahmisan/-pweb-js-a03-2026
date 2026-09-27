// ========================================================
// SESI 1: LOGIKA AUTENTIKASI LOGIN (PUSAKA NUSANTARA)
// ========================================================

// 1. Cek sesi saat ini: Jika sudah login, langsung alihkan ke katalog
if (localStorage.getItem('userFirstName')) {
  window.location.replace('index.html');
}

// 2. Tangkap elemen DOM yang diperlukan
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnText = btnLogin.querySelector('.btn-text');
const btnSpinner = btnLogin.querySelector('.btn-spinner');
const errorAlert = document.getElementById('error-alert');
const errorMessage = document.getElementById('error-message');

/**
 * Mengatur tampilan tombol saat proses fetch API berlangsung
 * @param {boolean} isLoading 
 */
function setLoadingState(isLoading) {
  if (isLoading) {
    btnLogin.disabled = true;
    btnText.textContent = 'Ngrantos sekedhap (Memverifikasi)...';
    btnSpinner.style.display = 'inline-block';
  } else {
    btnLogin.disabled = false;
    btnText.textContent = 'Mlebet (Masuk)';
    btnSpinner.style.display = 'none';
  }
}

/**
 * Menampilkan pesan error visual pada kotak alert
 * @param {string} message 
 */
function showError(message) {
  errorMessage.textContent = message;
  errorAlert.style.display = 'flex';
}


function hideError() {
  errorAlert.style.display = 'none';
}

// 3. Event Listener penanganan Submit Form Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showError('Password dan Username Wajib diisi');
    return;
  }

  setLoadingState(true);

  try {
    // Memanggil API Users DummyJSON
    const response = await fetch('https://dummyjson.com/users');
    
    if (!response.ok) {
      throw new Error(`Respon server gagal dengan status: ${response.status}`);
    }

    const data = await response.json();
    const users = data.users;

    const matchedUser = users.find(
      (user) => user.username === username && user.password === password
    );

    if (matchedUser) {
      // Simpan firstName ke Local Storage sesuai spesifikasi modul
      localStorage.setItem('userFirstName', matchedUser.firstName);
      
      // Auto Redirect ke halaman katalog produk
      window.location.href = 'index.html';
    } else {
      showError('Panyuwunan mlebet dipuntolak: Username utawi password klintu (Salah).');
    }
  } catch (error) {
    console.error('Login Error:', error);
    showError('Wonten gangguan jaringan utawi server. Mangga dipuncoba malih mangke.');
  } finally {
    setLoadingState(false);
  }
});