package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.MinStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface MinStockRepository extends JpaRepository<MinStock, Long> {

    Optional<MinStock> findByWarehouseIdAndItemId(Long warehouseId, Long itemId);

    List<MinStock> findByWarehouseId(Long warehouseId);

    List<MinStock> findByItemId(Long itemId);

    List<MinStock> findByWarehouseIdAndMinQuantityGreaterThan(Long warehouseId, BigDecimal minQuantity);

    boolean existsByWarehouseIdAndItemId(Long warehouseId, Long itemId);

    void deleteByWarehouseIdAndItemId(Long warehouseId, Long itemId);
}