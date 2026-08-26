// Fontend/js/config.js

const API_BASE_URL = 'http://localhost:8080/api'; // Đổi theo cổng backend

// Hàm fetch wrapper
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token'); // Nếu dùng JWT
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    const config = {
        ...options,
        headers
    };
    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            let errorMsg = `HTTP error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) {}
            throw new Error(errorMsg);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}