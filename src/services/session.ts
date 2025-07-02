import { apiFetch } from './api';

export async function getSession() {
  try {
    return await apiFetch('/auth/session');
  } catch {
    return { authenticated: false };
  }
}

export async function logout() {
  await apiFetch('/auth/logout', { method: 'POST' });
}
