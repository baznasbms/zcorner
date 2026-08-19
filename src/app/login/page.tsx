'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/tenant-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      // Redirect langsung ke URL Apps Script Web App
      window.location.href = data.redirectUrl;
    } else {
      setError(await res.text());
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-go-500 to-go-700 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-extrabold text-go-700">Login Tenant</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="input w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-100 p-3 text-sm font-medium text-red-700">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            className="btn w-full bg-go-600 text-white hover:bg-go-700"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Bukan tenant? <Link href="/" className="font-semibold text-go-600 hover:underline">Kembali ke Home</Link>
        </div>
      </div>
    </main>
  );
}
