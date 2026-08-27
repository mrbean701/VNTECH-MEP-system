package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.entity.WorkflowStepStatus;
import com.mep.mepbackend.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    // ===== GETTERS (giữ nguyên) =====

    @GetMapping
    public List<Workflow> getAll() {
        return workflowService.getAll();
    }

    @GetMapping("/{id}")
    public Workflow getById(@PathVariable Long id) {
        return workflowService.getById(id);
    }

    @GetMapping("/module/{module}")
    public List<Workflow> getByModule(@PathVariable String module) {
        return workflowService.getByModule(module);
    }

    @GetMapping("/module/{module}/active")
    public Workflow getActive(@PathVariable String module) {
        return workflowService.getActiveWorkflow(module);
    }

    @GetMapping("/module/{module}/has-active")
    public boolean hasActive(@PathVariable String module) {
        return workflowService.hasActiveWorkflow(module);
    }

    /**
     * Lấy danh sách steps kèm theo status code cho từng bước
     */
    @GetMapping("/module/{module}/steps-with-status")
    public List<Map<String, Object>> getStepsWithStatus(@PathVariable String module) {
        return workflowService.getStepsWithStatusByModule(module);
    }

    /**
     * Lấy status code cho một step cụ thể của module
     */
    @GetMapping("/module/{module}/step/{step}/status")
    public String getStatusForStep(@PathVariable String module, @PathVariable Integer step) {
        return workflowService.getStatusForStep(module, step);
    }

    /**
     * Lấy tất cả ánh xạ bước-status của một workflow
     */
    @GetMapping("/{id}/step-statuses")
    public List<WorkflowStepStatus> getStepStatuses(@PathVariable Long id) {
        return workflowService.getStepStatuses(id);
    }

    // ===== CREATE =====

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Workflow create(@RequestBody Workflow workflow) {
        return workflowService.create(workflow);
    }

    /**
     * Tạo workflow kèm danh sách ánh xạ bước-status
     * Body: { workflow: {...}, stepStatuses: [{step, statusCode}] }
     */
    @PostMapping("/with-statuses")
    @ResponseStatus(HttpStatus.CREATED)
    public Workflow createWithStatuses(@RequestBody Map<String, Object> payload) {
        // Parse workflow
        Workflow workflow = new Workflow();
        workflow.setModule((String) payload.get("module"));
        workflow.setName((String) payload.get("name"));
        workflow.setDescription((String) payload.get("description"));
        workflow.setSteps((String) payload.get("steps"));
        workflow.setStatus((String) payload.get("status"));
        workflow.setIsSystem(payload.get("isSystem") != null && (Boolean) payload.get("isSystem"));

        // Parse stepStatuses
        List<Map<String, Object>> stepStatusesRaw = (List<Map<String, Object>>) payload.get("stepStatuses");
        List<WorkflowStepStatus> stepStatuses = null;
        if (stepStatusesRaw != null && !stepStatusesRaw.isEmpty()) {
            stepStatuses = stepStatusesRaw.stream().map(item -> {
                WorkflowStepStatus wss = new WorkflowStepStatus();
                wss.setStep((Integer) item.get("step"));
                wss.setStatusCode((String) item.get("statusCode"));
                return wss;
            }).toList();
        }

        return workflowService.createWithStatuses(workflow, stepStatuses);
    }

    // ===== UPDATE =====

    @PutMapping("/{id}")
    public Workflow update(@PathVariable Long id, @RequestBody Workflow workflow) {
        return workflowService.update(id, workflow);
    }

    /**
     * Cập nhật workflow kèm danh sách ánh xạ bước-status
     */
    @PutMapping("/{id}/with-statuses")
    public Workflow updateWithStatuses(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        // Parse workflow
        Workflow workflow = new Workflow();
        workflow.setName((String) payload.get("name"));
        workflow.setDescription((String) payload.get("description"));
        workflow.setSteps((String) payload.get("steps"));
        workflow.setStatus((String) payload.get("status"));

        // Parse stepStatuses
        List<Map<String, Object>> stepStatusesRaw = (List<Map<String, Object>>) payload.get("stepStatuses");
        List<WorkflowStepStatus> stepStatuses = null;
        if (stepStatusesRaw != null && !stepStatusesRaw.isEmpty()) {
            stepStatuses = stepStatusesRaw.stream().map(item -> {
                WorkflowStepStatus wss = new WorkflowStepStatus();
                wss.setStep((Integer) item.get("step"));
                wss.setStatusCode((String) item.get("statusCode"));
                return wss;
            }).toList();
        }

        return workflowService.updateWithStatuses(id, workflow, stepStatuses);
    }

    // ===== ACTIVATE =====

    @PutMapping("/module/{module}/activate/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activate(@PathVariable String module, @PathVariable Long id) {
        workflowService.activateWorkflow(module, id);
    }

    // ===== DUPLICATE =====

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

    @DeleteMapping("/module/{module}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteByModule(@PathVariable String module) {
        workflowService.deleteByModule(module);
    }
}