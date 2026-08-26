import { apiFetch } from '../config.js';

export async function getGRNs() {
    return apiFetch('/goods-receipts');
}
export async function getGRNById(id) {
    return apiFetch(`/goods-receipts/${id}`);
}
export async function createGRN(data) {
    return apiFetch('/goods-receipts', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateGRN(id, data) {
    return apiFetch(`/goods-receipts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteGRN(id) {
    return apiFetch(`/goods-receipts/${id}`, { method: 'DELETE' });
}