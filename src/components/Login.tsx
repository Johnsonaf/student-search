'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/search'); // Go to search page after login
    } catch (error) {
      const baseMessage = error instanceof Error ? error.message : undefined;
      setError(baseMessage?.trim() || 'Invalid email or passcode. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center text-center text-white/80">
        <span className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/60 backdrop-blur">
          Student Services
        </span>
        <form
          onSubmit={handleLogin}
          className="w-full rounded-3xl border border-white/10 bg-white/95 p-8 text-left shadow-2xl backdrop-blur-lg sm:p-10"
        >
          <h2 className="mb-2 text-center text-2xl font-semibold text-slate-900 sm:text-3xl">NSQ Search by JC Login</h2>
          <p className="mb-6 text-center text-sm text-slate-500 sm:text-base">
            Sign in with your school email and passcode to continue.
          </p>
          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">School Email</span>
            <input
              type="email"
              placeholder="e.g., user@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              inputMode="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="mb-6 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Passcode</span>
            <input
              type="password"
              placeholder="Your secure passcode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}