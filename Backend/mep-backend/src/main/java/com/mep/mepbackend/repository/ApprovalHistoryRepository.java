package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.ApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalHistoryRepository extends JpaRepository<ApprovalHistory, Long> {

    List<ApprovalHistory> findByEntityTypeAndEntityIdOrderByStepAsc(String entityType, Long entityId);

    @Query("SELECT COUNT(a) FROM ApprovalHistory a WHERE a.entityType = :entityType AND a.entityId = :entityId")
    long countByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") Long entityId);

    boolean existsByEntityTypeAndEntityId(String entityType, Long entityId);
}