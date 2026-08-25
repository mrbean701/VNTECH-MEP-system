package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.Vendor;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;

    public List<Vendor> getAll() {
        return vendorRepository.findAll();
    }

    public Vendor getById(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
    }

    public Vendor getByCode(String code) {
        return vendorRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with code: " + code));
    }

    @Transactional
    public Vendor create(Vendor vendor) {
        if (vendorRepository.existsByCode(vendor.getCode())) {
            throw new RuntimeException("Mã NCC đã tồn tại");
        }
        vendor.setCreatedAt(LocalDate.now());
        return vendorRepository.save(vendor);
    }

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
        return vendorRepository.save(vendor);
    }

    @Transactional
    public void delete(Long id) {
        Vendor vendor = getById(id);
        // Kiểm tra xem có PR/PO liên quan không? (nếu cần)
        vendorRepository.delete(vendor);
    }
}