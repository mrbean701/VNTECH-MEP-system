package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.WorkflowStepStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowStepStatusRepository extends JpaRepository<WorkflowStepStatus, Long> {

    /**
     * Tìm tất cả ánh xạ của một workflow
     */
    List<WorkflowStepStatus> findByWorkflowId(Long workflowId);

    /**
     * Tìm ánh xạ theo workflow và step
     */
    Optional<WorkflowStepStatus> findByWorkflowIdAndStep(Long workflowId, Integer step);

    /**
     * Xóa tất cả ánh xạ của một workflow
     */
    void deleteByWorkflowId(Long workflowId);

    /**
     * Kiểm tra tồn tại ánh xạ cho workflow và step
     */
    boolean existsByWorkflowIdAndStep(Long workflowId, Integer step);
}