package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Workflow;
import com.mep.mepbackend.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping
    public List<Workflow> getAll() {
        return workflowService.getAll();
    }

    @GetMapping("/{id}")
    public Workflow getById(@PathVariable Long id) {
        return workflowService.getById(id);
    }

    @GetMapping("/module/{module}")
    public Workflow getByModule(@PathVariable String module) {
        return workflowService.getByModule(module);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Workflow create(@RequestBody Workflow workflow) {
        return workflowService.create(workflow);
    }

    @PutMapping("/{id}")
    public Workflow update(@PathVariable Long id, @RequestBody Workflow workflow) {
        return workflowService.update(id, workflow);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        workflowService.delete(id);
    }
}