package com.mep.mepbackend.service;

import com.mep.mepbackend.dto.VendorDTO;
import com.mep.mepbackend.entity.Vendor;
import com.mep.mepbackend.entity.VendorGroup;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.VendorGroupRepository;
import com.mep.mepbackend.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final VendorGroupRepository vendorGroupRepository;
    private final AuditLogService auditLogService;

    // ===== GETTERS =====

    /**
     * Lấy tất cả vendor (không lọc)
     */
    public List<Vendor> getAll() {
        return vendorRepository.findAll();
    }

    /**
     * Lấy tất cả vendor đang hoạt động (dùng cho dropdown)
     */
    public List<Vendor> getActiveVendors() {
        return vendorRepository.findByStatus("ACTIVE");
    }

    /**
     * Lấy tất cả vendor kèm group (DTO)
     */
    public List<VendorDTO> getAllDTO() {
        List<Vendor> vendors = vendorRepository.findAll();
        if (vendors.isEmpty()) return new ArrayList<>();

        // Lấy tất cả group cho các vendor
        List<Long> vendorIds = vendors.stream().map(Vendor::getId).collect(Collectors.toList());
        List<VendorGroup> allGroups = vendorGroupRepository.findByVendorIdIn(vendorIds);
        Map<Long, List<String>> groupMap = allGroups.stream()
                .collect(Collectors.groupingBy(
                        VendorGroup::getVendorId,
                        Collectors.mapping(VendorGroup::getName, Collectors.toList())
                ));

        // Tạo DTO và set vendorGroups
        return vendors.stream().map(v -> {
            VendorDTO dto = new VendorDTO();
            BeanUtils.copyProperties(v, dto);
            dto.setVendorGroups(groupMap.getOrDefault(v.getId(), new ArrayList<>()));
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Lấy danh sách vendor active dạng DTO
     */
    public List<VendorDTO> getActiveVendorsDTO() {
        List<Vendor> vendors = vendorRepository.findByStatus("ACTIVE");
        return convertToDTOList(vendors);
    }

    public Vendor getById(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
    }

    public Vendor getByCode(String code) {
        return vendorRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with code: " + code));
    }

    // ===== CREATE =====

    @Transactional
    public Vendor create(Vendor vendor) {
        if (vendorRepository.existsByCode(vendor.getCode())) {
            throw new RuntimeException("Mã NCC đã tồn tại");
        }
        vendor.setStatus("ACTIVE");
        vendor.setCreatedAt(LocalDate.now());
        Vendor saved = vendorRepository.save(vendor);
        auditLogService.log("CREATE", "VENDOR", String.valueOf(saved.getId()),
                "Tạo nhà cung cấp " + saved.getName() + " (" + saved.getCode() + ")", null);
        return saved;
    }

    // ===== UPDATE =====

    @Transactional
    public Vendor update(Long id, Vendor details) {
        Vendor vendor = getById(id);
        vendor.setCode(details.getCode());
        vendor.setName(details.getName());
        vendor.setVendorGroup(details.getVendorGroup());
        vendor.setContact(details.getContact());
        vendor.setPhone(details.getPhone());
        vendor.setEmail(details.getEmail());
        vendor.setPaymentTerm(details.getPaymentTerm());
        vendor.setNote(details.getNote());
        vendor.setUpdatedAt(LocalDate.now());

        // ✅ Xử lý status
        String newStatus = details.getStatus();
        if (newStatus != null) {
            vendor.setStatus(newStatus);
            if ("INACTIVE".equals(newStatus)) {
                vendor.setInactiveDate(LocalDate.now());
            } else {
                vendor.setInactiveDate(null);
            }
        }

        Vendor saved = vendorRepository.save(vendor);
        auditLogService.log("UPDATE", "VENDOR", String.valueOf(id),
                "Cập nhật nhà cung cấp " + saved.getName(), null);
        return saved;
    }

    // ===== DELETE =====

    @Transactional
    public void delete(Long id) {
        Vendor vendor = getById(id);
        // Kiểm tra xem có PR/PO liên quan không? (nếu cần)
        vendorRepository.delete(vendor);
        auditLogService.log("DELETE", "VENDOR", String.valueOf(id),
                "Xóa nhà cung cấp " + vendor.getName(), null);
    }

    // ===== VENDOR GROUP CRUD =====

    @Transactional
    public VendorGroup addGroup(Long vendorId, String groupName) {
        Vendor vendor = getById(vendorId);
        VendorGroup group = new VendorGroup();
        group.setVendorId(vendorId);
        group.setName(groupName);
        group.setCreatedAt(LocalDate.now());
        group.setUpdatedAt(LocalDate.now());
        VendorGroup saved = vendorGroupRepository.save(group);
        auditLogService.log("CREATE", "VENDOR_GROUP", String.valueOf(saved.getId()),
                "Thêm nhóm hàng '" + groupName + "' cho vendor " + vendor.getName(), null);
        return saved;
    }

    @Transactional
    public void removeGroup(Long groupId) {
        VendorGroup group = vendorGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("VendorGroup not found"));
        vendorGroupRepository.delete(group);
        auditLogService.log("DELETE", "VENDOR_GROUP", String.valueOf(groupId),
                "Xóa nhóm hàng '" + group.getName() + "'", null);
    }

    @Transactional
    public void updateGroups(Long vendorId, List<String> groupNames) {
        // Xóa group cũ
        vendorGroupRepository.deleteByVendorId(vendorId);

        // Thêm group mới
        if (groupNames != null && !groupNames.isEmpty()) {
            for (String name : groupNames) {
                if (name != null && !name.trim().isEmpty()) {
                    VendorGroup group = new VendorGroup();
                    group.setVendorId(vendorId);
                    group.setName(name.trim());
                    group.setCreatedAt(LocalDate.now());
                    group.setUpdatedAt(LocalDate.now());
                    vendorGroupRepository.save(group);
                }
            }
        }
        auditLogService.log("UPDATE", "VENDOR_GROUPS", String.valueOf(vendorId),
                "Cập nhật nhóm hàng cho vendor ID " + vendorId, null);
    }

    public List<VendorGroup> getGroupsByVendor(Long vendorId) {
        return vendorGroupRepository.findByVendorId(vendorId);
    }

    // ===== HELPER =====

    private List<VendorDTO> convertToDTOList(List<Vendor> vendors) {
        if (vendors == null || vendors.isEmpty()) return new ArrayList<>();

        // Lấy tất cả group theo vendorId
        List<Long> vendorIds = vendors.stream().map(Vendor::getId).collect(Collectors.toList());
        List<VendorGroup> groups = vendorGroupRepository.findByVendorIdIn(vendorIds);

        // Map vendorId -> List<String> group names
        java.util.Map<Long, List<String>> groupMap = groups.stream()
                .collect(Collectors.groupingBy(
                        VendorGroup::getVendorId,
                        Collectors.mapping(VendorGroup::getName, Collectors.toList())
                ));

        return vendors.stream().map(v -> {
            VendorDTO dto = new VendorDTO();
            dto.setId(v.getId());
            dto.setCode(v.getCode());
            dto.setName(v.getName());
            dto.setVendorGroup(v.getVendorGroup());
            dto.setContact(v.getContact());
            dto.setPhone(v.getPhone());
            dto.setEmail(v.getEmail());
            dto.setPaymentTerm(v.getPaymentTerm());
            dto.setNote(v.getNote());
            dto.setCreatedAt(v.getCreatedAt());
            dto.setUpdatedAt(v.getUpdatedAt());
            dto.setStatus(v.getStatus());
            dto.setInactiveDate(v.getInactiveDate());
            dto.setVendorGroups(groupMap.getOrDefault(v.getId(), new ArrayList<>()));
            return dto;
        }).collect(Collectors.toList());
    }

    public VendorDTO getDTOById(Long id) {
        Vendor vendor = getById(id);
        VendorDTO dto = new VendorDTO();
        BeanUtils.copyProperties(vendor, dto);

        // Lấy danh sách nhóm hàng
        List<VendorGroup> groups = vendorGroupRepository.findByVendorId(id);
        dto.setVendorGroups(groups.stream()
                .map(VendorGroup::getName)
                .collect(Collectors.toList()));

        return dto;
    }
    
}