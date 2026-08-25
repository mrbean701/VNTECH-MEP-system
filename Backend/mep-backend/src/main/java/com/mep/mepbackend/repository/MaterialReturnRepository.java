package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.MaterialReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialReturnRepository extends JpaRepository<MaterialReturn, Long> {

    Optional<MaterialReturn> findByCode(String code);

    boolean existsByCode(String code);

    List<MaterialReturn> findByProjectCode(String projectCode);

    List<MaterialReturn> findByStatus(String status);

    List<MaterialReturn> findByWarehouseId(Long warehouseId);

    List<MaterialReturn> findByStatusIn(List<String> statuses);

    List<MaterialReturn> findByProjectCodeAndStatus(String projectCode, String status);
}