package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {

    Optional<Position> findByName(String name);

    boolean existsByName(String name);

    List<Position> findByIsActiveTrue();

    @Query("SELECT p FROM Position p WHERE p.departmentId = :departmentId")
    List<Position> findByDepartmentId(@Param("departmentId") Long departmentId);
}
