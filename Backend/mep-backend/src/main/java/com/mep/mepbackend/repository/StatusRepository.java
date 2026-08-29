package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StatusRepository extends JpaRepository<Status, Long> {

    /**
     * Tìm trạng thái theo entityType và code
     */
    Optional<Status> findByEntityTypeAndCode(String entityType, String code);

    /**
     * Tìm tất cả trạng thái của một entityType, sắp xếp theo sort_order
     */
    List<Status> findByEntityTypeOrderBySortOrderAsc(String entityType);

    /**
     * Tìm trạng thái mặc định của một entityType
     */
    Optional<Status> findByEntityTypeAndIsDefaultTrue(String entityType);

    /**
     * Kiểm tra tồn tại theo code
     */
    boolean existsByCode(String code);

    /**
     * Kiểm tra tồn tại theo entityType và code
     */
    boolean existsByEntityTypeAndCode(String entityType, String code);

    /**
     * Tìm tất cả trạng thái của một entityType
     */
    List<Status> findByEntityType(String entityType);

    /**
     * Tìm trạng thái cuối (isFinal = true) của một entityType
     */
    List<Status> findByEntityTypeAndIsFinalTrue(String entityType);

    /**
     * ✅ TRƯỜNG MỚI: Tìm trạng thái theo entityType và group
     */
    List<Status> findByEntityTypeAndGroupOrderBySortOrderAsc(String entityType, String group);

    /**
     * ✅ TRƯỜNG MỚI: Lấy tất cả group của một entityType
     */
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT s.group FROM Status s WHERE s.entityType = :entityType AND s.group IS NOT NULL")
    List<String> findDistinctGroupsByEntityType(String entityType);

    /**
     * Xóa tất cả trạng thái của một entityType
     */
    void deleteByEntityType(String entityType);
}