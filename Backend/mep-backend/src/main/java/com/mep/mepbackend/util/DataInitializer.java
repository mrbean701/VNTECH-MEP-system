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
    private final ProjectRepository projectRepository;
    private final WarehouseRepository warehouseRepository;
    private final ItemRepository itemRepository;
    private final VendorRepository vendorRepository;
    private final WorkflowRepository workflowRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        // Chỉ chạy nếu chưa có dữ liệu
        if (userRepository.count() > 0) {
            System.out.println("✅ Dữ liệu đã tồn tại. Bỏ qua khởi tạo.");
            return;
        }

        System.out.println("🔄 Bắt đầu khởi tạo dữ liệu mẫu...");

        // ====== 1. Departments ======
        List<Department> departments = Arrays.asList(
                new Department(null, "BGD", "Ban Giám đốc", 1L, "Admin", LocalDate.now(), null),
                new Department(null, "KH", "Phòng Kế hoạch", 3L, "Planning", LocalDate.now(), null),
                new Department(null, "DA", "Phòng Dự án", 4L, "Project", LocalDate.now(), null),
                new Department(null, "MH", "Phòng Mua hàng", 5L, "Purchasing", LocalDate.now(), null),
                new Department(null, "CT", "Ban Chỉ huy công trường", 6L, "Commander", LocalDate.now(), null),
                new Department(null, "QC", "Phòng QC", 7L, "QC", LocalDate.now(), null)
        );
        departmentRepository.saveAll(departments);

        // ====== 2. Users ======
        List<User> users = Arrays.asList(
                new User(null, "admin@mep.com", passwordEncoder.encode("password"), "Admin", "ADMIN", 1L, "Ban Giám đốc", "Quản trị hệ thống", LocalDate.now(), null),
                new User(null, "ceo@mep.com", passwordEncoder.encode("password"), "CEO", "CEO", 1L, "Ban Giám đốc", "Tổng Giám đốc", LocalDate.now(), null),
                new User(null, "planning@mep.com", passwordEncoder.encode("password"), "Planning", "PLANNING", 2L, "Phòng Kế hoạch", "Trưởng phòng KH", LocalDate.now(), null),
                new User(null, "project@mep.com", passwordEncoder.encode("password"), "Project Manager", "PROJECT", 3L, "Phòng Dự án", "Quản lý dự án", LocalDate.now(), null),
                new User(null, "purchasing@mep.com", passwordEncoder.encode("password"), "Purchasing", "PURCHASING", 4L, "Phòng Mua hàng", "Nhân viên mua hàng", LocalDate.now(), null),
                new User(null, "commander@mep.com", passwordEncoder.encode("password"), "Site Commander", "SITE_COMMANDER", 5L, "Ban Chỉ huy công trường", "Chỉ huy trưởng", LocalDate.now(), null),
                new User(null, "qc@mep.com", passwordEncoder.encode("password"), "QC", "QC", 6L, "Phòng QC", "QC", LocalDate.now(), null)
        );
        userRepository.saveAll(users);

        // ====== 3. Projects ======
        List<Project> projects = Arrays.asList(
                new Project(null, "DA001", "Dự án KCN Long Hậu", "Cty TNHH Long Hậu", "Nguyễn Văn A", LocalDate.now(), null, "ACTIVE", null, LocalDate.now(), null),
                new Project(null, "DA002", "Dự án Nhà máy nhựa Đại Đồng", "Cty Cổ phần Đại Đồng", "Trần Văn B", LocalDate.now(), null, "ACTIVE", null, LocalDate.now(), null)
        );
        projectRepository.saveAll(projects);

        // ====== 4. Warehouses ======
        List<Warehouse> warehouses = Arrays.asList(
                new Warehouse(null, "KHO_TONG", "Kho Tổng", "CENTRAL", null, "Lê Thị C", "KCN Long Hậu", "ACTIVE", null, LocalDate.now(), null),
                new Warehouse(null, "KHO_DA001", "Kho dự án DA001", "SITE", 1L, "Phạm Văn D", "Công trường DA001", "ACTIVE", null, LocalDate.now(), null),
                new Warehouse(null, "KHO_DA002", "Kho dự án DA002", "SITE", 2L, "Hoàng Văn E", "Công trường DA002", "ACTIVE", null, LocalDate.now(), null)
        );
        warehouseRepository.saveAll(warehouses);

        // ====== 5. Items ======
        List<Item> items = Arrays.asList(
                new Item(null, "VT001", "Ống thép DN21", "Thép", "DN21", "cây", java.math.BigDecimal.valueOf(500000), "ACTIVE", null, LocalDate.now(), null),
                new Item(null, "VT002", "Dây điện CVV 2x1.5", "Điện", "CVV 2x1.5", "mét", java.math.BigDecimal.valueOf(20000), "ACTIVE", null, LocalDate.now(), null),
                new Item(null, "VT003", "Đèn LED 18W", "Điện", "LED 18W", "cái", java.math.BigDecimal.valueOf(150000), "ACTIVE", null, LocalDate.now(), null)
        );
        itemRepository.saveAll(items);

        // ====== 6. Vendors ======
        List<Vendor> vendors = Arrays.asList(
                new Vendor(null, "NCC001", "Cty Vật tư Mạnh Cường", "Thép", "Mr. Mạnh", "0901234567", "manh@example.com", "30 ngày", null, LocalDate.now(), null),
                new Vendor(null, "NCC002", "Cty Điện Trường Thịnh", "Điện", "Ms. Thịnh", "0912345678", "thinh@example.com", "45 ngày", null, LocalDate.now(), null)
        );
        vendorRepository.saveAll(vendors);

        // ====== 7. Workflows - ĐA DẠNG MẪU ======

        // MR: 1 mẫu (chỉ có 1 bước)
        String mrSteps1 = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "SITE_COMMANDER", "Chỉ huy trưởng duyệt", 5L)
        ));

        // PR: 2 mẫu
        String prSteps1 = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "PLANNING", "Kế hoạch duyệt", 2L),
                new WorkflowStepDTO(2, "PROJECT", "Dự án duyệt", 3L),
                new WorkflowStepDTO(3, "CEO", "Tổng Giám đốc duyệt", 1L)
        ));
        String prSteps2 = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "CEO", "CEO duyệt nhanh", 1L)
        ));

        // PO: 2 mẫu
        String poSteps1 = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "PLANNING", "Kế hoạch duyệt", 2L),
                new WorkflowStepDTO(2, "PROJECT", "Dự án duyệt", 3L),
                new WorkflowStepDTO(3, "CEO", "Tổng Giám đốc duyệt", 1L)
        ));
        String poSteps2 = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "CEO", "CEO duyệt nhanh", 1L)
        ));

        // GRN: 1 mẫu
        String grnSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "PURCHASING", "Lập phiếu", 4L),
                new WorkflowStepDTO(2, "WAREHOUSE", "Thủ kho nhận", null),
                new WorkflowStepDTO(3, "QC", "QC kiểm tra", 6L),
                new WorkflowStepDTO(4, "PURCHASING", "Hoàn thành", 4L)
        ));

        // STO: 1 mẫu
        String stoSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "PURCHASING", "Lập phiếu", 4L),
                new WorkflowStepDTO(2, "PURCHASING", "Duyệt", 4L),
                new WorkflowStepDTO(3, "PURCHASING", "Xuất kho", 4L)
        ));

        // Issue: 1 mẫu
        String issueSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "SITE_COMMANDER", "Tạo phiếu", 5L),
                new WorkflowStepDTO(2, "SITE_COMMANDER", "Duyệt", 5L),
                new WorkflowStepDTO(3, "PURCHASING", "Cấp phát", 4L),
                new WorkflowStepDTO(4, "SITE_COMMANDER", "Xác nhận", 5L)
        ));

        // MaterialReturn: 1 mẫu
        String returnSteps = objectMapper.writeValueAsString(Arrays.asList(
                new WorkflowStepDTO(1, "SITE_COMMANDER", "Tạo phiếu", 5L),
                new WorkflowStepDTO(2, "PURCHASING", "Thủ kho nhận", 4L),
                new WorkflowStepDTO(3, "SITE_COMMANDER", "Xác nhận", 5L)
        ));

        // Lưu các workflow với isSystem = true, isActive = true cho mẫu đầu tiên
        List<Workflow> workflows = Arrays.asList(
                // MR - 1 mẫu
                new Workflow("mr", "MR - 1 bước chỉ huy trưởng", null, mrSteps1, true, true),

                // PR - 2 mẫu (mẫu 1 active, mẫu 2 inactive)
                new Workflow("pr", "PR - 3 bước mặc định", "Planning → Project → CEO", prSteps1, true, true),
                new Workflow("pr", "PR - 1 bước CEO duyệt nhanh", "Chỉ CEO duyệt 1 bước", prSteps2, true, false),

                // PO - 2 mẫu
                new Workflow("po", "PO - 3 bước mặc định", "Planning → Project → CEO", poSteps1, true, true),
                new Workflow("po", "PO - 1 bước CEO duyệt nhanh", "Chỉ CEO duyệt 1 bước", poSteps2, true, false),

                // GRN
                new Workflow("grn", "GRN - 4 bước đầy đủ", null, grnSteps, true, true),

                // STO
                new Workflow("sto", "STO - 3 bước", null, stoSteps, true, true),

                // Issue
                new Workflow("issue", "Issue - 4 bước đầy đủ", null, issueSteps, true, true),

                // Material Return
                new Workflow("materialreturn", "Material Return - 3 bước", null, returnSteps, true, true)
        );
        workflowRepository.saveAll(workflows);

        // ====== 8. Permissions ======
        List<Permission> permissions = Arrays.asList(
                // CEO
                new Permission(null, "CEO", "dashboard.view", true),
                new Permission(null, "CEO", "pr.approve", true),
                new Permission(null, "CEO", "po.approve", true),
                // PLANNING
                new Permission(null, "PLANNING", "pr.approve", true),
                new Permission(null, "PLANNING", "po.approve", true),
                // PROJECT
                new Permission(null, "PROJECT", "pr.approve", true),
                new Permission(null, "PROJECT", "po.approve", true),
                // PURCHASING
                new Permission(null, "PURCHASING", "pr.create", true),
                new Permission(null, "PURCHASING", "pr.edit", true),
                new Permission(null, "PURCHASING", "po.create", true),
                new Permission(null, "PURCHASING", "po.edit", true),
                new Permission(null, "PURCHASING", "grn.create", true),
                new Permission(null, "PURCHASING", "grn.receive", true),
                new Permission(null, "PURCHASING", "sto.create", true),
                // SITE_COMMANDER
                new Permission(null, "SITE_COMMANDER", "mr.create", true),
                new Permission(null, "SITE_COMMANDER", "mr.approve", true),
                new Permission(null, "SITE_COMMANDER", "issue.create", true),
                new Permission(null, "SITE_COMMANDER", "issue.approve", true),
                new Permission(null, "SITE_COMMANDER", "materialreturn.create", true),
                // QC
                new Permission(null, "QC", "grn.qc", true)
        );
        permissionRepository.saveAll(permissions);

        System.out.println("✅ Khởi tạo dữ liệu mẫu thành công!");
        System.out.println("📊 Workflows: " + workflowRepository.count() + " mẫu đã được tạo.");
    }

    // Inner class để hỗ trợ tạo workflow steps
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