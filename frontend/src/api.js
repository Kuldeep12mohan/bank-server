const API_URL = 'http://localhost:8080';

export async function linkBank(name, email) {
  const res = await fetch(`${API_URL}/link-bank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
  return res.json();
}

export async function transferMoney(token, data) {
  const res = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}