package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.ActivityLog;
import com.mep.mepbackend.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity-logs")
public class ActivityLogController {

    @Autowired
    private ActivityLogRepository logRepository;

    @GetMapping
    public Page<ActivityLog> getAllLogs(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return logRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public List<ActivityLog> getLogsByEntity(@PathVariable String entityType,
                                             @PathVariable Long entityId) {
        return logRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }
}