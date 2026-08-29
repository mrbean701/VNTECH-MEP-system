package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.PR;
import com.mep.mepbackend.service.PRService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pr")
@RequiredArgsConstructor
public class PRController {

    private final PRService prService;

    // ===== GETTERS =====

    @GetMapping
    public List<PR> getAll() {
        return prService.getAll();
    }

    @GetMapping("/{id}")
    public PR getById(@PathVariable Long id) {
        return prService.getById(id);
    }

    @GetMapping("/code/{code}")
    public PR getByCode(@PathVariable String code) {
        return prService.getByCode(code);
    }

    @GetMapping("/project/{projectCode}")
    public List<PR> getByProject(@PathVariable String projectCode) {
        return prService.getByProjectCode(projectCode);
    }

    @GetMapping("/status/{status}")
    public List<PR> getByStatus(@PathVariable String status) {
        return prService.getByStatus(status);
    }

    @GetMapping("/mr/{mrId}")
    public List<PR> getByMr(@PathVariable Long mrId) {
        return prService.getByMrId(mrId);
    }

    @GetMapping("/vendor/{vendorCode}")
    public List<PR> getByVendor(@PathVariable String vendorCode) {
        return prService.getByVendorCode(vendorCode);
    }

    // ===== CREATE =====

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PR create(@RequestBody PR pr) {
        return prService.create(pr);
    }

    @PostMapping("/from-mr/{mrId}")
    @ResponseStatus(HttpStatus.CREATED)
    public PR createFromMR(@PathVariable Long mrId, @RequestBody PR pr) {
        return prService.createFromMR(mrId, pr);
    }

    // ===== UPDATE =====

    @PutMapping("/{id}")
    public PR update(@PathVariable Long id, @RequestBody PR pr) {
        return prService.update(id, pr);
    }

    // ===== WORKFLOW ACTIONS =====

    @PostMapping("/{id}/submit")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submit(@PathVariable Long id) {
        prService.submit(id);
    }

    @PostMapping("/{id}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable Long id) {
        prService.approve(id);
    }

    @PostMapping("/{id}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable Long id) {
        prService.reject(id);
    }

    // ===== DELETE =====

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        prService.delete(id);
    }
}