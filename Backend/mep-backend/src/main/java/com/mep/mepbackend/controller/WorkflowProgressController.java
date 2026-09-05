package com.mep.mepbackend.controller;

import com.mep.mepbackend.dto.WorkflowProgressDTO;
import com.mep.mepbackend.service.WorkflowProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflow-progress")
@RequiredArgsConstructor
public class WorkflowProgressController {

    private final WorkflowProgressService progressService; // ✅ Đúng

    @GetMapping("/{entityType}/{entityId}")
    public WorkflowProgressDTO getProgress(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        return progressService.getProgressDTO(entityType, entityId);
    }

    @GetMapping("/{entityType}/status/{status}")
    public List<WorkflowProgressDTO> getByStatus(
            @PathVariable String entityType,
            @PathVariable String status) {
        return progressService.getByStatus(entityType, status);
    }

    @GetMapping("/{entityType}/active")
    public List<WorkflowProgressDTO> getActive(@PathVariable String entityType) {
        return progressService.getActiveProgress(entityType); // ✅ Gọi đúng service
    }

    @GetMapping("/{entityType}/{entityId}/exists")
    public boolean exists(@PathVariable String entityType, @PathVariable Long entityId) {
        return progressService.exists(entityType, entityId);
    }
}