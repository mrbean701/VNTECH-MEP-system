package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.PO;
import com.mep.mepbackend.service.POService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/po")
@RequiredArgsConstructor
public class POController {

    private final POService poService;

    @GetMapping
    public List<PO> getAll() {
        return poService.getAll();
    }

    @GetMapping("/{id}")
    public PO getById(@PathVariable Long id) {
        return poService.getById(id);
    }

    @GetMapping("/code/{code}")
    public PO getByCode(@PathVariable String code) {
        return poService.getByCode(code);
    }

    @GetMapping("/project/{projectCode}")
    public List<PO> getByProject(@PathVariable String projectCode) {
        return poService.getByProjectCode(projectCode);
    }

    @GetMapping("/status/{status}")
    public List<PO> getByStatus(@PathVariable String status) {
        return poService.getByStatus(status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PO create(@RequestBody PO po) {
        return poService.create(po);
    }

    @PostMapping("/from-pr/{prId}")
    @ResponseStatus(HttpStatus.CREATED)
    public PO createFromPR(@PathVariable Long prId, @RequestBody PO po) {
        return poService.createFromPR(prId, po);
    }

    @PutMapping("/{id}")
    public PO update(@PathVariable Long id, @RequestBody PO po) {
        return poService.update(id, po);
    }

    @PostMapping("/{id}/submit")
    public void submit(@PathVariable Long id) {
        poService.submit(id);
    }

    @PostMapping("/{id}/approve")
    public void approve(@PathVariable Long id) {
        poService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public void reject(@PathVariable Long id) {
        poService.reject(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        poService.delete(id);
    }


}