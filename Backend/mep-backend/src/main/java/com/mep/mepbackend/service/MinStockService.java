package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.MinStock;
import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.entity.Item;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.MinStockRepository;
import com.mep.mepbackend.repository.InventoryRepository;
import com.mep.mepbackend.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MinStockService {

    private final MinStockRepository minStockRepository;
    private final InventoryRepository inventoryRepository;
    private final ItemRepository itemRepository;

    public List<MinStock> getAll() {
        return minStockRepository.findAll();
    }

    public MinStock getById(Long id) {
        return minStockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MinStock not found"));
    }

    public MinStock getByWarehouseAndItem(Long warehouseId, Long itemId) {
        return minStockRepository.findByWarehouseIdAndItemId(warehouseId, itemId)
                .orElse(null);
    }

    public List<MinStock> getByWarehouseId(Long warehouseId) {
        return minStockRepository.findByWarehouseId(warehouseId);
    }

    @Transactional
    public MinStock create(MinStock minStock) {
        if (minStockRepository.existsByWarehouseIdAndItemId(
                minStock.getWarehouseId(), minStock.getItemId())) {
            throw new RuntimeException("Ngưỡng tồn đã tồn tại");
        }
        minStock.setUpdatedAt(LocalDate.now());
        return minStockRepository.save(minStock);
    }

    @Transactional
    public MinStock update(Long id, MinStock details) {
        MinStock ms = getById(id);
        ms.setMinQuantity(details.getMinQuantity());
        ms.setSafeQuantity(details.getSafeQuantity());
        ms.setAlertPercent(details.getAlertPercent());
        ms.setUpdatedAt(LocalDate.now());
        return minStockRepository.save(ms);
    }

    @Transactional
    public MinStock saveOrUpdate(Long warehouseId, Long itemId, BigDecimal minQuantity,
                                 BigDecimal safeQuantity, BigDecimal alertPercent) {
        var existing = minStockRepository.findByWarehouseIdAndItemId(warehouseId, itemId);
        if (existing.isPresent()) {
            MinStock ms = existing.get();
            ms.setMinQuantity(minQuantity);
            if (safeQuantity != null) ms.setSafeQuantity(safeQuantity);
            if (alertPercent != null) ms.setAlertPercent(alertPercent);
            ms.setUpdatedAt(LocalDate.now());
            return minStockRepository.save(ms);
        } else {
            MinStock ms = new MinStock();
            ms.setWarehouseId(warehouseId);
            ms.setItemId(itemId);
            ms.setMinQuantity(minQuantity);
            ms.setSafeQuantity(safeQuantity);
            ms.setAlertPercent(alertPercent);
            ms.setUpdatedAt(LocalDate.now());
            return minStockRepository.save(ms);
        }
    }

    // ===== PHƯƠNG THỨC MỚI: Lấy danh sách cảnh báo theo kho =====
    public List<Map<String, Object>> getAlertsByWarehouse(Long warehouseId) {
        List<Map<String, Object>> result = new ArrayList<>();

        // Lấy tất cả minStock của kho
        List<MinStock> minStocks = minStockRepository.findByWarehouseId(warehouseId);
        if (minStocks.isEmpty()) {
            return result;
        }

        // Lấy tất cả inventory của kho
        List<Inventory> inventories = inventoryRepository.findByWarehouseId(warehouseId);

        for (MinStock ms : minStocks) {
            // Tìm inventory tương ứng
            Inventory inv = inventories.stream()
                    .filter(i -> i.getItemId().equals(ms.getItemId()))
                    .findFirst()
                    .orElse(null);

            // Tìm item để lấy tên, đơn vị
            Item item = itemRepository.findById(ms.getItemId()).orElse(null);
            if (item == null) continue;

            BigDecimal currentQty = inv != null ? inv.getQuantity() : BigDecimal.ZERO;
            BigDecimal safeQty = ms.getSafeQuantity() != null ? ms.getSafeQuantity() : BigDecimal.ZERO;
            BigDecimal minQty = ms.getMinQuantity() != null ? ms.getMinQuantity() : BigDecimal.ZERO;
            BigDecimal alertPercent = ms.getAlertPercent() != null ? ms.getAlertPercent() : BigDecimal.valueOf(20);

            // Tính % an toàn: (currentQty / safeQty) * 100
            BigDecimal percent = BigDecimal.ZERO;
            String status = "SAFE";
            if (safeQty.compareTo(BigDecimal.ZERO) > 0) {
                percent = currentQty.divide(safeQty, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);

                if (currentQty.compareTo(minQty) <= 0) {
                    status = "UNDER";
                } else if (percent.compareTo(alertPercent) <= 0) {
                    status = "WARNING";
                } else {
                    status = "SAFE";
                }
            } else {
                // Nếu không có safeQuantity, chỉ so sánh với minQuantity
                if (currentQty.compareTo(minQty) <= 0) {
                    status = "UNDER";
                    percent = BigDecimal.ZERO;
                } else {
                    status = "SAFE";
                    percent = BigDecimal.valueOf(100);
                }
            }

            Map<String, Object> alert = new HashMap<>();
            alert.put("itemId", ms.getItemId());
            alert.put("itemCode", item.getCode());
            alert.put("itemName", item.getName());
            alert.put("unit", item.getUnit() != null ? item.getUnit() : "");
            alert.put("currentQty", currentQty);
            alert.put("minQty", minQty);
            alert.put("safeQty", safeQty);
            alert.put("alertPercent", alertPercent);
            alert.put("percent", percent);
            alert.put("status", status); // UNDER, WARNING, SAFE

            result.add(alert);
        }

        return result;
    }

    @Transactional
    public void delete(Long id) {
        MinStock ms = getById(id);
        minStockRepository.delete(ms);
    }

    @Transactional
    public void deleteByWarehouseAndItem(Long warehouseId, Long itemId) {
        minStockRepository.deleteByWarehouseIdAndItemId(warehouseId, itemId);
    }
}