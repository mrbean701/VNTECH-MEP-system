package com.mep.mepbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity ánh xạ giữa bước workflow và trạng thái.
 * Khi một bước workflow được hoàn thành, đối tượng sẽ được cập nhật sang status tương ứng.
 */
@Entity
@Table(name = "workflow_step_status")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStepStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Workflow ID (tham chiếu đến bảng workflows)
     */
    @Column(name = "workflow_id", nullable = false)
    private Long workflowId;

    /**
     * Số thứ tự bước trong workflow (1, 2, 3, ...)
     */
    @Column(nullable = false)
    private Integer step;

    /**
     * Mã code của trạng thái (tham chiếu đến statuses.code)
     */
    @Column(name = "status_code", nullable = false, length = 50)
    private String statusCode;

    /**
     * Constructor tiện ích
     */
    public WorkflowStepStatus(Long workflowId, Integer step, String statusCode) {
        this.workflowId = workflowId;
        this.step = step;
        this.statusCode = statusCode;
    }
}