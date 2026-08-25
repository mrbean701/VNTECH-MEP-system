package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.STO;
import com.mep.mepbackend.service.STOService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sto")
@RequiredArgsConstructor
public class STOController {

    private final STOService stoService;

    @GetMapping
    public List<STO> getAll() {
        return stoService.getAll();
    }

    @GetMapping("/{id}")
    public STO getById(@PathVariable Long id) {
        return stoService.getById(id);
    }

    @GetMapping("/code/{code}")
    public STO getByCode(@PathVariable String code) {
        return stoService.getByCode(code);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public STO create(@RequestBody STO sto) {
        return stoService.create(sto);
    }

    @PutMapping("/{id}")
    public STO update(@PathVariable Long id, @RequestBody STO sto) {
        return stoService.update(id, sto);
    }

    @PostMapping("/{id}/submit")
    public void submit(@PathVariable Long id) {
        stoService.submit(id);
    }

    @PostMapping("/{id}/approve")
    public void approve(@PathVariable Long id) {
        stoService.approve(id);
    }

    @PostMapping("/{id}/complete")
    public void complete(@PathVariable Long id) {
        stoService.complete(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        stoService.delete(id);
    }
}