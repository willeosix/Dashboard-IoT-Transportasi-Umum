'use client';
import { useState } from 'react';
import { checkLoginLockout, recordFailedLogin, recordSuccessfulLogin, createSignedToken, sanitizeInput } from '@/utils/security';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const showError = (msg) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showError('Masukkan username dan password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const lockoutStatus = checkLoginLockout();
      if (lockoutStatus.locked) {
        const remainingSecs = Math.ceil(lockoutStatus.remainingMs / 1000);
        throw new Error(`Terlalu banyak percobaan. Coba lagi dalam ${remainingSecs} detik.`);
      }

      const cleanUser = sanitizeInput(username, 50);
      const cleanPass = sanitizeInput(password, 50);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const validUser = process.env.NEXT_PUBLIC_AUTH_USERNAME || 'admin';
      const validPass = process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'transumbandung2026';

      if (cleanUser === validUser && cleanPass === validPass) {
        recordSuccessfulLogin();
        
        const duration = parseInt(process.env.NEXT_PUBLIC_SESSION_DURATION_MS || '28800000');
        const token = await createSignedToken({
          user: cleanUser,
          exp: Date.now() + duration,
          iat: Date.now()
        });
        
        sessionStorage.setItem('transum_session', token);
        onLoginSuccess();
      } else {
        const failStatus = recordFailedLogin();
        if (failStatus.locked) {
          const lockoutMins = Math.ceil(failStatus.lockoutMs / 60000);
          throw new Error(`Akun terkunci selama ${lockoutMins} menit karena percobaan gagal berulang.`);
        } else {
          throw new Error(`Username atau password salah. Sisa percobaan: ${failStatus.attemptsRemaining}`);
        }
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-deepest)] overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[100px] animate-float-orb"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[100px] animate-float-orb" style={{ animationDelay: '-10s' }}></div>
      </div>
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
        }}
      ></div>

      {/* Login Card */}
      <div className={`relative w-full max-w-md p-8 rounded-3xl glass-heavy shadow-2xl animate-slide-up ${isShaking ? 'animate-[shakeX_0.5s_ease-in-out]' : ''} m-4`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-3xl mb-4 shadow-lg border border-blue-400/30">
            🚍
          </div>
          <h1 className="text-3xl font-serif text-[var(--color-text-primary)] mb-2">TransUm Bandung</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">IoT Passenger Counter Dashboard</p>
          <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold tracking-wider uppercase">
            Koridor 5 — Dipatiukur ↔ Jatinangor
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider ml-1" htmlFor="username">Username</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--color-bg-base)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Masukkan username"
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider ml-1" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--color-bg-base)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Masukkan password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-start gap-2">
              <span className="text-red-500">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="relative mt-2 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : (
              <span>Masuk ke Dashboard</span>
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
        }
      `}</style>
    </div>
  );
}
