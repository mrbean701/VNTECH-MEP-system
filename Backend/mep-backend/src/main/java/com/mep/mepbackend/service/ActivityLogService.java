package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.ActivityLog;
import com.mep.mepbackend.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ActivityLogService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    public void log(String username, String action, String entityType, Long entityId,
                    String oldValues, String newValues, String ipAddress, String userAgent) {
        ActivityLog log = new ActivityLog();
        log.setUsername(username);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setOldValues(oldValues);
        log.setNewValues(newValues);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        log.setCreatedAt(LocalDateTime.now());
        activityLogRepository.save(log);
    }

    // Overload cho trường hợp không có IP / UserAgent
    public void log(String username, String action, String entityType, Long entityId,
                    String oldValues, String newValues) {
        log(username, action, entityType, entityId, oldValues, newValues, null, null);
    }
}