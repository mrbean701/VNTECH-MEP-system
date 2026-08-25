package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final ObjectMapper objectMapper;

    public List<Workflow> getAll() {
        return workflowRepository.findAll();
    }

    public Workflow getById(Long id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
    }

    public Workflow getByModule(String module) {
        return workflowRepository.findByModule(module)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found for module: " + module));
    }

    @Transactional
    public Workflow create(Workflow workflow) {
        if (workflowRepository.existsByModule(workflow.getModule())) {
            throw new RuntimeException("Workflow đã tồn tại cho module: " + workflow.getModule());
        }
        workflow.setUpdatedAt(LocalDate.now());
        return workflowRepository.save(workflow);
    }

    @Transactional
    public Workflow update(Long id, Workflow details) {
        Workflow wf = getById(id);
        wf.setName(details.getName());
        wf.setSteps(details.getSteps());
        wf.setUpdatedAt(LocalDate.now());
        return workflowRepository.save(wf);
    }

    @Transactional
    public void delete(Long id) {
        Workflow wf = getById(id);
        workflowRepository.delete(wf);
    }
}