package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.AuditLog;
import com.mep.mepbackend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public List<AuditLog> getAll() {
        return auditLogService.getAll();
    }

    @GetMapping("/user/{userId}")
    public List<AuditLog> getByUser(@PathVariable Long userId) {
        return auditLogService.getByUser(userId);
    }

    @GetMapping("/entity/{entityType}")
    public List<AuditLog> getByEntityType(@PathVariable String entityType) {
        return auditLogService.getByEntityType(entityType);
    }

    @DeleteMapping("/clear")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear() {
        auditLogService.clearAll();
    }
}
