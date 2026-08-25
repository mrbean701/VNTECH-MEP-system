package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.MR;
import com.mep.mepbackend.service.MRService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mr")
@RequiredArgsConstructor
public class MRController {

    private final MRService mrService;

    @GetMapping
    public List<MR> getAll() {
        return mrService.getAll();
    }

    @GetMapping("/{id}")
    public MR getById(@PathVariable Long id) {
        return mrService.getById(id);
    }

    @GetMapping("/code/{code}")
    public MR getByCode(@PathVariable String code) {
        return mrService.getByCode(code);
    }

    @GetMapping("/project/{projectCode}")
    public List<MR> getByProject(@PathVariable String projectCode) {
        return mrService.getByProjectCode(projectCode);
    }

    @GetMapping("/status/{status}")
    public List<MR> getByStatus(@PathVariable String status) {
        return mrService.getByStatus(status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MR create(@RequestBody MR mr) {
        return mrService.create(mr);
    }

    @PutMapping("/{id}")
    public MR update(@PathVariable Long id, @RequestBody MR mr) {
        return mrService.update(id, mr);
    }

    @PostMapping("/{id}/submit")
    public void submit(@PathVariable Long id) {
        mrService.submit(id);
    }

    @PostMapping("/{id}/approve")
    public void approve(@PathVariable Long id) {
        mrService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public void reject(@PathVariable Long id) {
        mrService.reject(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        mrService.delete(id);
    }
}