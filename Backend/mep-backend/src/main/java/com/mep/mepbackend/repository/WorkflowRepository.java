package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho entity Workflow.
 * Hỗ trợ truy vấn theo module, trạng thái active, system.
 */
@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Long> {

    /**
     * Tìm tất cả workflow theo module (không phân biệt active)
     */
    List<Workflow> findByModule(String module);

    /**
     * Tìm workflow đang active (is_active = true) của một module.
     * Mỗi module chỉ có duy nhất 1 workflow active.
     */
    Optional<Workflow> findByModuleAndIsActiveTrue(String module);

    /**
     * Kiểm tra xem module đã có workflow active chưa.
     */
    boolean existsByModuleAndIsActiveTrue(String module);

    /**
     * Tìm tất cả workflow hệ thống (is_system = true) của một module.
     */
    List<Workflow> findByModuleAndIsSystemTrue(String module);

    /**
     * Tìm tất cả workflow không active của một module.
     */
    List<Workflow> findByModuleAndIsActiveFalse(String module);

    /**
     * Tìm tất cả workflow của một module và sắp xếp theo tên.
     */
    List<Workflow> findByModuleOrderByNameAsc(String module);

    /**
     * Đếm số lượng workflow của một module.
     */
    long countByModule(String module);

    /**
     * Kiểm tra xem đã có workflow nào với tên và module chưa (dùng để tránh trùng tên).
     */
    boolean existsByModuleAndName(String module, String name);

    /**
     * Tìm workflow của một module có is_system = true và is_active = true
     * (thường là mẫu mặc định khi chưa có template nào được active)
     */
    Optional<Workflow> findByModuleAndIsSystemTrueAndIsActiveTrue(String module);

    /**
     * Xóa tất cả workflow của một module (cẩn thận khi dùng).
     */
    void deleteByModule(String module);
}