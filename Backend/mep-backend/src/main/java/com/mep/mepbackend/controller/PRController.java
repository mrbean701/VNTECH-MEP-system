package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.PR;
import com.mep.mepbackend.service.PRService;  // ✅ Import đúng
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pr")
@RequiredArgsConstructor
public class PRController {

    private final PRService prService;  // ✅ Đúng type

    @GetMapping
    public List<PR> getAll() {
        return prService.getAll();
    }

    @GetMapping("/{id}")
    public PR getById(@PathVariable Long id) {
        return prService.getById(id);
    }

    // ... các method khác
}