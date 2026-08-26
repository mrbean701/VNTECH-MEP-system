import { apiFetch } from '../config.js';

export async function getVendors() {
    return apiFetch('/vendors');
}
export async function getVendorById(id) {
    return apiFetch(`/vendors/${id}`);
}
export async function createVendor(data) {
    return apiFetch('/vendors', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateVendor(id, data) {
    return apiFetch(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteVendor(id) {
    return apiFetch(`/vendors/${id}`, { method: 'DELETE' });
}