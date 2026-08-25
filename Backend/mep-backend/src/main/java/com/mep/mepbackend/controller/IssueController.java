package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Issue;
import com.mep.mepbackend.service.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issue")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @GetMapping
    public List<Issue> getAll() {
        return issueService.getAll();
    }

    @GetMapping("/{id}")
    public Issue getById(@PathVariable Long id) {
        return issueService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Issue create(@RequestBody Issue issue) {
        return issueService.create(issue);
    }

    @PutMapping("/{id}")
    public Issue update(@PathVariable Long id, @RequestBody Issue issue) {
        return issueService.update(id, issue);
    }

    @PostMapping("/{id}/submit")
    public void submit(@PathVariable Long id) {
        issueService.submit(id);
    }

    @PostMapping("/{id}/approve")
    public void approve(@PathVariable Long id) {
        issueService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public void reject(@PathVariable Long id) {
        issueService.reject(id);
    }

    @PostMapping("/{id}/complete")
    public void complete(@PathVariable Long id,
                         @RequestParam Long warehouseId,
                         @RequestBody String itemsUpdateJson) {
        issueService.complete(id, warehouseId, itemsUpdateJson);
    }

    @PostMapping("/{id}/confirm")
    public void confirm(@PathVariable Long id) {
        issueService.confirm(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        issueService.delete(id);
    }
}