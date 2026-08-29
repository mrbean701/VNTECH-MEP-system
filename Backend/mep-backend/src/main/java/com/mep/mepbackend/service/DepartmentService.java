package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.Department;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final AuditLogService auditLogService;

    public List<Department> getAll() {
        return departmentRepository.findAll();
    }

    public Department getById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
    }

    public Department getByCode(String code) {
        return departmentRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with code: " + code));
    }

    @Transactional
    public Department create(Department department) {
        if (departmentRepository.existsByCode(department.getCode())) {
            throw new RuntimeException("Mã phòng ban đã tồn tại");
        }
        department.setCreatedAt(LocalDate.now());
        Department saved = departmentRepository.save(department);
        auditLogService.log("CREATE", "DEPARTMENT", String.valueOf(saved.getId()),
                "Tạo phòng ban " + saved.getName() + " (" + saved.getCode() + ")", null);
        return saved;
    }

    @Transactional
    public Department update(Long id, Department details) {
        Department dept = getById(id);
        dept.setCode(details.getCode());
        dept.setName(details.getName());
        dept.setManagerId(details.getManagerId());
        dept.setManagerName(details.getManagerName());
        dept.setParentId(details.getParentId());
        dept.setUpdatedAt(LocalDate.now());
        Department saved = departmentRepository.save(dept);
        auditLogService.log("UPDATE", "DEPARTMENT", String.valueOf(id),
                "Cập nhật phòng ban " + saved.getName(), null);
        return saved;
    }

    public List<Department> getSubDepartments(Long id) {
        return departmentRepository.findByParentId(id);
    }

    @Transactional
    public void delete(Long id) {
        Department dept = getById(id);
        long subCount = departmentRepository.countByParentId(id);
        if (subCount > 0) {
            throw new RuntimeException("Không thể xóa phòng ban đang có phòng ban con");
        }
        departmentRepository.delete(dept);
        auditLogService.log("DELETE", "DEPARTMENT", String.valueOf(id),
                "Xóa phòng ban " + dept.getName(), null);
    }
}

