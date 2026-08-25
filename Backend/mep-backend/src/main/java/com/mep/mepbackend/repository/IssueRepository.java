package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {

    Optional<Issue> findByCode(String code);

    boolean existsByCode(String code);

    List<Issue> findByProjectCode(String projectCode);

    List<Issue> findByStatus(String status);

    List<Issue> findByWarehouseId(Long warehouseId);

    List<Issue> findByStatusIn(List<String> statuses);

    List<Issue> findByProjectCodeAndStatus(String projectCode, String status);
}