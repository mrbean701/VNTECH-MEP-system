package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Long> {

    Optional<Workflow> findByModule(String module);

    boolean existsByModule(String module);
}