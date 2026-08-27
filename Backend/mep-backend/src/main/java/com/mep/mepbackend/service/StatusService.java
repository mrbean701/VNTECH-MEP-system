package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.Status;
import com.mep.mepbackend.exception.DuplicateResourceException;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.StatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatusService {

    private final StatusRepository statusRepository;

    // ===== GETTERS =====

    public List<Status> getAll() {
        return statusRepository.findAll();
    }

    public List<Status> getByEntityType(String entityType) {
        return statusRepository.findByEntityTypeOrderBySortOrderAsc(entityType);
    }

    public List<Status> getFinalStatuses(String entityType) {
        return statusRepository.findByEntityTypeAndIsFinalTrue(entityType);
    }

    public Status getById(Long id) {
        return statusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status not found with id: " + id));
    }

    public Status getByEntityTypeAndCode(String entityType, String code) {
        return statusRepository.findByEntityTypeAndCode(entityType, code)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Status not found with entityType: " + entityType + " and code: " + code));
    }

    public Status getDefaultStatus(String entityType) {
        return statusRepository.findByEntityTypeAndIsDefaultTrue(entityType)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Default status not found for entityType: " + entityType));
    }

    // ===== CREATE =====

    @Transactional
    public Status create(Status status) {
        // Kiểm tra trùng code
        if (statusRepository.existsByCode(status.getCode())) {
            throw new DuplicateResourceException("Status code '" + status.getCode() + "' already exists");
        }

        // Nếu là default, reset các default khác trong cùng entityType
        if (Boolean.TRUE.equals(status.getIsDefault())) {
            resetDefaultStatuses(status.getEntityType());
        }

        status.setCreatedAt(LocalDate.now());
        status.setUpdatedAt(LocalDate.now());
        return statusRepository.save(status);
    }

    // ===== UPDATE =====

    @Transactional
    public Status update(Long id, Status details) {
        Status status = getById(id);

        // Kiểm tra trùng code (nếu thay đổi code)
        if (!status.getCode().equals(details.getCode()) &&
                statusRepository.existsByCode(details.getCode())) {
            throw new DuplicateResourceException("Status code '" + details.getCode() + "' already exists");
        }

        status.setEntityType(details.getEntityType());
        status.setName(details.getName());
        status.setCode(details.getCode());
        status.setDescription(details.getDescription());
        status.setIsFinal(details.getIsFinal());
        status.setSortOrder(details.getSortOrder());
        status.setColor(details.getColor());
        status.setUpdatedAt(LocalDate.now());

        // Nếu set default, reset các default khác trong cùng entityType
        if (Boolean.TRUE.equals(details.getIsDefault()) && !Boolean.TRUE.equals(status.getIsDefault())) {
            resetDefaultStatuses(status.getEntityType());
            status.setIsDefault(true);
        } else {
            status.setIsDefault(details.getIsDefault());
        }

        return statusRepository.save(status);
    }

    // ===== DELETE =====

    @Transactional
    public void delete(Long id) {
        Status status = getById(id);
        // Không cho xóa status đang là default
        if (Boolean.TRUE.equals(status.getIsDefault())) {
            throw new RuntimeException("Cannot delete default status. Please set another status as default first.");
        }
        statusRepository.delete(status);
    }

    @Transactional
    public void deleteByEntityType(String entityType) {
        statusRepository.deleteByEntityType(entityType);
    }

    // ===== HELPER =====

    private void resetDefaultStatuses(String entityType) {
        List<Status> statuses = statusRepository.findByEntityType(entityType);
        for (Status s : statuses) {
            if (Boolean.TRUE.equals(s.getIsDefault())) {
                s.setIsDefault(false);
                s.setUpdatedAt(LocalDate.now());
                statusRepository.save(s);
            }
        }
    }
}