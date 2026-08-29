package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByPerformedByIdOrderByPerformedAtDesc(Long userId);
    List<AuditLog> findByEntityTypeOrderByPerformedAtDesc(String entityType);
}
