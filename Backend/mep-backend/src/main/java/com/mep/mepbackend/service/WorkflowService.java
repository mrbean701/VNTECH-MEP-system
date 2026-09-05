package com.mep.mepbackend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.entity.WorkflowStepStatus;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.WorkflowRepository;
import com.mep.mepbackend.repository.WorkflowStepStatusRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowService.class);

    private final WorkflowRepository workflowRepository;
    private final WorkflowStepStatusRepository stepStatusRepository;
    private final ObjectMapper objectMapper;

    // ===== GETTERS =====

    public List<Workflow> getAll() {
        return workflowRepository.findAll();
    }

    public Workflow getById(Long id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));
    }

    public List<Workflow> getByModule(String module) {
        return workflowRepository.findByModule(module);
    }

    public Workflow getActiveWorkflow(String module) {
        return workflowRepository.findByModuleAndIsActiveTrue(module)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy workflow active cho module: " + module));
    }

    public List<Map<String, Object>> getStepsByWorkflowId(Long workflowId) {
        Workflow wf = getById(workflowId);
        return parseSteps(wf.getSteps());
    }

    public String getStatusForStep(Long workflowId, Integer step) {
        Optional<WorkflowStepStatus> mapping = stepStatusRepository.findByWorkflowIdAndStep(workflowId, step);
        if (mapping.isPresent()) {
            return mapping.get().getStatusCode();
        }
        try {
            String module = getModuleByWorkflowId(workflowId);
            return module.toUpperCase() + "_STEP_" + step;
        } catch (Exception e) {
            logger.warn("Không thể tạo fallback status cho workflow {} step {}: {}", workflowId, step, e.getMessage());
            return "PENDING_STEP_" + step;
        }
    }

    public String getModuleByWorkflowId(Long workflowId) {
        Workflow wf = getById(workflowId);
        return wf.getModule();
    }

    public List<Map<String, Object>> getStepsByModule(String module) {
        Workflow wf = getActiveWorkflow(module);
        return parseSteps(wf.getSteps());
    }

    public List<Map<String, Object>> getStepsWithStatusByModule(String module) {
        Workflow wf = getActiveWorkflow(module);
        List<Map<String, Object>> steps = parseSteps(wf.getSteps());
        List<WorkflowStepStatus> mappings = stepStatusRepository.findByWorkflowId(wf.getId());

        Map<Integer, String> statusMap = mappings.stream()
                .collect(Collectors.toMap(WorkflowStepStatus::getStep, WorkflowStepStatus::getStatusCode));

        for (Map<String, Object> step : steps) {
            Integer stepNumber = (Integer) step.get("step");
            String statusCode = statusMap.get(stepNumber);
            if (statusCode == null || statusCode.isEmpty()) {
                statusCode = wf.getModule().toUpperCase() + "_STEP_" + stepNumber;
            }
            step.put("statusCode", statusCode);
        }

        return steps;
    }

    public String getStatusForStep(String module, Integer step) {
        Workflow wf = getActiveWorkflow(module);
        return getStatusForStep(wf.getId(), step);
    }

    public List<WorkflowStepStatus> getStepStatuses(Long workflowId) {
        return stepStatusRepository.findByWorkflowId(workflowId);
    }

    public boolean hasActiveWorkflow(String module) {
        return workflowRepository.existsByModuleAndIsActiveTrue(module);
    }

    // ===== CREATE =====

    @Transactional
    public Workflow create(Workflow workflow) {
        if (workflowRepository.existsByModuleAndName(workflow.getModule(), workflow.getName())) {
            throw new RuntimeException("Đã tồn tại workflow với tên '" + workflow.getName() + "' trong module " + workflow.getModule());
        }

        workflow.setStatus("DRAFT");
        workflow.setIsActive(false);
        workflow.setIsSystem(false);
        workflow.setCreatedAt(LocalDate.now());
        workflow.setUpdatedAt(LocalDate.now());

        Workflow saved = workflowRepository.save(workflow);

        if (!workflowRepository.existsByModuleAndIsActiveTrue(workflow.getModule())) {
            activateWorkflow(workflow.getModule(), saved.getId());
        }

        return saved;
    }

    @Transactional
    public Workflow createWithStatuses(Workflow workflow, List<WorkflowStepStatus> stepStatuses) {
        Workflow saved = create(workflow);

        if (stepStatuses == null || stepStatuses.isEmpty()) {
            stepStatuses = generateStepStatusesFromSteps(saved.getSteps(), saved.getId());
        }

        if (stepStatuses != null && !stepStatuses.isEmpty()) {
            for (WorkflowStepStatus mapping : stepStatuses) {
                mapping.setWorkflowId(saved.getId());
                stepStatusRepository.save(mapping);
            }
        }

        return saved;
    }

    private List<WorkflowStepStatus> generateStepStatusesFromSteps(String stepsJson, Long workflowId) {
        try {
            List<Map<String, Object>> steps = objectMapper.readValue(stepsJson, new TypeReference<List<Map<String, Object>>>() {});
            List<WorkflowStepStatus> result = new ArrayList<>();
            for (Map<String, Object> step : steps) {
                Integer stepNum = (Integer) step.get("step");
                String statusCode = (String) step.get("statusCode");
                if (statusCode != null && !statusCode.isEmpty()) {
                    result.add(new WorkflowStepStatus(workflowId, stepNum, statusCode));
                } else {
                    String module = (String) step.get("module");
                    if (module == null) module = "UNKNOWN";
                    result.add(new WorkflowStepStatus(workflowId, stepNum, module.toUpperCase() + "_STEP_" + stepNum));
                }
            }
            return result;
        } catch (Exception e) {
            logger.warn("Không thể generate step statuses: " + e.getMessage());
            return null;
        }
    }

    // ===== UPDATE =====

    @Transactional
    public Workflow update(Long id, Workflow details) {
        Workflow wf = getById(id);
        wf.setName(details.getName());
        wf.setDescription(details.getDescription());
        wf.setSteps(details.getSteps());
        if (details.getStatus() != null && !details.getStatus().isEmpty()) {
            wf.setStatus(details.getStatus());
            wf.setIsActive("ACTIVE".equals(details.getStatus()));
        }
        wf.setUpdatedAt(LocalDate.now());
        return workflowRepository.save(wf);
    }

    @Transactional
    public Workflow updateWithStatuses(Long id, Workflow details, List<WorkflowStepStatus> stepStatuses) {
        Workflow saved = update(id, details);

        stepStatusRepository.deleteByWorkflowId(saved.getId());

        if (stepStatuses != null && !stepStatuses.isEmpty()) {
            for (WorkflowStepStatus mapping : stepStatuses) {
                mapping.setWorkflowId(saved.getId());
                stepStatusRepository.save(mapping);
            }
        }

        return saved;
    }

    // ===== ACTIVATE =====

    @Transactional
    public void activateWorkflow(String module, Long id) {
        Workflow toActivate = getById(id);
        if (!toActivate.getModule().equals(module)) {
            throw new RuntimeException("Workflow không thuộc module " + module);
        }

        List<Workflow> allInModule = workflowRepository.findByModule(module);
        for (Workflow wf : allInModule) {
            if (!wf.getId().equals(id)) {
                wf.setIsActive(false);
                wf.setStatus("INACTIVE");
                wf.setUpdatedAt(LocalDate.now());
                workflowRepository.save(wf);
            }
        }

        toActivate.setIsActive(true);
        toActivate.setStatus("ACTIVE");
        toActivate.setUpdatedAt(LocalDate.now());
        workflowRepository.save(toActivate);
    }

    // ===== DUPLICATE =====

    @Transactional
    public Workflow duplicate(Long id) {
        Workflow original = getById(id);

        Workflow copy = new Workflow();
        copy.setModule(original.getModule());
        copy.setName(original.getName() + " (Copy)");
        copy.setDescription(original.getDescription());
        copy.setSteps(original.getSteps());
        copy.setIsActive(false);
        copy.setStatus("DRAFT");
        copy.setIsSystem(false);
        copy.setCreatedAt(LocalDate.now());
        copy.setUpdatedAt(LocalDate.now());

        String baseName = copy.getName();
        int counter = 1;
        while (workflowRepository.existsByModuleAndName(copy.getModule(), copy.getName())) {
            copy.setName(baseName + " " + (counter++));
        }

        Workflow saved = workflowRepository.save(copy);

        List<WorkflowStepStatus> mappings = stepStatusRepository.findByWorkflowId(original.getId());
        for (WorkflowStepStatus mapping : mappings) {
            WorkflowStepStatus newMapping = new WorkflowStepStatus();
            newMapping.setWorkflowId(saved.getId());
            newMapping.setStep(mapping.getStep());
            newMapping.setStatusCode(mapping.getStatusCode());
            stepStatusRepository.save(newMapping);
        }

        return saved;
    }

    // ===== DELETE =====

    @Transactional
    public void delete(Long id) {
        Workflow wf = getById(id);
        if (wf.getIsSystem()) {
            throw new RuntimeException("Không thể xóa workflow hệ thống. Bạn có thể sao chép và chỉnh sửa bản sao.");
        }
        if (wf.getIsActive()) {
            throw new RuntimeException("Không thể xóa workflow đang được áp dụng. Hãy chọn workflow khác làm active trước.");
        }
        stepStatusRepository.deleteByWorkflowId(id);
        workflowRepository.delete(wf);
    }

    @Transactional
    public void deleteByModule(String module) {
        List<Workflow> workflows = workflowRepository.findByModule(module);
        for (Workflow wf : workflows) {
            stepStatusRepository.deleteByWorkflowId(wf.getId());
        }
        workflowRepository.deleteByModule(module);
    }

    // ===== HELPER =====

    private List<Map<String, Object>> parseSteps(String stepsJson) {
        try {
            return objectMapper.readValue(stepsJson, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Lỗi parse steps của workflow: " + e.getMessage());
        }
    }

    public Optional<Workflow> getByModuleAndStatus(String module, String status) {
        return workflowRepository.findByModuleAndStatus(module, status);
    }
}