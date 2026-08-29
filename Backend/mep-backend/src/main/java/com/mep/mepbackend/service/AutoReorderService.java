package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.*;
import com.mep.mepbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AutoReorderService {

    private final AutoReorderConfigRepository configRepository;
    private final AutoReorderRuleRepository ruleRepository;
    private final InventoryRepository inventoryRepository;
    private final MinStockRepository minStockRepository;
    private final MRRepository mrRepository;
    private final PRRepository prRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProjectRepository projectRepository;
    private final StatusService statusService;

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
        existing.setSchedule(config.getSchedule());
        existing.setNote(config.getNote());
        existing.setCreatedBy(config.getCreatedBy());
        existing.setUpdatedAt(LocalDate.now());
        return configRepository.save(existing);
    }

    public List<AutoReorderRule> getAllRules() {
        return ruleRepository.findAll();
    }

    @Transactional
    public AutoReorderRule scheduleOrder(String ruleId, String schedule, String note, Long createdBy) {
        AutoReorderRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Rule not found"));

        rule.setSchedule(schedule);
        rule.setNote(note);
        rule.setCreatedBy(createdBy);
        rule.setUpdatedAt(LocalDateTime.now());
        return ruleRepository.save(rule);
    }

    @Transactional
    public Object createOrderFromSchedule(String ruleId) {
        AutoReorderRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Rule not found"));

        if (!rule.getEnabled()) {
            throw new RuntimeException("Rule đang bị tắt");
        }

        // Sử dụng mảng để có thể gán trong lambda
        final String[] createdByName = {"SYSTEM"};
        if (rule.getCreatedBy() != null) {
            userRepository.findById(rule.getCreatedBy())
                    .ifPresent(u -> createdByName[0] = u.getName());
        }

        Item item = itemRepository.findById(rule.getItemId())
                .orElseThrow(() -> new RuntimeException("Item not found"));

        Warehouse warehouse = null;
        if (rule.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(rule.getWarehouseId()).orElse(null);
        }

        String projectCode = "DEFAULT";
        String projectName = "Dự án mặc định";
        if (warehouse != null && warehouse.getProjectId() != null) {
            Project project = projectRepository.findById(warehouse.getProjectId()).orElse(null);
            if (project != null) {
                projectCode = project.getCode();
                projectName = project.getName();
            }
        }

        String orderType = rule.getOrderType() != null ? rule.getOrderType() : "PR";
        String note = "Tự động tạo từ Auto Reorder - Cấu hình bởi " + createdByName[0] +
                (rule.getNote() != null && !rule.getNote().isEmpty() ? " - Ghi chú: " + rule.getNote() : "");

        String itemsJson = "[{\"itemId\":" + rule.getItemId() +
                ", \"quantity\":" + rule.getReorderQuantity() + "}]";

        if ("MR".equalsIgnoreCase(orderType)) {
            MR mr = new MR();
            mr.setCode("MR-AUTO-" + System.currentTimeMillis());
            mr.setProjectCode(projectCode);
            mr.setProjectName(projectName);
            mr.setItems(itemsJson);
            mr.setNeedDate(LocalDate.now().plusDays(7));
            mr.setPurpose("Tự động đặt hàng");
            mr.setRequester("Hệ thống");
            mr.setStatus(statusService.getDefaultStatus("mr").getCode());
            mr.setApprovalStep(1);
            mr.setCreatedBy(rule.getCreatedBy());
            mr.setCreatedByName(createdByName[0]);
            mr.setNote(note);
            mr.setCreatedAt(LocalDate.now());
            return mrRepository.save(mr);
        } else {
            PR pr = new PR();
            pr.setCode("PR-AUTO-" + System.currentTimeMillis());
            pr.setProjectCode(projectCode);
            pr.setProjectName(projectName);
            pr.setVendorCode(rule.getVendorId());
            pr.setVendorName("");
            pr.setItems(itemsJson);
            pr.setStatus(statusService.getDefaultStatus("pr").getCode());
            pr.setApprovalStep(1);
            pr.setCreatedBy(rule.getCreatedBy());
            pr.setCreatedByName(createdByName[0]);
            pr.setNote(note);
            pr.setCreatedAt(LocalDate.now());
            return prRepository.save(pr);
        }
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
        rule.setSchedule(details.getSchedule());
        rule.setNote(details.getNote());
        rule.setCreatedBy(details.getCreatedBy());
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
        List<Object> createdOrders = new ArrayList<>();
        var config = getConfig();
        if (!config.getEnabled()) {
            return createdOrders;
        }

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
                    var rule = ruleRepository.findByItemIdAndWarehouseId(
                            minStock.getItemId(), minStock.getWarehouseId());
                    BigDecimal orderQty;
                    String vendorId = config.getDefaultVendorCode();
                    final String[] noteRef = {config.getNote()};
                    final Long[] createdByRef = {config.getCreatedBy()};
                    String schedule = config.getSchedule();

                    if (rule.isPresent() && rule.get().getEnabled()) {
                        orderQty = rule.get().getReorderQuantity();
                        if (rule.get().getVendorId() != null) {
                            vendorId = rule.get().getVendorId();
                        }
                        if (rule.get().getNote() != null) {
                            noteRef[0] = rule.get().getNote();
                        }
                        if (rule.get().getCreatedBy() != null) {
                            createdByRef[0] = rule.get().getCreatedBy();
                        }
                        schedule = rule.get().getSchedule();
                    } else {
                        orderQty = minStock.getMinQuantity().multiply(config.getMultiplier());
                    }

                    // Tạo đơn hàng
                    try {
                        final String[] createdByName = {"SYSTEM"};
                        if (createdByRef[0] != null) {
                            userRepository.findById(createdByRef[0])
                                    .ifPresent(u -> createdByName[0] = u.getName());
                        }

                        Item item = itemRepository.findById(minStock.getItemId()).orElse(null);
                        Warehouse warehouse = warehouseRepository.findById(minStock.getWarehouseId()).orElse(null);

                        String projectCode = "DEFAULT";
                        String projectName = "Dự án mặc định";
                        if (warehouse != null && warehouse.getProjectId() != null) {
                            Project project = projectRepository.findById(warehouse.getProjectId()).orElse(null);
                            if (project != null) {
                                projectCode = project.getCode();
                                projectName = project.getName();
                            }
                        }

                        String orderNote = "Tự động tạo từ Auto Reorder - Cấu hình bởi " + createdByName[0] +
                                (noteRef[0] != null && !noteRef[0].isEmpty() ? " - Ghi chú: " + noteRef[0] : "");

                        String itemsJson = "[{\"itemId\":" + minStock.getItemId() +
                                ", \"quantity\":" + orderQty + "}]";

                        PR pr = new PR();
                        pr.setCode("PR-AUTO-" + System.currentTimeMillis() + "-" + minStock.getItemId());
                        pr.setProjectCode(projectCode);
                        pr.setProjectName(projectName);
                        pr.setVendorCode(vendorId);
                        pr.setVendorName("");
                        pr.setItems(itemsJson);
                        pr.setStatus(statusService.getDefaultStatus("pr").getCode());
                        pr.setApprovalStep(1);
                        pr.setCreatedBy(createdByRef[0]);
                        pr.setCreatedByName(createdByName[0]);
                        pr.setNote(orderNote);
                        pr.setCreatedAt(LocalDate.now());
                        PR saved = prRepository.save(pr);
                        createdOrders.add(saved);
                    } catch (Exception e) {
                        System.err.println("Error creating order for item " + minStock.getItemId() + ": " + e.getMessage());
                    }
                }
            }
        }
        return createdOrders;
    }
}