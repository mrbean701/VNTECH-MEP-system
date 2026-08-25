package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.MinStock;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.MinStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MinStockService {

    private final MinStockRepository minStockRepository;

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
        ms.setUpdatedAt(LocalDate.now());
        return minStockRepository.save(ms);
    }

    @Transactional
    public MinStock saveOrUpdate(Long warehouseId, Long itemId, BigDecimal minQuantity) {
        var existing = minStockRepository.findByWarehouseIdAndItemId(warehouseId, itemId);
        if (existing.isPresent()) {
            MinStock ms = existing.get();
            ms.setMinQuantity(minQuantity);
            ms.setUpdatedAt(LocalDate.now());
            return minStockRepository.save(ms);
        } else {
            MinStock ms = new MinStock();
            ms.setWarehouseId(warehouseId);
            ms.setItemId(itemId);
            ms.setMinQuantity(minQuantity);
            ms.setUpdatedAt(LocalDate.now());
            return minStockRepository.save(ms);
        }
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