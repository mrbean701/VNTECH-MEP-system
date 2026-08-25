package com.mep.mepbackend.service;

import com.mep.mepbackend.entity.Project;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    public List<Project> getAll() {
        return projectRepository.findAll();
    }

    public Project getById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    public Project getByCode(String code) {
        return projectRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with code: " + code));
    }

    public List<Project> getByStatus(String status) {
        return projectRepository.findByStatus(status);
    }

    @Transactional
    public Project create(Project project) {
        if (projectRepository.existsByCode(project.getCode())) {
            throw new RuntimeException("Mã dự án đã tồn tại");
        }
        project.setStatus("ACTIVE");
        project.setCreatedAt(LocalDate.now());
        return projectRepository.save(project);
    }

    @Transactional
    public Project update(Long id, Project details) {
        Project project = getById(id);
        project.setCode(details.getCode());
        project.setName(details.getName());
        project.setClient(details.getClient());
        project.setCommander(details.getCommander());
        project.setStartDate(details.getStartDate());
        project.setEndDate(details.getEndDate());
        project.setStatus(details.getStatus());
        project.setNote(details.getNote());
        project.setUpdatedAt(LocalDate.now());
        return projectRepository.save(project);
    }

    @Transactional
    public void delete(Long id) {
        Project project = getById(id);
        // Kiểm tra xem có PR/PO liên quan không? (nếu cần)
        projectRepository.delete(project);
    }
}