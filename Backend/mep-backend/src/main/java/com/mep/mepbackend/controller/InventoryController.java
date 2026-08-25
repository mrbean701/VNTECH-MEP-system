package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Inventory;
import com.mep.mepbackend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public List<Inventory> getAll() {
        return inventoryService.getAll();
    }

    @GetMapping("/{id}")
    public Inventory getById(@PathVariable Long id) {
        return inventoryService.getById(id);
    }

    @GetMapping("/warehouse/{warehouseId}")
    public List<Inventory> getByWarehouse(@PathVariable Long warehouseId) {
        return inventoryService.getByWarehouseId(warehouseId);
    }

    @GetMapping("/item/{itemId}")
    public List<Inventory> getByItem(@PathVariable Long itemId) {
        return inventoryService.getByItemId(itemId);
    }

    @GetMapping("/warehouse/{warehouseId}/item/{itemId}")
    public Inventory getByWarehouseAndItem(@PathVariable Long warehouseId, @PathVariable Long itemId) {
        return inventoryService.getByWarehouseAndItem(warehouseId, itemId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Inventory create(@RequestBody Inventory inventory) {
        return inventoryService.create(inventory);
    }

    @PutMapping("/{id}")
    public Inventory update(@PathVariable Long id, @RequestBody Inventory inventory) {
        return inventoryService.update(id, inventory);
    }

    @PatchMapping("/warehouse/{warehouseId}/item/{itemId}")
    public void updateQuantity(@PathVariable Long warehouseId,
                               @PathVariable Long itemId,
                               @RequestParam BigDecimal quantity) {
        inventoryService.updateQuantity(warehouseId, itemId, quantity);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        inventoryService.delete(id);
    }
}