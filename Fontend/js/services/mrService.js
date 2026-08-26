import { apiFetch } from '../config.js';

export async function getMRs() {
    return apiFetch('/material-requests');
}
export async function getMRById(id) {
    return apiFetch(`/material-requests/${id}`);
}
export async function createMR(data) {
    return apiFetch('/material-requests', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateMR(id, data) {
    return apiFetch(`/material-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteMR(id) {
    return apiFetch(`/material-requests/${id}`, { method: 'DELETE' });
}