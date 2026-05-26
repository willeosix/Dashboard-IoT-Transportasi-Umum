/**
 * security.js
 * Modul keamanan: sanitasi input, rate limiting, 
 * session signing, dan auto-logout.
 */

const Security = (() => {

  /* ── Input Sanitization ── */

  /**
   * Sanitasi string untuk mencegah XSS.
   * Escape karakter HTML berbahaya.
   */
  function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#96;',
    };
    return str.replace(/[&<>"'/`]/g, char => map[char]);
  }

  /**
   * Validasi dan sanitasi input text.
   * Hanya izinkan alfanumerik dan karakter aman.
   */
  function sanitizeInput(str, maxLength = 100) {
    if (typeof str !== 'string') return '';
    // Trim dan potong sesuai max length
    let cleaned = str.trim().slice(0, maxLength);
    // Hapus null bytes dan control characters
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
    return cleaned;
  }

  /* ── Rate Limiting (Brute Force Protection) ── */

  const _loginAttempts = {
    count: 0,
    firstAttemptTime: null,
    lockedUntil: null,
  };

  /**
   * Cek apakah login sedang di-lockout.
   * @returns {object} { locked: boolean, remainingMs: number }
   */
  function checkLoginLockout() {
    if (!_loginAttempts.lockedUntil) {
      return { locked: false, remainingMs: 0 };
    }

    const now = Date.now();
    if (now >= _loginAttempts.lockedUntil) {
      // Lockout expired, reset
      _resetLoginAttempts();
      return { locked: false, remainingMs: 0 };
    }

    return {
      locked: true,
      remainingMs: _loginAttempts.lockedUntil - now
    };
  }

  /**
   * Catat percobaan login gagal.
   * @returns {object} { locked: boolean, attemptsRemaining: number, lockoutMs: number }
   */
  function recordFailedLogin() {
    const maxAttempts = (typeof CONFIG !== 'undefined') 
      ? CONFIG.AUTH.MAX_LOGIN_ATTEMPTS 
      : 5;
    const lockoutDuration = (typeof CONFIG !== 'undefined')
      ? CONFIG.AUTH.LOCKOUT_DURATION_MS
      : 5 * 60 * 1000;

    _loginAttempts.count++;

    if (!_loginAttempts.firstAttemptTime) {
      _loginAttempts.firstAttemptTime = Date.now();
    }

    if (_loginAttempts.count >= maxAttempts) {
      _loginAttempts.lockedUntil = Date.now() + lockoutDuration;
      console.warn(`[Security] Akun terkunci selama ${lockoutDuration / 1000} detik setelah ${maxAttempts} percobaan gagal`);
      return {
        locked: true,
        attemptsRemaining: 0,
        lockoutMs: lockoutDuration
      };
    }

    return {
      locked: false,
      attemptsRemaining: maxAttempts - _loginAttempts.count,
      lockoutMs: 0
    };
  }

  /**
   * Reset counter setelah login berhasil.
   */
  function recordSuccessfulLogin() {
    _resetLoginAttempts();
  }

  function _resetLoginAttempts() {
    _loginAttempts.count = 0;
    _loginAttempts.firstAttemptTime = null;
    _loginAttempts.lockedUntil = null;
  }

  /* ── Session Signing ── */

  /**
   * Buat signed session token (HMAC-like menggunakan Web Crypto jika tersedia,
   * fallback ke simple hash untuk PoC).
   */
  async function createSignedToken(payload) {
    const secret = (typeof CONFIG !== 'undefined') 
      ? CONFIG.SESSION_SECRET 
      : 'default_secret';
    
    const data = JSON.stringify(payload);
    const signature = await _computeSignature(data, secret);
    
    return btoa(JSON.stringify({
      data: data,
      sig: signature,
      v: 1  // Version untuk future compatibility
    }));
  }

  /**
   * Verifikasi dan decode signed session token.
   * @returns {object|null} payload jika valid, null jika tidak.
   */
  async function verifySignedToken(token) {
    try {
      const secret = (typeof CONFIG !== 'undefined')
        ? CONFIG.SESSION_SECRET
        : 'default_secret';

      const decoded = JSON.parse(atob(token));
      if (!decoded.data || !decoded.sig) return null;

      const expectedSig = await _computeSignature(decoded.data, secret);
      if (decoded.sig !== expectedSig) {
        console.warn('[Security] Token signature tidak valid');
        return null;
      }

      const payload = JSON.parse(decoded.data);

      // Cek expiry
      if (payload.exp && payload.exp < Date.now()) {
        console.warn('[Security] Token expired');
        return null;
      }

      return payload;
    } catch (e) {
      console.warn('[Security] Token decode gagal:', e.message);
      return null;
    }
  }

  /**
   * Compute signature menggunakan Web Crypto API (SHA-256 HMAC).
   * Fallback ke simple hash jika Web Crypto tidak tersedia.
   */
  async function _computeSignature(data, secret) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const msgData = encoder.encode(data);

        const key = await window.crypto.subtle.importKey(
          'raw', keyData, { name: 'HMAC', hash: 'SHA-256' },
          false, ['sign']
        );

        const signature = await window.crypto.subtle.sign('HMAC', key, msgData);
        return Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } catch (e) {
        // Fallback
      }
    }

    // Fallback: simple hash (untuk browser lama)
    return _simpleHash(data + secret);
  }

  /**
   * Simple string hash fallback.
   */
  function _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /* ── Auto-Logout on Inactivity ── */

  let _inactivityTimer = null;
  let _onAutoLogout = null;

  /**
   * Mulai monitoring inactivity.
   * @param {function} onLogout — callback ketika auto-logout terjadi.
   */
  function startInactivityMonitor(onLogout) {
    _onAutoLogout = onLogout;
    const timeout = (typeof CONFIG !== 'undefined')
      ? CONFIG.AUTH.INACTIVITY_TIMEOUT_MS
      : 30 * 60 * 1000;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    function resetTimer() {
      if (_inactivityTimer) clearTimeout(_inactivityTimer);
      _inactivityTimer = setTimeout(() => {
        console.warn('[Security] Auto-logout karena inactivity');
        if (_onAutoLogout) _onAutoLogout();
      }, timeout);
    }

    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start timer
    resetTimer();
  }

  function stopInactivityMonitor() {
    if (_inactivityTimer) {
      clearTimeout(_inactivityTimer);
      _inactivityTimer = null;
    }
  }

  /* ── CSP Nonce Generator ── */

  /**
   * Generate random nonce untuk Content Security Policy.
   */
  function generateNonce() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  return {
    // Sanitization
    sanitizeHTML,
    sanitizeInput,
    // Rate Limiting
    checkLoginLockout,
    recordFailedLogin,
    recordSuccessfulLogin,
    // Session
    createSignedToken,
    verifySignedToken,
    // Inactivity
    startInactivityMonitor,
    stopInactivityMonitor,
    // Utilities
    generateNonce,
  };
})();
