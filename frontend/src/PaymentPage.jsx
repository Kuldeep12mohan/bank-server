import { useState } from 'react';
import { transferMoney } from './api';

export default function PaymentPage({ accounts }) {
  const [from, setFrom] = useState(accounts[0]?.id || '');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  async function handleTransfer(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await transferMoney(token, { fromAccountId: from, toAccountId: to, amount: parseFloat(amount),category:"FOOD" });
    alert('Transfer successful');
  }

  return (
    <form onSubmit={handleTransfer} className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Transfer Money</h1>
      <select value={from} onChange={e => setFrom(e.target.value)} className="border p-2 w-full">
        {accounts.map(acc => (
          <option key={acc.id} value={acc.id}>
            {acc.bankName} - ₹{acc.balance}
          </option>
        ))}
      </select>
      <input value={to} onChange={e => setTo(e.target.value)} placeholder="To Account ID" className="border p-2 w-full" />
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" className="border p-2 w-full" />
      <button type="submit" className="bg-green-500 text-white px-4 py-2">Send</button>
    </form>
  );
}
