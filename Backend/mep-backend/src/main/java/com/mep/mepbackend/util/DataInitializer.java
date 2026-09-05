package com.mep.mepbackend.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.*;
import com.mep.mepbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

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