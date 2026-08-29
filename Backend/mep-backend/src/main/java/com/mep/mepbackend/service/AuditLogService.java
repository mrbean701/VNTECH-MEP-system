package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.AuditLog;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.repository.AuditLogRepository;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final CurrentUserUtil currentUserUtil;

    public List<AuditLog> getAll() {
        return auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "performedAt"));
    }

    public List<AuditLog> getByUser(Long userId) {
        return auditLogRepository.findByPerformedByIdOrderByPerformedAtDesc(userId);
    }

    public List<AuditLog> getByEntityType(String entityType) {
        return auditLogRepository.findByEntityTypeOrderByPerformedAtDesc(entityType);
    }

    @Transactional
    public AuditLog log(String action, String entityType, String entityId,
                        String description, Long performedById, String performedBy,
                        String details) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDescription(description);
        log.setPerformedById(performedById);
        log.setPerformedBy(performedBy);
        log.setPerformedAt(LocalDateTime.now());
        log.setDetails(details);
        return auditLogRepository.save(log);
    }

    /**
     * Ghi log tự động lấy user hiện tại từ SecurityContext.
     */
    @Transactional
    public AuditLog log(String action, String entityType, String entityId, String description, String details) {
        User current = null;
        try {
            current = currentUserUtil.getCurrentUser();
        } catch (Exception e) {
            // User chưa đăng nhập (vd: gọi từ initializer) - bỏ qua log
        }
        Long userId = current != null ? current.getId() : null;
        String userName = current != null ? current.getName() : "SYSTEM";
        return log(action, entityType, entityId, description, userId, userName, details);
    }

    @Transactional
    public void clearAll() {
        auditLogRepository.deleteAll();
    }
}
