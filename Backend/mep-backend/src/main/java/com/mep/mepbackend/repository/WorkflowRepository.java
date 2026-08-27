package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Long> {

    // ===== GETTERS =====

    List<Workflow> findByModule(String module);

    Optional<Workflow> findByModuleAndIsActiveTrue(String module);

    boolean existsByModuleAndIsActiveTrue(String module);

    List<Workflow> findByModuleAndIsSystemTrue(String module);

    List<Workflow> findByModuleAndIsActiveFalse(String module);

    List<Workflow> findByModuleOrderByNameAsc(String module);

    long countByModule(String module);

    boolean existsByModuleAndName(String module, String name);

    Optional<Workflow> findByModuleAndIsSystemTrueAndIsActiveTrue(String module);

    /**
     * Tìm workflow theo module và status (mới thêm để hỗ trợ lọc theo trạng thái)
     */
    Optional<Workflow> findByModuleAndStatus(String module, String status);

    List<Workflow> findByStatus(String status);

    // ===== DELETE =====

    void deleteByModule(String module);
}