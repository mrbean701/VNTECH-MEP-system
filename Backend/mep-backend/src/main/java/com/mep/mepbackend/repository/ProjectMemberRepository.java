package com.mep.mepbackend.repository;

import com.mep.mepbackend.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    /**
     * Lấy tất cả thành viên của một dự án (kể cả đã rời)
     */
    List<ProjectMember> findByProjectId(Long projectId);

    /**
     * Lấy thành viên đang hoạt động (chưa rời) của một dự án
     */
    List<ProjectMember> findByProjectIdAndLeftAtIsNull(Long projectId);

    /**
     * Lấy tất cả dự án mà một user tham gia (kể cả đã rời)
     */
    List<ProjectMember> findByUserId(Long userId);

    /**
     * Lấy dự án mà user đang hoạt động (chưa rời)
     */
    List<ProjectMember> findByUserIdAndLeftAtIsNull(Long userId);

    /**
     * Tìm bản ghi cụ thể theo projectId và userId
     */
    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    /**
     * Kiểm tra user có trong dự án không (chưa rời)
     */
    boolean existsByProjectIdAndUserIdAndLeftAtIsNull(Long projectId, Long userId);

    /**
     * Lấy danh sách thành viên của dự án kèm thông tin user và department (JOIN để lấy thêm)
     * Đây là native query để lấy thêm field từ user và department
     */
    @Query(value = "SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.joined_at, pm.left_at, " +
            "u.name AS user_name, u.email, u.position, u.department_id, d.name AS department_name, u.role AS user_role " +
            "FROM project_members pm " +
            "JOIN users u ON pm.user_id = u.id " +
            "LEFT JOIN departments d ON u.department_id = d.id " +
            "WHERE pm.project_id = :projectId " +
            "ORDER BY pm.left_at IS NULL DESC, u.name ASC",
            nativeQuery = true)
    List<Object[]> findProjectMembersWithUserInfo(@Param("projectId") Long projectId);

    /**
     * Lấy danh sách dự án mà user tham gia kèm thông tin project
     */
    @Query(value = "SELECT pm.id, pm.project_id, pm.role, pm.joined_at, pm.left_at, " +
            "p.code AS project_code, p.name AS project_name, p.status AS project_status " +
            "FROM project_members pm " +
            "JOIN projects p ON pm.project_id = p.id " +
            "WHERE pm.user_id = :userId " +
            "ORDER BY pm.left_at IS NULL DESC, p.name ASC",
            nativeQuery = true)
    List<Object[]> findProjectsByUser(@Param("userId") Long userId);
}