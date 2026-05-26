/**
 * security.js
 * Security utilities: input sanitization, brute-force protection,
 * session signing (HMAC), and inactivity monitoring.
 */

// ── Input Sanitization ──

export function sanitizeInput(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  let cleaned = str.trim().slice(0, maxLength);
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  return cleaned;
}

// ── Rate Limiting (Brute Force Protection) ──

const loginAttempts = {
  count: 0,
  firstAttemptTime: null,
  lockedUntil: null,
};

export function checkLoginLockout() {
  if (!loginAttempts.lockedUntil) {
    return { locked: false, remainingMs: 0 };
  }
  const now = Date.now();
  if (now >= loginAttempts.lockedUntil) {
    resetLoginAttempts();
    return { locked: false, remainingMs: 0 };
  }
  return { locked: true, remainingMs: loginAttempts.lockedUntil - now };
}

export function recordFailedLogin() {
  const maxAttempts = parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '5');
  const lockoutDuration = parseInt(process.env.NEXT_PUBLIC_LOCKOUT_DURATION_MS || '300000');

  loginAttempts.count++;
  if (!loginAttempts.firstAttemptTime) {
    loginAttempts.firstAttemptTime = Date.now();
  }

  if (loginAttempts.count >= maxAttempts) {
    loginAttempts.lockedUntil = Date.now() + lockoutDuration;
    return { locked: true, attemptsRemaining: 0, lockoutMs: lockoutDuration };
  }

  return {
    locked: false,
    attemptsRemaining: maxAttempts - loginAttempts.count,
    lockoutMs: 0,
  };
}

export function recordSuccessfulLogin() {
  resetLoginAttempts();
}

function resetLoginAttempts() {
  loginAttempts.count = 0;
  loginAttempts.firstAttemptTime = null;
  loginAttempts.lockedUntil = null;
}

// ── Session Signing ──

async function computeSignature(data, secret) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const msgData = encoder.encode(data);
      const key = await window.crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const signature = await window.crypto.subtle.sign('HMAC', key, msgData);
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) { /* fallback */ }
  }
  // Fallback
  let hash = 0;
  const str = data + secret;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function createSignedToken(payload) {
  const secret = process.env.NEXT_PUBLIC_SESSION_SECRET || 'default_secret';
  const data = JSON.stringify(payload);
  const signature = await computeSignature(data, secret);
  return btoa(JSON.stringify({ data, sig: signature, v: 1 }));
}

export async function verifySignedToken(token) {
  try {
    const secret = process.env.NEXT_PUBLIC_SESSION_SECRET || 'default_secret';
    const decoded = JSON.parse(atob(token));
    if (!decoded.data || !decoded.sig) return null;

    const expectedSig = await computeSignature(decoded.data, secret);
    if (decoded.sig !== expectedSig) return null;

    const payload = JSON.parse(decoded.data);
    if (payload.exp && payload.exp < Date.now()) return null;

    return payload;
  } catch (e) {
    return null;
  }
}

// ── Inactivity Monitor ──

let inactivityTimer = null;

export function startInactivityMonitor(onLogout) {
  const timeout = parseInt(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT_MS || '1800000');
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  function resetTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (onLogout) onLogout();
    }, timeout);
  }

  events.forEach(event => {
    document.addEventListener(event, resetTimer, { passive: true });
  });

  resetTimer();

  // Return cleanup function
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, resetTimer);
    });
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  };
}
