package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.PR;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.PRRepository;
import com.mep.mepbackend.repository.MRRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PRService {

    private final PRRepository prRepository;
    private final MRRepository mrRepository;
    private final ObjectMapper objectMapper;

    public List<PR> getAll() {
        return prRepository.findAll();
    }

    public PR getById(Long id) {
        return prRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found"));
    }

    public PR getByCode(String code) {
        return prRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found with code: " + code));
    }

    public List<PR> getByProjectCode(String projectCode) {
        return prRepository.findByProjectCode(projectCode);
    }

    public List<PR> getByStatus(String status) {
        return prRepository.findByStatus(status);
    }

    @Transactional
    public PR create(PR pr) {
        if (prRepository.existsByCode(pr.getCode())) {
            throw new RuntimeException("Mã PR đã tồn tại");
        }
        pr.setStatus("DRAFT");
        pr.setApprovalStep(1);
        pr.setCreatedAt(LocalDate.now());
        return prRepository.save(pr);
    }

    @Transactional
    public PR createFromMR(Long mrId, PR prDetails) {
        var mr = mrRepository.findById(mrId)
                .orElseThrow(() -> new ResourceNotFoundException("MR not found"));
        if (!"APPROVED".equals(mr.getStatus())) {
            throw new RuntimeException("MR chưa được duyệt");
        }
        prDetails.setProjectCode(mr.getProjectCode());
        prDetails.setProjectName(mr.getProjectName());
        prDetails.setItems(mr.getItems());
        prDetails.setMrId(mr.getId());
        return create(prDetails);
    }

    @Transactional
    public PR update(Long id, PR details) {
        PR pr = getById(id);
        if (!"DRAFT".equals(pr.getStatus()) && !"PENDING".equals(pr.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa PR ở trạng thái DRAFT hoặc PENDING");
        }
        pr.setProjectCode(details.getProjectCode());
        pr.setProjectName(details.getProjectName());
        pr.setVendorCode(details.getVendorCode());
        pr.setVendorName(details.getVendorName());
        pr.setItems(details.getItems());
        pr.setNote(details.getNote());
        pr.setUpdatedAt(LocalDate.now());
        return prRepository.save(pr);
    }

    @Transactional
    public void submit(Long id) {
        PR pr = getById(id);
        if (!"DRAFT".equals(pr.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt PR ở trạng thái DRAFT");
        }
        pr.setStatus("PENDING");
        pr.setApprovalStep(1);
        pr.setUpdatedAt(LocalDate.now());
        prRepository.save(pr);
    }

    @Transactional
    public void approve(Long id) {
        PR pr = getById(id);
        if (!"PENDING".equals(pr.getStatus())) {
            throw new RuntimeException("PR không ở trạng thái chờ duyệt");
        }
        int step = pr.getApprovalStep() != null ? pr.getApprovalStep() : 1;
        if (step < 3) {
            pr.setApprovalStep(step + 1);
            pr.setStatus("PENDING");
        } else {
            pr.setStatus("APPROVED");
        }
        pr.setUpdatedAt(LocalDate.now());
        prRepository.save(pr);
    }

    @Transactional
    public void reject(Long id) {
        PR pr = getById(id);
        if (!"PENDING".equals(pr.getStatus())) {
            throw new RuntimeException("PR không ở trạng thái chờ duyệt");
        }
        pr.setStatus("REJECTED");
        pr.setUpdatedAt(LocalDate.now());
        prRepository.save(pr);
    }

    @Transactional
    public void delete(Long id) {
        PR pr = getById(id);
        if (!"DRAFT".equals(pr.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa PR ở trạng thái DRAFT");
        }
        prRepository.delete(pr);
    }
}