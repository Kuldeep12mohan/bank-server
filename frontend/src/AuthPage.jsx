import { useState } from 'react';
import { linkBank } from './api';
export default function AuthPage({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const { accessToken, accounts } = await linkBank(name, email);
    localStorage.setItem('token', accessToken);
    onLogin(accounts);
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Link Bank</h1>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="border p-2 w-full" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="border p-2 w-full" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2">Link</button>
    </form>
  );
}