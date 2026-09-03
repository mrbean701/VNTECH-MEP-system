package com.mep.mepbackend.service;

import com.mep.mepbackend.dto.ProjectMemberDetailDTO;
import com.mep.mepbackend.dto.ProjectMemberRequestDTO;
import com.mep.mepbackend.entity.ProjectMember;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.ProjectMemberRepository;
import com.mep.mepbackend.repository.ProjectRepository;
import com.mep.mepbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    // ===== GETTERS =====

    public List<ProjectMember> getActiveMembersByProjectId(Long projectId) {
        return projectMemberRepository.findByProjectIdAndLeftAtIsNull(projectId);
    }

    public List<ProjectMember> getAllMembersByProjectId(Long projectId) {
        return projectMemberRepository.findByProjectId(projectId);
    }

    public List<ProjectMember> getActiveProjectsByUserId(Long userId) {
        return projectMemberRepository.findByUserIdAndLeftAtIsNull(userId);
    }

    public List<ProjectMember> getAllProjectsByUserId(Long userId) {
        return projectMemberRepository.findByUserId(userId);
    }

    public ProjectMember getById(Long id) {
        return projectMemberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi thành viên dự án"));
    }

    // ===== CRUD =====

    @Transactional
    public ProjectMember addMember(Long projectId, ProjectMemberRequestDTO request) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Dự án không tồn tại");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        if (projectMemberRepository.existsByProjectIdAndUserIdAndLeftAtIsNull(projectId, request.getUserId())) {
            throw new RuntimeException("User đã tham gia dự án này");
        }

        ProjectMember member = new ProjectMember();
        member.setProjectId(projectId);
        member.setUserId(request.getUserId());
        member.setRole(request.getRole() != null ? request.getRole() : "Thành viên");
        member.setJoinedAt(request.getJoinedAt() != null ? request.getJoinedAt() : LocalDate.now());
        member.setLeftAt(null);
        member.setCreatedAt(LocalDate.now());
        member.setUpdatedAt(LocalDate.now());

        ProjectMember saved = projectMemberRepository.save(member);
        auditLogService.log("CREATE", "PROJECT_MEMBER", String.valueOf(saved.getId()),
                "Thêm user " + user.getName() + " vào dự án ID " + projectId, null);
        return saved;
    }

    @Transactional
    public ProjectMember updateMember(Long id, ProjectMemberRequestDTO request) {
        ProjectMember member = getById(id);
        if (request.getRole() != null) {
            member.setRole(request.getRole());
        }
        if (request.getJoinedAt() != null) {
            member.setJoinedAt(request.getJoinedAt());
        }
        member.setUpdatedAt(LocalDate.now());
        ProjectMember saved = projectMemberRepository.save(member);
        auditLogService.log("UPDATE", "PROJECT_MEMBER", String.valueOf(id),
                "Cập nhật thông tin thành viên dự án", null);
        return saved;
    }

    @Transactional
    public ProjectMember leaveProject(Long id, LocalDate leftAt) {
        ProjectMember member = getById(id);
        if (member.getLeftAt() != null) {
            throw new RuntimeException("User đã rời dự án trước đó");
        }
        member.setLeftAt(leftAt != null ? leftAt : LocalDate.now());
        member.setUpdatedAt(LocalDate.now());
        ProjectMember saved = projectMemberRepository.save(member);
        auditLogService.log("UPDATE", "PROJECT_MEMBER", String.valueOf(id),
                "User rời dự án", null);
        return saved;
    }

    @Transactional
    public void deleteMember(Long id) {
        ProjectMember member = getById(id);
        projectMemberRepository.delete(member);
        auditLogService.log("DELETE", "PROJECT_MEMBER", String.valueOf(id),
                "Xóa vĩnh viễn bản ghi thành viên dự án", null);
    }

    // ===== DTO CHI TIẾT (JOIN USER + DEPARTMENT) =====

    public List<ProjectMemberDetailDTO> getProjectMembersDetail(Long projectId, Boolean includeLeft) {
        List<Object[]> results = projectMemberRepository.findProjectMembersWithUserInfo(projectId);

        List<ProjectMemberDetailDTO> dtos = new ArrayList<>();
        for (Object[] row : results) {
            ProjectMemberDetailDTO dto = new ProjectMemberDetailDTO();
            int idx = 0;

            // ✅ Chuyển đổi an toàn từ Object sang kiểu dữ liệu
            dto.setId(toLong(row[idx++]));
            dto.setProjectId(toLong(row[idx++]));
            dto.setUserId(toLong(row[idx++]));
            dto.setRole((String) row[idx++]);
            dto.setJoinedAt(toLocalDate(row[idx++]));
            dto.setLeftAt(toLocalDate(row[idx++]));
            dto.setUserName((String) row[idx++]);
            dto.setUserEmail((String) row[idx++]);
            dto.setUserPosition((String) row[idx++]);
            dto.setDepartmentId(toLong(row[idx++]));
            dto.setDepartmentName((String) row[idx++]);
            dto.setUserRole((String) row[idx++]);

            dto.setIsActive(dto.getLeftAt() == null);

            // Nếu includeLeft = false, bỏ qua các bản ghi có leftAt != null
            if (includeLeft == null || !includeLeft) {
                if (dto.getLeftAt() != null) continue;
            }

            dtos.add(dto);
        }
        return dtos;
    }

    public List<ProjectMemberDetailDTO> getProjectsByUserDetail(Long userId, Boolean includeLeft) {
        List<Object[]> results = projectMemberRepository.findProjectsByUser(userId);

        List<ProjectMemberDetailDTO> dtos = new ArrayList<>();
        for (Object[] row : results) {
            ProjectMemberDetailDTO dto = new ProjectMemberDetailDTO();
            int idx = 0;

            dto.setId(toLong(row[idx++]));
            dto.setProjectId(toLong(row[idx++]));
            dto.setRole((String) row[idx++]);
            dto.setJoinedAt(toLocalDate(row[idx++]));
            dto.setLeftAt(toLocalDate(row[idx++]));
            dto.setProjectCode((String) row[idx++]);
            dto.setProjectName((String) row[idx++]);
            dto.setProjectStatus((String) row[idx++]);

            dto.setIsActive(dto.getLeftAt() == null);

            if (includeLeft == null || !includeLeft) {
                if (dto.getLeftAt() != null) continue;
            }

            dtos.add(dto);
        }
        return dtos;
    }

    // ===== HELPER CHUYỂN ĐỔI KIỂU DỮ LIỆU =====

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate) {
            return (LocalDate) value;
        }
        if (value instanceof java.sql.Date) {
            return ((java.sql.Date) value).toLocalDate();
        }
        if (value instanceof String) {
            try {
                return LocalDate.parse((String) value);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}