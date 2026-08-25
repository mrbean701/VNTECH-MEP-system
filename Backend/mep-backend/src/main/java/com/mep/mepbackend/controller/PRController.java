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

    @PutMapping("/{id}")
    public PR update(@PathVariable Long id, @RequestBody PR pr) {
        return prService.update(id, pr);
    }

    @PostMapping("/{id}/submit")
    public void submit(@PathVariable Long id) {
        prService.submit(id);
    }

    @PostMapping("/{id}/approve")
    public void approve(@PathVariable Long id) {
        prService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public void reject(@PathVariable Long id) {
        prService.reject(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        prService.delete(id);
    }
}