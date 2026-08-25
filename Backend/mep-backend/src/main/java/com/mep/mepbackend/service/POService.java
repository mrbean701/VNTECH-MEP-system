package com.mep.mepbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mep.mepbackend.entity.PO;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.PORepository;
import com.mep.mepbackend.repository.PRRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class POService {

    private final PORepository poRepository;
    private final PRRepository prRepository;
    private final ObjectMapper objectMapper;

    public List<PO> getAll() {
        return poRepository.findAll();
    }

    public PO getById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PO not found"));
    }

    public PO getByCode(String code) {
        return poRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("PO not found with code: " + code));
    }

    public List<PO> getByProjectCode(String projectCode) {
        return poRepository.findByProjectCode(projectCode);
    }

    public List<PO> getByStatus(String status) {
        return poRepository.findByStatus(status);
    }

    @Transactional
    public PO create(PO po) {
        if (poRepository.existsByCode(po.getCode())) {
            throw new RuntimeException("Mã PO đã tồn tại");
        }
        po.setStatus("DRAFT");
        po.setApprovalStep(1);
        po.setCreatedAt(LocalDate.now());
        return poRepository.save(po);
    }

    @Transactional
    public PO createFromPR(Long prId, PO poDetails) {
        var pr = prRepository.findById(prId)
                .orElseThrow(() -> new ResourceNotFoundException("PR not found"));
        if (!"APPROVED".equals(pr.getStatus())) {
            throw new RuntimeException("PR chưa được duyệt");
        }
        poDetails.setProjectCode(pr.getProjectCode());
        poDetails.setProjectName(pr.getProjectName());
        poDetails.setVendorCode(pr.getVendorCode());
        poDetails.setVendorName(pr.getVendorName());
        poDetails.setItems(pr.getItems());
        poDetails.setPrId(pr.getId());
        return create(poDetails);
    }

    @Transactional
    public PO update(Long id, PO details) {
        PO po = getById(id);
        if (!"DRAFT".equals(po.getStatus()) && !"PENDING".equals(po.getStatus())) {
            throw new RuntimeException("Chỉ có thể sửa PO ở trạng thái DRAFT hoặc PENDING");
        }
        po.setProjectCode(details.getProjectCode());
        po.setProjectName(details.getProjectName());
        po.setVendorCode(details.getVendorCode());
        po.setVendorName(details.getVendorName());
        po.setItems(details.getItems());
        po.setNote(details.getNote());
        po.setUpdatedAt(LocalDate.now());
        return poRepository.save(po);
    }

    @Transactional
    public void submit(Long id) {
        PO po = getById(id);
        if (!"DRAFT".equals(po.getStatus())) {
            throw new RuntimeException("Chỉ có thể gửi duyệt PO ở trạng thái DRAFT");
        }
        po.setStatus("PENDING");
        po.setApprovalStep(1);
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    @Transactional
    public void approve(Long id) {
        PO po = getById(id);
        if (!"PENDING".equals(po.getStatus())) {
            throw new RuntimeException("PO không ở trạng thái chờ duyệt");
        }
        int step = po.getApprovalStep() != null ? po.getApprovalStep() : 1;
        if (step < 3) {
            po.setApprovalStep(step + 1);
            po.setStatus("PENDING");
        } else {
            po.setStatus("APPROVED");
        }
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    @Transactional
    public void reject(Long id) {
        PO po = getById(id);
        if (!"PENDING".equals(po.getStatus())) {
            throw new RuntimeException("PO không ở trạng thái chờ duyệt");
        }
        po.setStatus("REJECTED");
        po.setUpdatedAt(LocalDate.now());
        poRepository.save(po);
    }

    @Transactional
    public void delete(Long id) {
        PO po = getById(id);
        if (!"DRAFT".equals(po.getStatus())) {
            throw new RuntimeException("Chỉ có thể xóa PO ở trạng thái DRAFT");
        }
        poRepository.delete(po);
    }
}