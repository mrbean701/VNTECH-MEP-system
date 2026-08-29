package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByCode(String code);

    boolean existsByCode(String code);

    Optional<Department> findByName(String name);

    List<Department> findByParentId(Long parentId);

    long countByParentId(Long parentId);
}