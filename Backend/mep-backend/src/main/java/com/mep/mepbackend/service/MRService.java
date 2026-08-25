package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.MR;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.MRRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MRService {

    private final MRRepository mrRepository;
    private final ObjectMapper objectMapper;

    public List<MR> getAll() {
        return mrRepository.findAll();
    }

    public MR getById(Long id) {
        return mrRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MR not found"));
    }

    public MR getByCode(String code) {
        return mrRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("MR not found with code: " + code));
    }

    public List<MR> getByProjectCode(String projectCode) {
        return mrRepository.findByProjectCode(projectCode);
    }

    public List<MR> getByStatus(String status) {
        return mrRepository.findByStatus(status);
    }

    @Transactional
    public MR create(MR mr) {
        if (mrRepository.existsByCode(mr.getCode())) {
            throw new RuntimeException("Mã MR đã tồn tại");
        }
        mr.setStatus("DRAFT");
        mr.setCreatedAt(LocalDate.now());
        return mrRepository.save(mr);
    }

    @Transactional
    public MR update(Long id, MR details) {
        MR mr = getById(id);
        if (!"DRAFT".equals(mr.getStatus()) && !"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa MR ở trạng thái DRAFT hoặc PENDING");
        }
        mr.setProjectCode(details.getProjectCode());
        mr.setProjectName(details.getProjectName());
        mr.setItems(details.getItems());
        mr.setNeedDate(details.getNeedDate());
        mr.setPurpose(details.getPurpose());
        mr.setRequester(details.getRequester());
        mr.setNote(details.getNote());
        mr.setUpdatedAt(LocalDate.now());
        return mrRepository.save(mr);
    }

    @Transactional
    public void submit(Long id) {
        MR mr = getById(id);
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt MR ở trạng thái DRAFT");
        }
        mr.setStatus("PENDING");
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);
    }

    @Transactional
    public void approve(Long id) {
        MR mr = getById(id);
        if (!"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("MR không ở trạng thái chờ duyệt");
        }
        mr.setStatus("APPROVED");
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);
    }

    @Transactional
    public void reject(Long id) {
        MR mr = getById(id);
        if (!"PENDING".equals(mr.getStatus())) {
            throw new RuntimeException("MR không ở trạng thái chờ duyệt");
        }
        mr.setStatus("REJECTED");
        mr.setUpdatedAt(LocalDate.now());
        mrRepository.save(mr);
    }

    @Transactional
    public void delete(Long id) {
        MR mr = getById(id);
        if (!"DRAFT".equals(mr.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa MR ở trạng thái DRAFT");
        }
        mrRepository.delete(mr);
    }
}