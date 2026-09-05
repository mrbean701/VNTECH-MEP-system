package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.WorkflowProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowProgressRepository extends JpaRepository<WorkflowProgress, Long> {

    /**
     * Tìm tiến trình của một đơn hàng cụ thể
     */
    Optional<WorkflowProgress> findByEntityTypeAndEntityId(String entityType, Long entityId);

    /**
     * Tìm tất cả tiến trình theo loại entity và trạng thái
     */
    List<WorkflowProgress> findByEntityTypeAndStatus(String entityType, String status);

    /**
     * Tìm tất cả tiến trình đang active (đang trong luồng duyệt)
     */
    List<WorkflowProgress> findByEntityTypeAndIsActiveTrue(String entityType);

    /**
     * Kiểm tra tồn tại tiến trình của entity
     */
    boolean existsByEntityTypeAndEntityId(String entityType, Long entityId);
}