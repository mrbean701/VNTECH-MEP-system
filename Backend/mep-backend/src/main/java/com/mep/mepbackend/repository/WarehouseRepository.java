package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    Optional<Warehouse> findByCode(String code);

    boolean existsByCode(String code);

    List<Warehouse> findByType(String type);

    List<Warehouse> findByStatus(String status);

    List<Warehouse> findByProjectId(Long projectId);

    Optional<Warehouse> findByProjectIdAndType(Long projectId, String type);
}