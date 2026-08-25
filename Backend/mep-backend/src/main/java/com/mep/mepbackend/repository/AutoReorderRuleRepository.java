package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.AutoReorderRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AutoReorderRuleRepository extends JpaRepository<AutoReorderRule, String> {

    List<AutoReorderRule> findByItemId(Long itemId);

    List<AutoReorderRule> findByWarehouseId(Long warehouseId);

    List<AutoReorderRule> findByEnabled(Boolean enabled);

    List<AutoReorderRule> findByWarehouseIdAndEnabled(Long warehouseId, Boolean enabled);

    Optional<AutoReorderRule> findByItemIdAndWarehouseId(Long itemId, Long warehouseId);
}