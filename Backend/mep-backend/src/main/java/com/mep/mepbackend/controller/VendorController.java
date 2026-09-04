package com.mep.mepbackend.controller;

import com.mep.mepbackend.dto.VendorDTO;
import com.mep.mepbackend.entity.Vendor;
import com.mep.mepbackend.entity.VendorGroup;
import com.mep.mepbackend.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    // ===== GETTERS =====

    @GetMapping
    public List<VendorDTO> getAll() {
        return vendorService.getAllDTO();
    }

    @GetMapping("/active")
    public List<VendorDTO> getActive() {
        return vendorService.getActiveVendorsDTO();
    }

    @GetMapping("/{id}")
    public Vendor getById(@PathVariable Long id) {
        return vendorService.getById(id);
    }

    @GetMapping("/code/{code}")
    public Vendor getByCode(@PathVariable String code) {
        return vendorService.getByCode(code);
    }

    // ===== CRUD VENDOR =====

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Vendor create(@RequestBody Vendor vendor) {
        return vendorService.create(vendor);
    }

    @PutMapping("/{id}")
    public Vendor update(@PathVariable Long id, @RequestBody Vendor vendor) {
        return vendorService.update(id, vendor);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        vendorService.delete(id);
    }

    // ===== VENDOR GROUPS =====

    @GetMapping("/{vendorId}/groups")
    public List<VendorGroup> getGroups(@PathVariable Long vendorId) {
        return vendorService.getGroupsByVendor(vendorId);
    }

    @PostMapping("/{vendorId}/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public VendorGroup addGroup(@PathVariable Long vendorId, @RequestParam String name) {
        return vendorService.addGroup(vendorId, name);
    }

    @DeleteMapping("/groups/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeGroup(@PathVariable Long groupId) {
        vendorService.removeGroup(groupId);
    }

    // ✅ SỬA: PUT /{vendorId}/groups trả về VendorDTO thay vì void
    @PutMapping("/{vendorId}/groups")
    public VendorDTO updateGroups(@PathVariable Long vendorId, @RequestBody List<String> groupNames) {
        vendorService.updateGroups(vendorId, groupNames);
        return vendorService.getDTOById(vendorId);
    }
}