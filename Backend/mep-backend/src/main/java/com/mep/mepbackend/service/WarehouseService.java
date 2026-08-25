package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.Warehouse;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public List<Warehouse> getAll() {
        return warehouseRepository.findAll();
    }

    public Warehouse getById(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
    }

    public Warehouse getByCode(String code) {
        return warehouseRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with code: " + code));
    }

    public List<Warehouse> getByProjectId(Long projectId) {
        return warehouseRepository.findByProjectId(projectId);
    }

    @Transactional
    public Warehouse create(Warehouse warehouse) {
        if (warehouseRepository.existsByCode(warehouse.getCode())) {
            throw new RuntimeException("Mã kho đã tồn tại");
        }
        warehouse.setStatus("ACTIVE");
        warehouse.setCreatedAt(LocalDate.now());
        return warehouseRepository.save(warehouse);
    }

    @Transactional
    public Warehouse update(Long id, Warehouse details) {
        Warehouse wh = getById(id);
        wh.setCode(details.getCode());
        wh.setName(details.getName());
        wh.setType(details.getType());
        wh.setProjectId(details.getProjectId());
        wh.setManager(details.getManager());
        wh.setAddress(details.getAddress());
        wh.setStatus(details.getStatus());
        wh.setNote(details.getNote());
        wh.setUpdatedAt(LocalDate.now());
        return warehouseRepository.save(wh);
    }

    @Transactional
    public void delete(Long id) {
        Warehouse wh = getById(id);
        // Kiểm tra tồn kho liên quan? (nếu cần)
        warehouseRepository.delete(wh);
    }
}