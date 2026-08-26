import { apiFetch } from '../config.js';

export async function getPOs() {
    return apiFetch('/purchase-orders');
}
export async function getPOById(id) {
    return apiFetch(`/purchase-orders/${id}`);
}
export async function createPO(data) {
    return apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify(data) });
}
export async function updatePO(id, data) {
    return apiFetch(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deletePO(id) {
    return apiFetch(`/purchase-orders/${id}`, { method: 'DELETE' });
}