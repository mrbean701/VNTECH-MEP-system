package com.mep.mepbackend.controller;

import com.mep.mepbackend.entity.Position;
import com.mep.mepbackend.service.PositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionService positionService;

    @GetMapping
    public List<Position> getAll() {
        return positionService.getAll();
    }

    @GetMapping("/active")
    public List<Position> getActive() {
        return positionService.getActive();
    }

    @GetMapping("/{id}")
    public Position getById(@PathVariable Long id) {
        return positionService.getById(id);
    }

    @GetMapping("/department/{departmentId}")
    public List<Position> getByDepartment(@PathVariable Long departmentId) {
        return positionService.getByDepartmentId(departmentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Position create(@RequestBody Position position) {
        return positionService.create(position);
    }

    @PutMapping("/{id}")
    public Position update(@PathVariable Long id, @RequestBody Position position) {
        return positionService.update(id, position);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        positionService.delete(id);
    }
}
