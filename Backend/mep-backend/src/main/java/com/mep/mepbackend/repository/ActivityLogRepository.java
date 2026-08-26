package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByEntityTypeAndEntityId(String entityType, Long entityId);
}