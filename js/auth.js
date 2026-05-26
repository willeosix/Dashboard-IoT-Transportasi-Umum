/**
 * auth.js
 * Modul autentikasi — terintegrasi dengan security.js untuk
 * perlindungan brute-force dan secure session tokens.
 */

const Auth = (() => {
  const SESSION_KEY = 'transum_session';

  /**
   * Validasi kredensial dengan perlindungan brute-force.
   */
  async function validateCredentials(username, password) {
    // 1. Cek Lockout
    const lockoutStatus = Security.checkLoginLockout();
    if (lockoutStatus.locked) {
      const remainingSecs = Math.ceil(lockoutStatus.remainingMs / 1000);
      throw new Error(`Terlalu banyak percobaan. Coba lagi dalam ${remainingSecs} detik.`);
    }

    // 2. Sanitasi Input
    const cleanUser = Security.sanitizeInput(username, 50);
    const cleanPass = Security.sanitizeInput(password, 50);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // 3. Validasi
    const validUser = (typeof CONFIG !== 'undefined') ? CONFIG.AUTH.USERNAME : 'admin';
    const validPass = (typeof CONFIG !== 'undefined') ? CONFIG.AUTH.PASSWORD : 'transumbandung2026';

    if (cleanUser === validUser && cleanPass === validPass) {
      // Login sukses
      Security.recordSuccessfulLogin();
      
      const duration = (typeof CONFIG !== 'undefined') ? CONFIG.AUTH.SESSION_DURATION_MS : 8 * 60 * 60 * 1000;
      
      // Generate signed token
      const token = await Security.createSignedToken({
        user: cleanUser,
        exp: Date.now() + duration,
        iat: Date.now()
      });
      
      return token;
    }

    // Login gagal
    const failStatus = Security.recordFailedLogin();
    if (failStatus.locked) {
      const lockoutMins = Math.ceil(failStatus.lockoutMs / 60000);
      throw new Error(`Akun terkunci selama ${lockoutMins} menit karena percobaan gagal berulang.`);
    } else {
      throw new Error(`Username atau password salah. Sisa percobaan: ${failStatus.attemptsRemaining}`);
    }
  }

  async function login(username, password) {
    const token = await validateCredentials(username, password);
    sessionStorage.setItem(SESSION_KEY, token);
    return true;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function isAuthenticated() {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return false;

    // Verifikasi signed token
    const payload = await Security.verifySignedToken(token);
    if (!payload) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }

    return true;
  }

  async function getUser() {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return null;
    
    const payload = await Security.verifySignedToken(token);
    return payload ? payload.user : null;
  }

  return { login, logout, isAuthenticated, getUser };
})();
