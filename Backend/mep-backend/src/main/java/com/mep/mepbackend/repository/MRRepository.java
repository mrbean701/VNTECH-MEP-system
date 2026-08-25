package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.MR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MRRepository extends JpaRepository<MR, Long> {

    Optional<MR> findByCode(String code);

    boolean existsByCode(String code);

    List<MR> findByProjectCode(String projectCode);

    List<MR> findByStatus(String status);

    List<MR> findByCreatedBy(Long createdBy);

    List<MR> findByStatusAndProjectCode(String status, String projectCode);
}