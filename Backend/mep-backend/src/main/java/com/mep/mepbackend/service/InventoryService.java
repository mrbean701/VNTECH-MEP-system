package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public List<Inventory> getAll() {
        return inventoryRepository.findAll();
    }

    public Inventory getById(Long id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));
    }

    public List<Inventory> getByWarehouseId(Long warehouseId) {
        return inventoryRepository.findByWarehouseId(warehouseId);
    }

    public List<Inventory> getByItemId(Long itemId) {
        return inventoryRepository.findByItemId(itemId);
    }

    public Inventory getByWarehouseAndItem(Long warehouseId, Long itemId) {
        return inventoryRepository.findByWarehouseIdAndItemId(warehouseId, itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));
    }

    @Transactional
    public Inventory create(Inventory inventory) {
        if (inventoryRepository.existsByWarehouseIdAndItemId(
                inventory.getWarehouseId(), inventory.getItemId())) {
            throw new RuntimeException("Tồn kho đã tồn tại");
        }
        inventory.setUpdatedAt(LocalDate.now());
        return inventoryRepository.save(inventory);
    }

    @Transactional
    public Inventory update(Long id, Inventory details) {
        Inventory inv = getById(id);
        inv.setWarehouseId(details.getWarehouseId());
        inv.setItemId(details.getItemId());
        inv.setQuantity(details.getQuantity());
        inv.setUpdatedAt(LocalDate.now());
        return inventoryRepository.save(inv);
    }

    @Transactional
    public void delete(Long id) {
        Inventory inv = getById(id);
        inventoryRepository.delete(inv);
    }

    @Transactional
    public void updateQuantity(Long warehouseId, Long itemId, BigDecimal quantity) {
        Inventory inv = getByWarehouseAndItem(warehouseId, itemId);
        inv.setQuantity(quantity);
        inv.setUpdatedAt(LocalDate.now());
        inventoryRepository.save(inv);
    }
}