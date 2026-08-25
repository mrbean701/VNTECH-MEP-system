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
        return departmentRepository.save(department);
    }

    @Transactional
    public Department update(Long id, Department details) {
        Department dept = getById(id);
        dept.setCode(details.getCode());
        dept.setName(details.getName());
        dept.setManagerId(details.getManagerId());
        dept.setManagerName(details.getManagerName());
        dept.setUpdatedAt(LocalDate.now());
        return departmentRepository.save(dept);
    }

    @Transactional
    public void delete(Long id) {
        Department dept = getById(id);
        departmentRepository.delete(dept);
    }
}