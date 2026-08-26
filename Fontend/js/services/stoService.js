import { apiFetch } from '../config.js';

export async function getSTOs() {
    return apiFetch('/stock-transfers');
}
export async function getSTOById(id) {
    return apiFetch(`/stock-transfers/${id}`);
}
export async function createSTO(data) {
    return apiFetch('/stock-transfers', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateSTO(id, data) {
    return apiFetch(`/stock-transfers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteSTO(id) {
    return apiFetch(`/stock-transfers/${id}`, { method: 'DELETE' });
}