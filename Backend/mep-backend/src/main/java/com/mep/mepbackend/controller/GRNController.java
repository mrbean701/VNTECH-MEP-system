package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.GRN;
import com.mep.mepbackend.service.GRNService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/grn")
@RequiredArgsConstructor
public class GRNController {

    private final GRNService grnService;

    @GetMapping
    public List<GRN> getAll() {
        return grnService.getAll();
    }

    @GetMapping("/{id}")
    public GRN getById(@PathVariable Long id) {
        return grnService.getById(id);
    }

    @GetMapping("/code/{code}")
    public GRN getByCode(@PathVariable String code) {
        return grnService.getByCode(code);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GRN create(@RequestBody GRN grn) {
        return grnService.create(grn);
    }

    @PutMapping("/{id}")
    public GRN update(@PathVariable Long id, @RequestBody GRN grn) {
        return grnService.update(id, grn);
    }

    @PostMapping("/{id}/receive")
    public void receive(@PathVariable Long id,
                        @RequestParam String warehouseStaff,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate receiptDate) {
        grnService.receive(id, warehouseStaff, receiptDate);
    }

    @PostMapping("/{id}/qc")
    public void qcCheck(@PathVariable Long id,
                        @RequestParam String qcName,
                        @RequestParam String result,
                        @RequestParam(required = false) String note) {
        grnService.qcCheck(id, qcName, result, note != null ? note : "");
    }

    @PostMapping("/{id}/complete")
    public void complete(@PathVariable Long id) {
        grnService.complete(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        grnService.delete(id);
    }
}