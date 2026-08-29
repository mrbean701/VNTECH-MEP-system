package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.MinStock;
import com.mep.mepbackend.service.MinStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/min-stock")
@RequiredArgsConstructor
public class MinStockController {

    private final MinStockService minStockService;

    @GetMapping
    public List<MinStock> getAll() {
        return minStockService.getAll();
    }

    @GetMapping("/{id}")
    public MinStock getById(@PathVariable Long id) {
        return minStockService.getById(id);
    }

    @GetMapping("/warehouse/{warehouseId}")
    public List<MinStock> getByWarehouse(@PathVariable Long warehouseId) {
        return minStockService.getByWarehouseId(warehouseId);
    }

    @GetMapping("/warehouse/{warehouseId}/item/{itemId}")
    public MinStock getByWarehouseAndItem(@PathVariable Long warehouseId, @PathVariable Long itemId) {
        return minStockService.getByWarehouseAndItem(warehouseId, itemId);
    }

    // ===== PHƯƠNG THỨC MỚI: Lấy cảnh báo tồn kho theo kho =====
    @GetMapping("/alerts/warehouse/{warehouseId}")
    public List<Map<String, Object>> getAlertsByWarehouse(@PathVariable Long warehouseId) {
        return minStockService.getAlertsByWarehouse(warehouseId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MinStock create(@RequestBody MinStock minStock) {
        return minStockService.create(minStock);
    }

    @PutMapping("/{id}")
    public MinStock update(@PathVariable Long id, @RequestBody MinStock minStock) {
        return minStockService.update(id, minStock);
    }

    @PostMapping("/save")
    public MinStock saveOrUpdate(@RequestParam Long warehouseId,
                                 @RequestParam Long itemId,
                                 @RequestParam BigDecimal minQuantity,
                                 @RequestParam(required = false) BigDecimal safeQuantity,
                                 @RequestParam(required = false) BigDecimal alertPercent) {
        return minStockService.saveOrUpdate(warehouseId, itemId, minQuantity, safeQuantity, alertPercent);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        minStockService.delete(id);
    }

    @DeleteMapping("/warehouse/{warehouseId}/item/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteByWarehouseAndItem(@PathVariable Long warehouseId, @PathVariable Long itemId) {
        minStockService.deleteByWarehouseAndItem(warehouseId, itemId);
    }
}