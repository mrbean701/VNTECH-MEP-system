// Fontend/js/services/dashboardService.js

import { apiFetch } from '../config.js';

// Hàm lấy tất cả dữ liệu thống kê từ nhiều nguồn
export async function getDashboardStats() {
    try {
        // Gọi song song các API cần thiết
        const [projects, vendors, items, mr, pr, po, grn, warehouses] = await Promise.all([
            apiFetch('/projects'),
            apiFetch('/vendors'),
            apiFetch('/items'),
            apiFetch('/material-requests'),
            apiFetch('/purchase-requests'),
            apiFetch('/purchase-orders'),
            apiFetch('/goods-receipts'),
            apiFetch('/warehouses')
        ]);

        // Tổng hợp số liệu
        return {
            totalProjects: projects?.data?.length || projects?.length || 0,
            totalVendors: vendors?.data?.length || vendors?.length || 0,
            totalItems: items?.data?.length || items?.length || 0,
            totalMR: mr?.data?.length || mr?.length || 0,
            totalPR: pr?.data?.length || pr?.length || 0,
            totalPO: po?.data?.length || po?.length || 0,
            totalGRN: grn?.data?.length || grn?.length || 0,
            totalWarehouses: warehouses?.data?.length || warehouses?.length || 0,
            // Có thể tính thêm tổng giá trị, số lượng theo trạng thái nếu cần
        };
    } catch (error) {
        console.error('Lỗi tải dashboard:', error);
        throw error;
    }
}

// Có thể tách riêng hàm lấy dữ liệu cho biểu đồ
export async function getChartData() {
    // Ví dụ: lấy số lượng MR/PR/PO theo tháng
    // Giả sử backend có API /api/dashboard/chart
    try {
        const response = await apiFetch('/dashboard/chart');
        return response.data || response;
    } catch (error) {
        console.warn('Không có dữ liệu biểu đồ, dùng dữ liệu mẫu');
        return { labels: ['Tháng 1', 'Tháng 2', 'Tháng 3'], values: [10, 20, 15] };
    }
}