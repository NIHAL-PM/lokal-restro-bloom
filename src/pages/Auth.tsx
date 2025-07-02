import React, { useState } from 'react';
import { apiFetch } from '../services/api';

export default function AuthPage() {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (mode === 'register') {
        await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ pin }) });
        setSuccess('Registered! Please login.');
        setMode('login');
      } else {
        await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ pin }) });
        setSuccess('Logged in!');
        window.location.reload();
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80">
        <h2 className="text-xl mb-4 font-bold text-center">{mode === 'login' ? 'Login' : 'Register Admin'}</h2>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="border p-2 w-full mb-4 rounded"
          minLength={4}
          maxLength={12}
          required
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded mb-2">
          {mode === 'login' ? 'Login' : 'Register'}
        </button>
        <button
          type="button"
          className="text-blue-600 underline w-full"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Register Admin' : 'Back to Login'}
        </button>
      </form>
    </div>
  );
}
