package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Status;
import com.mep.mepbackend.service.StatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/statuses")
@RequiredArgsConstructor
public class StatusController {

    private final StatusService statusService;

    // ===== GETTERS =====

    @GetMapping
    public List<Status> getAll() {
        return statusService.getAll();
    }

    @GetMapping("/{id}")
    public Status getById(@PathVariable Long id) {
        return statusService.getById(id);
    }

    @GetMapping("/entity/{entityType}")
    public List<Status> getByEntityType(@PathVariable String entityType) {
        return statusService.getByEntityType(entityType);
    }

    @GetMapping("/entity/{entityType}/default")
    public Status getDefault(@PathVariable String entityType) {
        return statusService.getDefaultStatus(entityType);
    }

    @GetMapping("/entity/{entityType}/final")
    public List<Status> getFinal(@PathVariable String entityType) {
        return statusService.getFinalStatuses(entityType);
    }

    @GetMapping("/entity/{entityType}/code/{code}")
    public Status getByEntityTypeAndCode(@PathVariable String entityType, @PathVariable String code) {
        return statusService.getByEntityTypeAndCode(entityType, code);
    }

    // ===== CREATE =====

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Status create(@RequestBody Status status) {
        return statusService.create(status);
    }

    // ===== UPDATE =====

    @PutMapping("/{id}")
    public Status update(@PathVariable Long id, @RequestBody Status status) {
        return statusService.update(id, status);
    }

    // ===== DELETE =====

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        statusService.delete(id);
    }

    @DeleteMapping("/entity/{entityType}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteByEntityType(@PathVariable String entityType) {
        statusService.deleteByEntityType(entityType);
    }
}