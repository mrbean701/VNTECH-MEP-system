package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.PO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PORepository extends JpaRepository<PO, Long> {

    Optional<PO> findByCode(String code);

    boolean existsByCode(String code);

    List<PO> findByProjectCode(String projectCode);

    List<PO> findByStatus(String status);

    List<PO> findByPrId(Long prId);

    List<PO> findByVendorCode(String vendorCode);

    List<PO> findByStatusAndProjectCode(String status, String projectCode);

    List<PO> findByStatusAndApprovalStep(String status, Integer approvalStep);
}