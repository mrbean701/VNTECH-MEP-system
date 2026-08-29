package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.Position;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PositionService {

    private final PositionRepository positionRepository;
    private final AuditLogService auditLogService;

    public List<Position> getAll() {
        return positionRepository.findAll();
    }

    public List<Position> getActive() {
        return positionRepository.findByIsActiveTrue();
    }

    public Position getById(Long id) {
        return positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Position not found"));
    }

    public List<Position> getByDepartmentId(Long departmentId) {
        return positionRepository.findByDepartmentId(departmentId);
    }

    @Transactional
    public Position create(Position position) {
        if (positionRepository.existsByName(position.getName())) {
            throw new RuntimeException("Tên chức vụ đã tồn tại");
        }
        position.setCreatedAt(LocalDate.now());
        position.setIsActive(position.getIsActive() == null ? true : position.getIsActive());
        Position saved = positionRepository.save(position);
        auditLogService.log("CREATE", "POSITION", String.valueOf(saved.getId()),
                "Tạo chức vụ " + saved.getName(), null);
        return saved;
    }

    @Transactional
    public Position update(Long id, Position details) {
        Position pos = getById(id);
        // Cho phép đổi tên nếu chưa tồn tại tên khác (khác id hiện tại)
        if (details.getName() != null && !details.getName().equals(pos.getName())
                && positionRepository.existsByName(details.getName())) {
            throw new RuntimeException("Tên chức vụ đã tồn tại");
        }
        if (details.getName() != null) pos.setName(details.getName());
        pos.setDepartmentId(details.getDepartmentId());
        pos.setDescription(details.getDescription());
        if (details.getIsActive() != null) pos.setIsActive(details.getIsActive());
        pos.setUpdatedAt(LocalDate.now());
        Position saved = positionRepository.save(pos);
        auditLogService.log("UPDATE", "POSITION", String.valueOf(id),
                "Cập nhật chức vụ " + saved.getName(), null);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Position pos = getById(id);
        positionRepository.delete(pos);
        auditLogService.log("DELETE", "POSITION", String.valueOf(id),
                "Xóa chức vụ " + pos.getName(), null);
    }
}

