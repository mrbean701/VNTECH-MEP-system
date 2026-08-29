package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.AutoReorderConfig;
import com.mep.mepbackend.entity.AutoReorderRule;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.service.AutoReorderService;
import com.mep.mepbackend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auto-reorder")
@RequiredArgsConstructor
public class AutoReorderController {

    private final AutoReorderService autoReorderService;
    private final CurrentUserUtil currentUserUtil;

    @GetMapping("/config")
    public AutoReorderConfig getConfig() {
        return autoReorderService.getConfig();
    }

    @PutMapping("/config")
    public AutoReorderConfig updateConfig(@RequestBody AutoReorderConfig config) {
        User currentUser = currentUserUtil.getCurrentUser();
        config.setCreatedBy(currentUser.getId());
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
        User currentUser = currentUserUtil.getCurrentUser();
        rule.setCreatedBy(currentUser.getId());
        return autoReorderService.createRule(rule);
    }

    @PutMapping("/rules/{id}")
    public AutoReorderRule updateRule(@PathVariable String id, @RequestBody AutoReorderRule rule) {
        User currentUser = currentUserUtil.getCurrentUser();
        rule.setCreatedBy(currentUser.getId());
        return autoReorderService.updateRule(id, rule);
    }

    @DeleteMapping("/rules/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRule(@PathVariable String id) {
        autoReorderService.deleteRule(id);
    }

    // ===== PHƯƠNG THỨC MỚI: Lên lịch cho một rule =====
    @PostMapping("/rules/{id}/schedule")
    public AutoReorderRule scheduleRule(@PathVariable String id,
                                        @RequestParam(required = false) String schedule,
                                        @RequestParam(required = false) String note) {
        User currentUser = currentUserUtil.getCurrentUser();
        return autoReorderService.scheduleOrder(id, schedule, note, currentUser.getId());
    }

    // ===== PHƯƠNG THỨC MỚI: Kích hoạt tạo đơn từ schedule =====
    @PostMapping("/trigger/{ruleId}")
    public Object triggerOrder(@PathVariable String ruleId) {
        return autoReorderService.createOrderFromSchedule(ruleId);
    }

    @PostMapping("/check")
    public List<Object> checkAndCreateOrders() {
        return autoReorderService.checkAndCreateOrders();
    }
}