package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller quản lý Workflow - Hỗ trợ đa mẫu và kích hoạt.
 */
@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    // ===== GETTERS =====

    @GetMapping
    public List<Workflow> getAll() {
        return workflowService.getAll();
    }

    @GetMapping("/{id}")
    public Workflow getById(@PathVariable Long id) {
        return workflowService.getById(id);
    }

    /**
     * Lấy tất cả workflow của một module.
     */
    @GetMapping("/module/{module}")
    public List<Workflow> getByModule(@PathVariable String module) {
        return workflowService.getByModule(module);
    }

    /**
     * Lấy workflow đang active của một module.
     */
    @GetMapping("/module/{module}/active")
    public Workflow getActive(@PathVariable String module) {
        return workflowService.getActiveWorkflow(module);
    }

    /**
     * Kiểm tra xem module đã có workflow active chưa.
     */
    @GetMapping("/module/{module}/has-active")
    public boolean hasActive(@PathVariable String module) {
        return workflowService.hasActiveWorkflow(module);
    }

    // ===== CREATE =====

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Workflow create(@RequestBody Workflow workflow) {
        return workflowService.create(workflow);
    }

    // ===== UPDATE =====

    @PutMapping("/{id}")
    public Workflow update(@PathVariable Long id, @RequestBody Workflow workflow) {
        return workflowService.update(id, workflow);
    }

    // ===== ACTIVATE =====

    /**
     * Kích hoạt một workflow của module.
     * Tất cả workflow khác trong cùng module sẽ bị deactivate.
     */
    @PutMapping("/module/{module}/activate/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activate(@PathVariable String module, @PathVariable Long id) {
        workflowService.activateWorkflow(module, id);
    }

    // ===== DUPLICATE =====

    /**
     * Sao chép một workflow (tạo bản sao với isSystem = false).
     */
    @PostMapping("/duplicate/{id}")
    @ResponseStatus(HttpStatus.CREATED)
    public Workflow duplicate(@PathVariable Long id) {
        return workflowService.duplicate(id);
    }

    // ===== DELETE =====

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        workflowService.delete(id);
    }

    /**
     * Xóa tất cả workflow của một module (dùng trong reset/test).
     */
    @DeleteMapping("/module/{module}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteByModule(@PathVariable String module) {
        workflowService.deleteByModule(module);
    }
}