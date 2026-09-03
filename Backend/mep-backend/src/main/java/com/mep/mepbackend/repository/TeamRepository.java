package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    /**
     * Tìm team theo tên (không phân biệt hoa thường)
     */
    Optional<Team> findByNameIgnoreCase(String name);

    /**
     * Kiểm tra tồn tại team theo tên
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Tìm tất cả team có tên chứa keyword (không phân biệt hoa thường)
     */
    List<Team> findByNameContainingIgnoreCase(String keyword);
}