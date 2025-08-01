import { useState } from 'react';
import AuthPage from './AuthPage';
import PaymentPage from './PaymentPage';

export default function App() {
  const [accounts, setAccounts] = useState(null);

  return accounts ? (
    <PaymentPage accounts={accounts} />
  ) : (
    <AuthPage onLogin={setAccounts} />
  );
}
