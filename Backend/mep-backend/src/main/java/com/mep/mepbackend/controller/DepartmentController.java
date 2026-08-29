package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Department;
import com.mep.mepbackend.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public List<Department> getAll() {
        return departmentService.getAll();
    }

    @GetMapping("/{id}")
    public Department getById(@PathVariable Long id) {
        return departmentService.getById(id);
    }

        @GetMapping("/code/{code}")
    public Department getByCode(@PathVariable String code) {
        return departmentService.getByCode(code);
    }

    @GetMapping("/{id}/sub")
    public List<Department> getSubDepartments(@PathVariable Long id) {
        return departmentService.getSubDepartments(id);
    }



    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Department create(@RequestBody Department department) {
        return departmentService.create(department);
    }

    @PutMapping("/{id}")
    public Department update(@PathVariable Long id, @RequestBody Department department) {
        return departmentService.update(id, department);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        departmentService.delete(id);
    }
}