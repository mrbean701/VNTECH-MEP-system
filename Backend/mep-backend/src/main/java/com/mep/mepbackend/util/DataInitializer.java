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
        // Kiểm tra nếu đã có user thì không tạo lại dữ liệu
        if (userRepository.count() > 0) {
            System.out.println("✅ Dữ liệu đã tồn tại. Bỏ qua khởi tạo.");
            return;
        }

        System.out.println("🔄 Bắt đầu khởi tạo dữ liệu mặc định...");

        // ====== 1. Tạo phòng ban ======
        Department deptBGD = new Department(null, "BGD", "Ban Giám đốc", 1L, "Admin", LocalDate.now(), null);
        departmentRepository.save(deptBGD);

        // ====== 2. Tạo user admin ======
        User admin = new User(
                null,
                "admin@mep.com",
                passwordEncoder.encode("password"),
                "Admin",
                "ADMIN",
                deptBGD.getId(),
                "Ban Giám đốc",
                "Quản trị hệ thống",
                LocalDate.now(),
                null
        );
        userRepository.save(admin);

        // ====== 3. Tạo Statuses ======
        insertStatuses();

        // ====== 4. Tạo Workflows ======
        insertWorkflows();

        // ====== 5. Tạo Permission cơ bản ======
        Permission adminPerm = new Permission("ADMIN", null, "admin.view", true);
        permissionRepository.save(adminPerm);

        System.out.println("✅ Khởi tạo dữ liệu mặc định thành công!");
        System.out.println("👤 Tài khoản admin: admin@mep.com / password");
    }

    private void insertStatuses() throws Exception {
        List<Status> statuses = Arrays.asList(
                // MR
                new Status("mr", "Nháp", "DRAFT", "Trạng thái nháp", true, false, 0, "#6b7280"),
                new Status("mr", "Chờ duyệt", "PENDING", "Đã gửi duyệt", false, false, 1, "#f59e0b"),
                new Status("mr", "Đã duyệt", "APPROVED", "Đã được duyệt", false, false, 2, "#22c55e"),
                new Status("mr", "Từ chối", "REJECTED", "Bị từ chối", false, true, 3, "#ef4444"),

                // PR
                new Status("pr", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280"),
                new Status("pr", "Chờ duyệt KH", "PENDING_PLANNING", "Chờ KH duyệt", false, false, 1, "#f59e0b"),
                new Status("pr", "KH đã duyệt", "PLANNING_APPROVED", "KH đã duyệt", false, false, 2, "#3b82f6"),
                new Status("pr", "Chờ duyệt DA", "PENDING_PROJECT", "Chờ DA duyệt", false, false, 3, "#f59e0b"),
                new Status("pr", "DA đã duyệt", "PROJECT_APPROVED", "DA đã duyệt", false, false, 4, "#3b82f6"),
                new Status("pr", "Chờ duyệt CEO", "PENDING_CEO", "Chờ CEO duyệt", false, false, 5, "#f59e0b"),
                new Status("pr", "Đã duyệt", "APPROVED", "Đã duyệt", false, false, 6, "#22c55e"),
                new Status("pr", "Từ chối", "REJECTED", "Từ chối", false, true, 7, "#ef4444"),

                // PO
                new Status("po", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280"),
                new Status("po", "Chờ duyệt KH", "PENDING_PLANNING", "Chờ KH duyệt", false, false, 1, "#f59e0b"),
                new Status("po", "KH đã duyệt", "PLANNING_APPROVED", "KH đã duyệt", false, false, 2, "#3b82f6"),
                new Status("po", "Chờ duyệt DA", "PENDING_PROJECT", "Chờ DA duyệt", false, false, 3, "#f59e0b"),
                new Status("po", "DA đã duyệt", "PROJECT_APPROVED", "DA đã duyệt", false, false, 4, "#3b82f6"),
                new Status("po", "Chờ duyệt CEO", "PENDING_CEO", "Chờ CEO duyệt", false, false, 5, "#f59e0b"),
                new Status("po", "Đã duyệt", "APPROVED", "Đã duyệt", false, false, 6, "#22c55e"),
                new Status("po", "Từ chối", "REJECTED", "Từ chối", false, true, 7, "#ef4444"),

                // GRN
                new Status("grn", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280"),
                new Status("grn", "Đã nhận", "RECEIVED", "Đã nhận", false, false, 1, "#3b82f6"),
                new Status("grn", "QC kiểm tra", "QC_CHECKED", "QC đã kiểm tra", false, false, 2, "#8b5cf6"),
                new Status("grn", "Hoàn thành", "COMPLETED", "Hoàn thành", false, true, 3, "#22c55e"),
                new Status("grn", "Từ chối", "REJECTED", "Từ chối", false, true, 4, "#ef4444"),

                // STO
                new Status("sto", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280"),
                new Status("sto", "Chờ duyệt", "PENDING", "Chờ duyệt", false, false, 1, "#f59e0b"),
                new Status("sto", "Đã duyệt", "APPROVED", "Đã duyệt", false, false, 2, "#3b82f6"),
                new Status("sto", "Hoàn thành", "COMPLETED", "Hoàn thành", false, true, 3, "#22c55e"),

                // Issue
                new Status("issue", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280"),
                new Status("issue", "Chờ duyệt", "PENDING", "Chờ duyệt", false, false, 1, "#f59e0b"),
                new Status("issue", "Đã duyệt", "APPROVED", "Đã duyệt", false, false, 2, "#3b82f6"),
                new Status("issue", "Đã cấp phát", "COMPLETED", "Đã cấp phát", false, false, 3, "#8b5cf6"),
                new Status("issue", "Đã xác nhận", "CONFIRMED", "Đã xác nhận", false, true, 4, "#22c55e"),
                new Status("issue", "Từ chối", "REJECTED", "Từ chối", false, true, 5, "#ef4444"),

                // Material Return
                new Status("materialreturn", "Nháp", "DRAFT", "Nháp", true, false, 0, "#6b7280"),
                new Status("materialreturn", "Chờ duyệt", "PENDING", "Chờ duyệt", false, false, 1, "#f59e0b"),
                new Status("materialreturn", "Đã nhận", "APPROVED", "Thủ kho đã nhận", false, false, 2, "#3b82f6"),
                new Status("materialreturn", "Đã xác nhận", "CONFIRMED", "Đã xác nhận", false, true, 3, "#22c55e"),
                new Status("materialreturn", "Từ chối", "REJECTED", "Từ chối", false, true, 4, "#ef4444")
        );

        statusRepository.saveAll(statuses);
    }

    private void insertWorkflows() throws Exception {
        // MR
        String mrSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "SITE_COMMANDER", "Chỉ huy trưởng duyệt", 5L)
        ));

        // PR
        String prSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "PLANNING", "Kế hoạch duyệt", 2L),
                new WorkflowStepDTO(2, "PROJECT", "Dự án duyệt", 3L),
                new WorkflowStepDTO(3, "CEO", "Tổng Giám đốc duyệt", 1L)
        ));

        // PO
        String poSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "PLANNING", "Kế hoạch duyệt", 2L),
                new WorkflowStepDTO(2, "PROJECT", "Dự án duyệt", 3L),
                new WorkflowStepDTO(3, "CEO", "Tổng Giám đốc duyệt", 1L)
        ));

        // GRN
        String grnSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "PURCHASING", "Lập phiếu", 4L),
                new WorkflowStepDTO(2, "WAREHOUSE", "Thủ kho nhận", null),
                new WorkflowStepDTO(3, "QC", "QC kiểm tra", 6L),
                new WorkflowStepDTO(4, "PURCHASING", "Hoàn thành", 4L)
        ));

        // STO
        String stoSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "PURCHASING", "Lập phiếu", 4L),
                new WorkflowStepDTO(2, "PURCHASING", "Duyệt", 4L),
                new WorkflowStepDTO(3, "PURCHASING", "Xuất kho", 4L)
        ));

        // Issue
        String issueSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "SITE_COMMANDER", "Tạo phiếu", 5L),
                new WorkflowStepDTO(2, "SITE_COMMANDER", "Duyệt", 5L),
                new WorkflowStepDTO(3, "PURCHASING", "Cấp phát", 4L),
                new WorkflowStepDTO(4, "SITE_COMMANDER", "Xác nhận", 5L)
        ));

        // Material Return
        String returnSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "SITE_COMMANDER", "Tạo phiếu", 5L),
                new WorkflowStepDTO(2, "PURCHASING", "Thủ kho nhận", 4L),
                new WorkflowStepDTO(3, "SITE_COMMANDER", "Xác nhận", 5L)
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

    // Inner class hỗ trợ tạo workflow steps
    static class WorkflowStepDTO {
        public Integer step;
        public String role;
        public String label;
        public Long departmentId;

        public WorkflowStepDTO() {}

        public WorkflowStepDTO(Integer step, String role, String label, Long departmentId) {
            this.step = step;
            this.role = role;
            this.label = label;
            this.departmentId = departmentId;
        }
    }
}