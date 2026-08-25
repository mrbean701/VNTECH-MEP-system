package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.GRN;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GRNRepository extends JpaRepository<GRN, Long> {

    Optional<GRN> findByCode(String code);

    boolean existsByCode(String code);

    List<GRN> findByPoId(Long poId);

    List<GRN> findByWarehouseId(Long warehouseId);

    List<GRN> findByStatus(String status);

    List<GRN> findByProjectCode(String projectCode);

    List<GRN> findByStatusIn(List<String> statuses);
}