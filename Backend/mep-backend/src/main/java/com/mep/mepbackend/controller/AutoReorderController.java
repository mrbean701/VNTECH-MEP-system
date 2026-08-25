package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.AutoReorderConfig;
import com.mep.mepbackend.entity.AutoReorderRule;
import com.mep.mepbackend.service.AutoReorderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auto-reorder")
@RequiredArgsConstructor
public class AutoReorderController {

    private final AutoReorderService autoReorderService;

    @GetMapping("/config")
    public AutoReorderConfig getConfig() {
        return autoReorderService.getConfig();
    }

    @PutMapping("/config")
    public AutoReorderConfig updateConfig(@RequestBody AutoReorderConfig config) {
        return autoReorderService.updateConfig(config);
    }

    @GetMapping("/rules")
    public List<AutoReorderRule> getAllRules() {
        return autoReorderService.getAllRules();
    }

    @GetMapping("/rules/warehouse/{warehouseId}")
    public List<AutoReorderRule> getRulesByWarehouse(@PathVariable Long warehouseId) {
        return autoReorderService.getRulesByWarehouse(warehouseId);
    }

    @PostMapping("/rules")
    @ResponseStatus(HttpStatus.CREATED)
    public AutoReorderRule createRule(@RequestBody AutoReorderRule rule) {
        return autoReorderService.createRule(rule);
    }

    @PutMapping("/rules/{id}")
    public AutoReorderRule updateRule(@PathVariable String id, @RequestBody AutoReorderRule rule) {
        return autoReorderService.updateRule(id, rule);
    }

    @DeleteMapping("/rules/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRule(@PathVariable String id) {
        autoReorderService.deleteRule(id);
    }

    @PostMapping("/check")
    public List<Object> checkAndCreateOrders() {
        return autoReorderService.checkAndCreateOrders();
    }
}