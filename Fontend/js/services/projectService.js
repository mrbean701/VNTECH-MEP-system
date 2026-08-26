// Fontend/js/services/projectService.js

// Lấy danh sách dự án
export async function getProjects() {
    return apiFetch('/projects');
}

// Lấy chi tiết
export async function getProjectById(id) {
    return apiFetch(`/projects/${id}`);
}

// Tạo mới
export async function createProject(data) {
    return apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// Cập nhật
export async function updateProject(id, data) {
    return apiFetch(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// Xóa
export async function deleteProject(id) {
    return apiFetch(`/projects/${id}`, {
        method: 'DELETE'
    });
}