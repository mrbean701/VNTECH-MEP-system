package com.mep.mepbackend.service;

import com.mep.mepbackend.dto.TeamDTO;
import com.mep.mepbackend.dto.TeamMemberDTO;
import com.mep.mepbackend.entity.Team;
import com.mep.mepbackend.entity.TeamMember;
import com.mep.mepbackend.entity.User;
import com.mep.mepbackend.exception.ResourceNotFoundException;
import com.mep.mepbackend.repository.TeamMemberRepository;
import com.mep.mepbackend.repository.TeamRepository;
import com.mep.mepbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service quản lý Team (đội/nhóm)
 * - CRUD team
 * - Quản lý thành viên trong team (thêm, xóa, lấy danh sách)
 */
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    // ===== CRUD TEAM =====

    /**
     * Lấy tất cả team
     */
    public List<Team> getAll() {
        return teamRepository.findAll();
    }

    /**
     * Lấy tất cả team dưới dạng DTO (có kèm số lượng thành viên)
     */
    public List<TeamDTO> getAllDTO() {
        List<Team> teams = teamRepository.findAll();
        List<TeamDTO> dtos = new ArrayList<>();
        for (Team team : teams) {
            dtos.add(convertToDTO(team));
        }
        return dtos;
    }

    /**
     * Lấy team theo ID
     */
    public Team getById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team không tồn tại với id: " + id));
    }

    /**
     * Tạo team mới
     */
    @Transactional
    public Team create(Team team) {
        if (teamRepository.existsByNameIgnoreCase(team.getName())) {
            throw new RuntimeException("Tên team đã tồn tại");
        }
        team.setCreatedAt(LocalDate.now());
        team.setUpdatedAt(LocalDate.now());
        Team saved = teamRepository.save(team);
        auditLogService.log("CREATE", "TEAM", String.valueOf(saved.getId()),
                "Tạo team " + saved.getName(), null);
        return saved;
    }

    /**
     * Cập nhật team
     */
    @Transactional
    public Team update(Long id, Team details) {
        Team team = getById(id);
        // Kiểm tra tên trùng (nếu thay đổi tên)
        if (details.getName() != null && !details.getName().equals(team.getName())
                && teamRepository.existsByNameIgnoreCase(details.getName())) {
            throw new RuntimeException("Tên team đã tồn tại");
        }
        if (details.getName() != null) team.setName(details.getName());
        if (details.getDescription() != null) team.setDescription(details.getDescription());
        team.setUpdatedAt(LocalDate.now());
        Team saved = teamRepository.save(team);
        auditLogService.log("UPDATE", "TEAM", String.valueOf(id),
                "Cập nhật team " + saved.getName(), null);
        return saved;
    }

    /**
     * Xóa team (cascade xóa tất cả team_members)
     */
    @Transactional
    public void delete(Long id) {
        Team team = getById(id);
        teamRepository.delete(team);
        auditLogService.log("DELETE", "TEAM", String.valueOf(id),
                "Xóa team " + team.getName(), null);
    }

    // ===== QUẢN LÝ THÀNH VIÊN =====

    /**
     * Lấy tất cả thành viên của một team (kể cả đã rời)
     */
    public List<TeamMember> getMembersByTeamId(Long teamId) {
        // Kiểm tra team tồn tại
        getById(teamId);
        return teamMemberRepository.findByTeamId(teamId);
    }

    /**
     * Lấy thành viên đang hoạt động (chưa rời) của một team
     */
    public List<TeamMember> getActiveMembersByTeamId(Long teamId) {
        getById(teamId);
        return teamMemberRepository.findByTeamIdAndLeftAtIsNull(teamId);
    }

    /**
     * Lấy danh sách team mà user tham gia (đang hoạt động)
     */
    public List<TeamMember> getTeamsByUserId(Long userId) {
        return teamMemberRepository.findByUserIdAndLeftAtIsNull(userId);
    }

    /**
     * Thêm thành viên vào team
     */
    @Transactional
    public TeamMember addMember(Long teamId, Long userId, String role, LocalDate joinedAt) {
        Team team = getById(teamId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        // Kiểm tra user đã là thành viên của team này chưa (chưa rời)
        if (teamMemberRepository.existsByTeamIdAndUserIdAndLeftAtIsNull(teamId, userId)) {
            throw new RuntimeException("User đã là thành viên của team này");
        }

        // Nếu đã từng là thành viên và đã rời, cho phép thêm lại (tạo mới bản ghi)
        // Hoặc có thể update left_at = null. Ở đây tôi tạo mới bản ghi để giữ lịch sử.
        TeamMember member = new TeamMember();
        member.setTeamId(teamId);
        member.setUserId(userId);
        member.setRole(role != null ? role : "Thành viên");
        member.setJoinedAt(joinedAt != null ? joinedAt : LocalDate.now());
        member.setLeftAt(null);
        member.setCreatedAt(LocalDate.now());
        member.setUpdatedAt(LocalDate.now());

        TeamMember saved = teamMemberRepository.save(member);
        auditLogService.log("CREATE", "TEAM_MEMBER", String.valueOf(saved.getId()),
                "Thêm user " + user.getName() + " vào team " + team.getName(), null);
        return saved;
    }

    /**
     * Xóa thành viên khỏi team (set left_at)
     */
    @Transactional
    public TeamMember removeMember(Long teamId, Long userId, LocalDate leftAt) {
        Team team = getById(teamId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không thuộc team này"));

        if (member.getLeftAt() != null) {
            throw new RuntimeException("User đã rời team trước đó");
        }

        member.setLeftAt(leftAt != null ? leftAt : LocalDate.now());
        member.setUpdatedAt(LocalDate.now());
        TeamMember saved = teamMemberRepository.save(member);
        auditLogService.log("UPDATE", "TEAM_MEMBER", String.valueOf(saved.getId()),
                "User " + user.getName() + " rời team " + team.getName(), null);
        return saved;
    }

    // ===== HELPER =====

    /**
     * Chuyển Team sang TeamDTO
     */
    public TeamDTO convertToDTO(Team team) {
        TeamDTO dto = new TeamDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setDescription(team.getDescription());
        dto.setCreatedAt(team.getCreatedAt());
        dto.setUpdatedAt(team.getUpdatedAt());

        // Lấy số lượng thành viên
        List<TeamMember> activeMembers = teamMemberRepository.findByTeamIdAndLeftAtIsNull(team.getId());
        List<TeamMember> allMembers = teamMemberRepository.findByTeamId(team.getId());
        dto.setMemberCount(activeMembers.size());
        dto.setTotalMemberCount(allMembers.size());

        return dto;
    }

    /**
     * Chuyển TeamMember sang TeamMemberDTO (có thêm thông tin user)
     */
    public TeamMemberDTO convertMemberToDTO(TeamMember member) {
        TeamMemberDTO dto = new TeamMemberDTO();
        dto.setId(member.getId());
        dto.setTeamId(member.getTeamId());
        dto.setUserId(member.getUserId());
        dto.setRole(member.getRole());
        dto.setJoinedAt(member.getJoinedAt());
        dto.setLeftAt(member.getLeftAt());

        // Lấy thông tin user
        userRepository.findById(member.getUserId()).ifPresent(user -> {
            dto.setUserName(user.getName());
            dto.setUserEmail(user.getEmail());
            dto.setUserPosition(user.getPosition());
        });

        return dto;
    }
}