package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.AutoReorderConfig;
import com.mep.mepbackend.entity.AutoReorderRule;
import com.mep.mepbackend.repository.AutoReorderConfigRepository;
import com.mep.mepbackend.repository.AutoReorderRuleRepository;
import com.mep.mepbackend.repository.InventoryRepository;
import com.mep.mepbackend.repository.MinStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AutoReorderService {

    private final AutoReorderConfigRepository configRepository;
    private final AutoReorderRuleRepository ruleRepository;
    private final InventoryRepository inventoryRepository;
    private final MinStockRepository minStockRepository;

    public AutoReorderConfig getConfig() {
        var configs = configRepository.findAll();
        if (configs.isEmpty()) {
            AutoReorderConfig config = new AutoReorderConfig();
            config.setEnabled(false);
            config.setMultiplier(BigDecimal.valueOf(2));
            return configRepository.save(config);
        }
        return configs.get(0);
    }

    @Transactional
    public AutoReorderConfig updateConfig(AutoReorderConfig config) {
        var existing = getConfig();
        existing.setEnabled(config.getEnabled());
        existing.setMultiplier(config.getMultiplier());
        existing.setDefaultVendorCode(config.getDefaultVendorCode());
        existing.setUpdatedAt(LocalDate.now());
        return configRepository.save(existing);
    }

    public List<AutoReorderRule> getAllRules() {
        return ruleRepository.findAll();
    }

    @Transactional
    public AutoReorderRule createRule(AutoReorderRule rule) {
        rule.setId("ar_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000));
        rule.setCreatedAt(LocalDateTime.now());
        return ruleRepository.save(rule);
    }

    @Transactional
    public AutoReorderRule updateRule(String id, AutoReorderRule details) {
        var rule = ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rule not found"));
        rule.setItemId(details.getItemId());
        rule.setItemName(details.getItemName());
        rule.setUnit(details.getUnit());
        rule.setWarehouseId(details.getWarehouseId());
        rule.setMinStock(details.getMinStock());
        rule.setReorderQuantity(details.getReorderQuantity());
        rule.setVendorId(details.getVendorId());
        rule.setOrderType(details.getOrderType());
        rule.setEnabled(details.getEnabled());
        rule.setNotes(details.getNotes());
        rule.setUpdatedAt(LocalDateTime.now());
        return ruleRepository.save(rule);
    }

    @Transactional
    public void deleteRule(String id) {
        ruleRepository.deleteById(id);
    }

    public List<AutoReorderRule> getRulesByWarehouse(Long warehouseId) {
        return ruleRepository.findByWarehouseIdAndEnabled(warehouseId, true);
    }

    @Transactional
    public List<Object> checkAndCreateOrders() {
        List<Object> createdPRs = new ArrayList<>();
        var config = getConfig();
        if (!config.getEnabled()) {
            return createdPRs;
        }

        // Lấy tất cả inventory và minStock
        var allInventory = inventoryRepository.findAll();
        var allMinStock = minStockRepository.findAll();

        for (var minStock : allMinStock) {
            var inventory = allInventory.stream()
                    .filter(inv -> inv.getWarehouseId().equals(minStock.getWarehouseId())
                            && inv.getItemId().equals(minStock.getItemId()))
                    .findFirst();

            if (inventory.isPresent() && minStock.getMinQuantity().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal currentQty = inventory.get().getQuantity();
                if (currentQty.compareTo(minStock.getMinQuantity()) < 0) {
                    // Kiểm tra xem có rule nào ghi đè không
                    var rule = ruleRepository.findByItemIdAndWarehouseId(
                            minStock.getItemId(), minStock.getWarehouseId());
                    BigDecimal orderQty;
                    String vendorId = config.getDefaultVendorCode();
                    if (rule.isPresent() && rule.get().getEnabled()) {
                        orderQty = rule.get().getReorderQuantity();
                        if (rule.get().getVendorId() != null) {
                            vendorId = rule.get().getVendorId();
                        }
                    } else {
                        orderQty = minStock.getMinQuantity().multiply(config.getMultiplier());
                    }

                    // Tạo PR (sẽ được xử lý bởi PRService)
                    // Tạm thời chỉ return danh sách
                    createdPRs.add(Map.of(
                            "itemId", minStock.getItemId(),
                            "warehouseId", minStock.getWarehouseId(),
                            "quantity", orderQty,
                            "vendorId", vendorId
                    ));
                }
            }
        }
        return createdPRs;
    }
}