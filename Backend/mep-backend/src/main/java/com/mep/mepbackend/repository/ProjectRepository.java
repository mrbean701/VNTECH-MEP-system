package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByCode(String code);

    boolean existsByCode(String code);

    List<Project> findByStatus(String status);

    List<Project> findByClientContainingIgnoreCase(String client);

    List<Project> findByNameContainingIgnoreCase(String name);
}