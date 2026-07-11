import api from './api';
import axios from 'axios';
import { store } from '../store';
import type { PaginatedResponse } from '../types';

export async function fetchList<T>(endpoint: string, params?: Record<string, unknown>): Promise<T[]> {
  try {
    const { data } = await api.get<PaginatedResponse<T> | T[]>(endpoint, { params });
    if (Array.isArray(data)) return data;
    return data.data || [];
  } catch {
    return [];
  }
}

export async function fetchOne<T>(endpoint: string, id: number | string): Promise<T | null> {
  try {
    const { data } = await api.get<{ data: T } | T>(`${endpoint}/${id}`);
    return data && typeof data === 'object' && 'data' in data ? data.data : (data as T);
  } catch {
    return null;
  }
}

export async function createItem<T>(endpoint: string, payload: Partial<T>): Promise<T> {
  const { data } = await api.post<{ data: T } | T>(endpoint, payload);
  return data && typeof data === 'object' && 'data' in data ? data.data : (data as T);
}

export async function updateItem<T>(endpoint: string, id: number | string, payload: Partial<T>): Promise<T> {
  const { data } = await api.put<{ data: T } | T>(`${endpoint}/${id}`, payload);
  return data && typeof data === 'object' && 'data' in data ? data.data : (data as T);
}

export async function deleteItem(endpoint: string, id: number | string): Promise<void> {
  await api.delete(`${endpoint}/${id}`);
}

export async function createWithFile<T>(endpoint: string, formData: FormData): Promise<T> {
  const { data } = await api.post<{ data: T } | T>(endpoint, formData);
  return data && typeof data === 'object' && 'data' in data ? data.data : (data as T);
}

export async function updateWithFile<T>(endpoint: string, id: number | string, formData: FormData): Promise<T> {
  const { data } = await api.post<{ data: T } | T>(`${endpoint}/${id}/with-bill`, formData);
  return data && typeof data === 'object' && 'data' in data ? data.data : (data as T);
}

export const getStorageUrl = (path?: string | null) => {
  if (!path) return null;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
  return `${base}/storage/${path}`;
};

export async function downloadReport(
  type: string,
  dateFrom: string,
  dateTo: string,
  format: 'pdf' | 'excel',
  fallbackName?: string,
): Promise<void> {
  const token = store.getState().auth.token;
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const mimeType = format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const response = await axios.get(`${baseURL}/reports/export`, {
    params: { type, date_from: dateFrom, date_to: dateTo, format },
    responseType: 'blob',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: mimeType,
    },
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  let filename = fallbackName || `${type}_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const blob = new Blob([response.data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadInvoicePdf(invoiceId: number, fallbackName = 'invoice.pdf'): Promise<void> {
  const token = store.getState().auth.token;
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const response = await axios.get(`${baseURL}/invoices/${invoiceId}/download`, {
    responseType: 'blob',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/pdf',
    },
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  let filename = fallbackName;
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export const formatDate = (value: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
