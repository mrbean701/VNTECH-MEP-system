package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.PR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PRRepository extends JpaRepository<PR, Long> {

    Optional<PR> findByCode(String code);

    boolean existsByCode(String code);

    List<PR> findByProjectCode(String projectCode);

    List<PR> findByStatus(String status);

    List<PR> findByMrId(Long mrId);

    List<PR> findByVendorCode(String vendorCode);

    List<PR> findByStatusAndProjectCode(String status, String projectCode);

    List<PR> findByStatusAndApprovalStep(String status, Integer approvalStep);
}