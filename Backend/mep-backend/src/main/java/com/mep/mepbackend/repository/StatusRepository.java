package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StatusRepository extends JpaRepository<Status, Long> {

    Optional<Status> findByEntityTypeAndCode(String entityType, String code);

    List<Status> findByEntityTypeOrderBySortOrderAsc(String entityType);

    Optional<Status> findByEntityTypeAndIsDefaultTrue(String entityType);

    boolean existsByCode(String code);

    boolean existsByEntityTypeAndCode(String entityType, String code);

    List<Status> findByEntityType(String entityType);

    List<Status> findByEntityTypeAndIsFinalTrue(String entityType);

    // ✅ Đổi tên method theo tên cột mới
    List<Status> findByEntityTypeAndStatusGroupOrderBySortOrderAsc(String entityType, String statusGroup);

    @Query("SELECT DISTINCT s.statusGroup FROM Status s WHERE s.entityType = :entityType AND s.statusGroup IS NOT NULL")
    List<String> findDistinctStatusGroupsByEntityType(String entityType);

    void deleteByEntityType(String entityType);
}