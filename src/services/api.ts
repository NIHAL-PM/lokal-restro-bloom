
// Backup/Restore API
export async function exportBackupAPI() {
  return apiFetch('/backup/export');
}

export async function importBackupAPI(data: any) {
  return apiFetch('/backup/import', {
    method: 'POST',
    body: typeof data === 'string' ? data : JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Users API
export async function getUsersAPI() {
  return apiFetch('/users');
}

export async function createUserAPI(user: Omit<any, 'id'>) {
  return apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(user)
  });
}

export async function updateUserAPI(id: string, updates: Partial<any>) {
  return apiFetch(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function deleteUserAPI(id: string) {
  return apiFetch(`/users/${id}`, {
    method: 'DELETE'
  });
}

// Table API
export async function updateTableAPI(id: string, updates: Partial<any>) {
  return apiFetch(`/tables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

// Room API
export async function updateRoomAPI(id: string, updates: Partial<any>) {
  return apiFetch(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

// Transactions API
export async function createTransactionAPI(transaction: Omit<any, 'id'>) {
  return apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction)
  });
}

export async function getTransactionsAPI() {
  return apiFetch('/transactions');
}

export async function updateTransactionAPI(id: string, updates: Partial<any>) {
  return apiFetch(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function deleteTransactionAPI(id: string) {
  return apiFetch(`/transactions/${id}`, {
    method: 'DELETE'
  });
}
// API service for frontend to communicate with backend
const API_URL = process.env.VITE_API_URL || 'http://localhost:4000/api';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
