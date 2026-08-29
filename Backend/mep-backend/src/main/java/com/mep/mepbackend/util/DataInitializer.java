package com.mep.mepbackend.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.*;
import com.mep.mepbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final WorkflowRepository workflowRepository;
    private final StatusRepository statusRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        boolean adminExists = userRepository.findByEmail("admin@mep.com")
                .map(user -> "ADMIN".equals(user.getRole()))
                .orElse(false);

        if (adminExists) {
            System.out.println("✅ Tài khoản admin đã tồn tại. Bỏ qua khởi tạo.");
            return;
        }

        System.out.println("🔄 Chưa có tài khoản admin. Bắt đầu khởi tạo dữ liệu mặc định...");

        // Tạo department BGD
        Department deptBGD = departmentRepository.save(
                new Department(null, "BGD", "Ban Giám đốc", null, null, null, LocalDate.now(), null)
        );

        // Tạo admin
        User admin = new User();
        admin.setEmail("admin@mep.com");
        admin.setPassword(passwordEncoder.encode("password"));
        admin.setName("Admin");
        admin.setRole("ADMIN");
        admin.setDepartmentId(deptBGD.getId());
        admin.setDepartment("Ban Giám đốc");
        admin.setPosition("Quản trị hệ thống");
        admin.setCreatedAt(LocalDate.now());
        admin = userRepository.save(admin);

        deptBGD.setManagerId(admin.getId());
        deptBGD.setManagerName(admin.getName());
        departmentRepository.save(deptBGD);

        // Tạo statuses (nếu chưa có)
        if (statusRepository.count() == 0) {
            insertStatuses();
        }

        // Tạo workflows (nếu chưa có)
        if (workflowRepository.count() == 0) {
            insertWorkflows();
        }

        // Tạo permission admin
        if (permissionRepository.count() == 0) {
            Permission adminPerm = new Permission();
            adminPerm.setRole("ADMIN");
            adminPerm.setPermissionKey("admin.view");
            adminPerm.setEnabled(true);
            permissionRepository.save(adminPerm);
        }
        // Sau khi tạo department BGD và admin
        // Cấp permission workflow.override cho phòng ban BGD
        Permission overridePerm = new Permission();
        overridePerm.setRole("DEPARTMENT"); // role này không quan trọng, chỉ để phân biệt
        overridePerm.setDepartmentId(deptBGD.getId());
        overridePerm.setPermissionKey("workflow.override");
        overridePerm.setEnabled(true);
        permissionRepository.save(overridePerm);

        System.out.println("✅ Khởi tạo dữ liệu mặc định thành công!");
        System.out.println("👤 Tài khoản admin: admin@mep.com / password");
    }

    private void insertStatuses() throws Exception {
        List<Status> statuses = Arrays.asList(
                // ===== MR =====
                new Status("mr", "Nháp", "DRAFT", "Trạng thái nháp", true, false, 0, "#6b7280", "order"),
                new Status("mr", "Chờ duyệt", "PENDING", "Đã gửi duyệt", false, false, 1, "#f59e0b", "order"),
                new Status("mr", "Đã duyệt", "APPROVED", "Đã được duyệt", false, false, 2, "#22c55e", "order"),
                new Status("mr", "Từ chối", "REJECTED", "Bị từ chối", false, true, 3, "#ef4444", "order"),

                // ===== PR =====
                new Status("pr", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280", "order"),
                new Status("pr", "Chờ duyệt KH", "PENDING_PLANNING", "Chờ KH duyệt", false, false, 1, "#f59e0b", "order"),
                new Status("pr", "KH đã duyệt", "PLANNING_APPROVED", "KH đã duyệt", false, false, 2, "#3b82f6", "order"),
                new Status("pr", "Chờ duyệt DA", "PENDING_PROJECT", "Chờ DA duyệt", false, false, 3, "#f59e0b", "order"),
                new Status("pr", "DA đã duyệt", "PROJECT_APPROVED", "DA đã duyệt", false, false, 4, "#3b82f6", "order"),
                new Status("pr", "Chờ duyệt CEO", "PENDING_CEO", "Chờ CEO duyệt", false, false, 5, "#f59e0b", "order"),
                new Status("pr", "Đã duyệt", "APPROVED", "Đã duyệt", false, false, 6, "#22c55e", "order"),
                new Status("pr", "Từ chối", "REJECTED", "Từ chối", false, true, 7, "#ef4444", "order"),

                // ===== PO =====
                new Status("po", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280", "order"),
                new Status("po", "Chờ duyệt KH", "PENDING_PLANNING", "Chờ KH duyệt", false, false, 1, "#f59e0b", "order"),
                new Status("po", "KH đã duyệt", "PLANNING_APPROVED", "KH đã duyệt", false, false, 2, "#3b82f6", "order"),
                new Status("po", "Chờ duyệt DA", "PENDING_PROJECT", "Chờ DA duyệt", false, false, 3, "#f59e0b", "order"),
                new Status("po", "DA đã duyệt", "PROJECT_APPROVED", "DA đã duyệt", false, false, 4, "#3b82f6", "order"),
                new Status("po", "Chờ duyệt CEO", "PENDING_CEO", "Chờ CEO duyệt", false, false, 5, "#f59e0b", "order"),
                new Status("po", "Đã duyệt", "APPROVED", "Đã duyệt", false, false, 6, "#22c55e", "order"),
                new Status("po", "Từ chối", "REJECTED", "Từ chối", false, true, 7, "#ef4444", "order"),

                // ===== GRN =====
                new Status("grn", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280", "warehouse"),
                new Status("grn", "Đã nhận", "RECEIVED", "Đã nhận", false, false, 1, "#3b82f6", "warehouse"),
                new Status("grn", "QC kiểm tra", "QC_CHECKED", "QC đã kiểm tra", false, false, 2, "#8b5cf6", "warehouse"),
                new Status("grn", "Hoàn thành", "COMPLETED", "Hoàn thành", false, true, 3, "#22c55e", "warehouse"),
                new Status("grn", "Từ chối", "REJECTED", "Từ chối", false, true, 4, "#ef4444", "warehouse"),

                // ===== STO =====
                new Status("sto", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280", "warehouse"),
                new Status("sto", "Chờ duyệt", "PENDING", "Chờ duyệt", false, false, 1, "#f59e0b", "warehouse"),
                new Status("sto", "Đã duyệt", "APPROVED", "Đã duyệt", false, false, 2, "#3b82f6", "warehouse"),
                new Status("sto", "Hoàn thành", "COMPLETED", "Hoàn thành", false, true, 3, "#22c55e", "warehouse"),

                // ===== Issue =====
                new Status("issue", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280", "warehouse"),
                new Status("issue", "Chờ duyệt", "PENDING", "Chờ duyệt", false, false, 1, "#f59e0b", "warehouse"),
                new Status("issue", "Đã duyệt", "APPROVED", "Đã duyệt", false, false, 2, "#3b82f6", "warehouse"),
                new Status("issue", "Đã cấp phát", "COMPLETED", "Đã cấp phát", false, false, 3, "#8b5cf6", "warehouse"),
                new Status("issue", "Đã xác nhận", "CONFIRMED", "Đã xác nhận", false, true, 4, "#22c55e", "warehouse"),
                new Status("issue", "Từ chối", "REJECTED", "Từ chối", false, true, 5, "#ef4444", "warehouse"),

                // ===== Material Return =====
                new Status("materialreturn", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280", "warehouse"),
                new Status("materialreturn", "Chờ duyệt", "PENDING", "Chờ duyệt", false, false, 1, "#f59e0b", "warehouse"),
                new Status("materialreturn", "Đã nhận", "APPROVED", "Thủ kho đã nhận", false, false, 2, "#3b82f6", "warehouse"),
                new Status("materialreturn", "Đã xác nhận", "CONFIRMED", "Đã xác nhận", false, true, 3, "#22c55e", "warehouse"),
                new Status("materialreturn", "Từ chối", "REJECTED", "Từ chối", false, true, 4, "#ef4444", "warehouse"),

                // ===== ✅ CÁC ENTITY TYPE MỚI =====
                // User
                new Status("user", "Hoạt động", "ACTIVE", "User đang hoạt động", true, false, 0, "#22c55e", "user"),
                new Status("user", "Bị khóa", "LOCKED", "User bị khóa", false, true, 1, "#ef4444", "user"),
                new Status("user", "Chờ kích hoạt", "PENDING", "Chờ kích hoạt", false, false, 2, "#f59e0b", "user"),

                // Department
                new Status("department", "Hoạt động", "ACTIVE", "Phòng ban hoạt động", true, false, 0, "#22c55e", "department"),
                new Status("department", "Đã đóng", "INACTIVE", "Phòng ban đã đóng", false, true, 1, "#ef4444", "department"),

                // Vendor
                new Status("vendor", "Đang hợp tác", "ACTIVE", "Đang hợp tác", true, false, 0, "#22c55e", "vendor"),
                new Status("vendor", "Ngừng hợp tác", "INACTIVE", "Ngừng hợp tác", false, true, 1, "#ef4444", "vendor"),

                // Project
                new Status("project", "Đang hoạt động", "ACTIVE", "Dự án đang hoạt động", true, false, 0, "#22c55e", "project"),
                new Status("project", "Đã đóng", "INACTIVE", "Dự án đã đóng", false, true, 1, "#ef4444", "project"),
                new Status("project", "Tạm dừng", "SUSPENDED", "Dự án tạm dừng", false, false, 2, "#f59e0b", "project"),

                // Warehouse
                new Status("warehouse", "Đang hoạt động", "ACTIVE", "Kho đang hoạt động", true, false, 0, "#22c55e", "warehouse"),
                new Status("warehouse", "Đã đóng", "INACTIVE", "Kho đã đóng", false, true, 1, "#ef4444", "warehouse"),

                // Workflow
                new Status("workflow", "Nháp", "DRAFT", "Workflow nháp", true, false, 0, "#6b7280", "workflow"),
                new Status("workflow", "Đang áp dụng", "ACTIVE", "Workflow đang áp dụng", false, false, 1, "#22c55e", "workflow"),
                new Status("workflow", "Ngừng áp dụng", "INACTIVE", "Workflow ngừng áp dụng", false, false, 2, "#ef4444", "workflow")
        );
        statusRepository.saveAll(statuses);
    }

    private void insertWorkflows() throws Exception {
        // MR - 1 bước
        String mrSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "mr.approve", "Chỉ huy trưởng duyệt", 5L, null)
        ));

        // PR - 3 bước với statusCode
        String prSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "pr.approve", "Kế hoạch duyệt", 2L, "PENDING_PROJECT"),
                new WorkflowStepDTO(2, "pr.approve", "Dự án duyệt", 3L, "PENDING_CEO"),
                new WorkflowStepDTO(3, "pr.approve", "CEO duyệt", 1L, "APPROVED")
        ));

        // PO - 3 bước với statusCode
        String poSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "po.approve", "Kế hoạch duyệt", 2L, "PENDING_PROJECT"),
                new WorkflowStepDTO(2, "po.approve", "Dự án duyệt", 3L, "PENDING_CEO"),
                new WorkflowStepDTO(3, "po.approve", "CEO duyệt", 1L, "APPROVED")
        ));

        // GRN - 4 bước
        String grnSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "grn.create", "Lập phiếu", 4L, "RECEIVED"),
                new WorkflowStepDTO(2, "grn.receive", "Thủ kho nhận", null, "QC_CHECKED"),
                new WorkflowStepDTO(3, "grn.qc", "QC kiểm tra", 6L, "COMPLETED"),
                new WorkflowStepDTO(4, "grn.complete", "Hoàn thành", 4L, null)
        ));

        // STO - 3 bước
        String stoSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "sto.create", "Lập phiếu", 4L, "PENDING"),
                new WorkflowStepDTO(2, "sto.approve", "Duyệt", 4L, "APPROVED"),
                new WorkflowStepDTO(3, "sto.complete", "Xuất kho", 4L, "COMPLETED")
        ));

        // Issue - 4 bước
        String issueSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "issue.create", "Tạo phiếu", 5L, "PENDING"),
                new WorkflowStepDTO(2, "issue.approve", "Duyệt", 5L, "APPROVED"),
                new WorkflowStepDTO(3, "issue.complete", "Cấp phát", 4L, "COMPLETED"),
                new WorkflowStepDTO(4, "issue.confirm", "Xác nhận", 5L, "CONFIRMED")
        ));

        // Material Return - 3 bước
        String returnSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "materialreturn.create", "Tạo phiếu", 5L, "PENDING"),
                new WorkflowStepDTO(2, "materialreturn.approve", "Thủ kho nhận", 4L, "APPROVED"),
                new WorkflowStepDTO(3, "materialreturn.confirm", "Xác nhận", 5L, "CONFIRMED")
        ));

        List<Workflow> workflows = Arrays.asList(
                new Workflow("mr", "MR - Mặc định", "Quy trình duyệt MR", mrSteps, true, true, "ACTIVE"),
                new Workflow("pr", "PR - 3 bước mặc định", "Planning → Project → CEO", prSteps, true, true, "ACTIVE"),
                new Workflow("po", "PO - 3 bước mặc định", "Planning → Project → CEO", poSteps, true, true, "ACTIVE"),
                new Workflow("grn", "GRN - 4 bước mặc định", "Lập phiếu → Nhận → QC → Hoàn thành", grnSteps, true, true, "ACTIVE"),
                new Workflow("sto", "STO - 3 bước mặc định", "Lập phiếu → Duyệt → Xuất kho", stoSteps, true, true, "ACTIVE"),
                new Workflow("issue", "Issue - 4 bước mặc định", "Tạo phiếu → Duyệt → Cấp phát → Xác nhận", issueSteps, true, true, "ACTIVE"),
                new Workflow("materialreturn", "Material Return - 3 bước mặc định", "Tạo phiếu → Nhận → Xác nhận", returnSteps, true, true, "ACTIVE")
        );
        workflowRepository.saveAll(workflows);
    }

    // Inner class
    static class WorkflowStepDTO {
        public Integer step;
        public String permissionKey;
        public String label;
        public Long departmentId;
        public String statusCode;

        public WorkflowStepDTO() {
        }

        public WorkflowStepDTO(Integer step, String permissionKey, String label, Long departmentId, String statusCode) {
            this.step = step;
            this.permissionKey = permissionKey;
            this.label = label;
            this.departmentId = departmentId;
            this.statusCode = statusCode;
        }
    }

}