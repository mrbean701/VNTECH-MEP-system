package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    /**
     * Lấy tất cả thành viên của một team (kể cả đã rời)
     */
    List<TeamMember> findByTeamId(Long teamId);

    /**
     * Lấy thành viên đang hoạt động (chưa rời) của một team
     */
    List<TeamMember> findByTeamIdAndLeftAtIsNull(Long teamId);

    /**
     * Lấy tất cả team mà một user tham gia (kể cả đã rời)
     */
    List<TeamMember> findByUserId(Long userId);

    /**
     * Lấy team mà user đang hoạt động (chưa rời)
     */
    List<TeamMember> findByUserIdAndLeftAtIsNull(Long userId);

    /**
     * Tìm bản ghi cụ thể theo teamId và userId
     */
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);

    /**
     * Kiểm tra user có trong team không (chưa rời)
     */
    boolean existsByTeamIdAndUserIdAndLeftAtIsNull(Long teamId, Long userId);
}