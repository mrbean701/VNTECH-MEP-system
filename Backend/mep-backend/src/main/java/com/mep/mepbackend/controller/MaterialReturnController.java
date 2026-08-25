package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.MaterialReturn;
import com.mep.mepbackend.service.MaterialReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/material-return")
@RequiredArgsConstructor
public class MaterialReturnController {

    private final MaterialReturnService returnService;

    @GetMapping
    public List<MaterialReturn> getAll() {
        return returnService.getAll();
    }

    @GetMapping("/{id}")
    public MaterialReturn getById(@PathVariable Long id) {
        return returnService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialReturn create(@RequestBody MaterialReturn materialReturn) {
        return returnService.create(materialReturn);
    }

    @PutMapping("/{id}")
    public MaterialReturn update(@PathVariable Long id, @RequestBody MaterialReturn materialReturn) {
        return returnService.update(id, materialReturn);
    }

    @PostMapping("/{id}/submit")
    public void submit(@PathVariable Long id) {
        returnService.submit(id);
    }

    @PostMapping("/{id}/approve")
    public void approve(@PathVariable Long id, @RequestBody String itemsUpdateJson) {
        returnService.approve(id, itemsUpdateJson);
    }

    @PostMapping("/{id}/confirm")
    public void confirm(@PathVariable Long id) {
        returnService.confirm(id);
    }

    @PostMapping("/{id}/reject")
    public void reject(@PathVariable Long id) {
        returnService.reject(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        returnService.delete(id);
    }
}