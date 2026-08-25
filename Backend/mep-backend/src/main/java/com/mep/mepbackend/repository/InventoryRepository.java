package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByWarehouseIdAndItemId(Long warehouseId, Long itemId);

    List<Inventory> findByWarehouseId(Long warehouseId);

    List<Inventory> findByItemId(Long itemId);

    List<Inventory> findByWarehouseIdAndQuantityLessThan(Long warehouseId, BigDecimal quantity);

    boolean existsByWarehouseIdAndItemId(Long warehouseId, Long itemId);

    void deleteByWarehouseIdAndItemId(Long warehouseId, Long itemId);
}