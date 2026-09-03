package com.mep.mepbackend.controller;

import com.mep.mepbackend.dto.TeamDTO;
import com.mep.mepbackend.dto.TeamMemberDTO;
import com.mep.mepbackend.entity.Team;
import com.mep.mepbackend.entity.TeamMember;
import com.mep.mepbackend.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST API cho Team (đội/nhóm)
 */
@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    // ===== CRUD TEAM =====

    @GetMapping
    public List<TeamDTO> getAll() {
        return teamService.getAllDTO();
    }

    @GetMapping("/{id}")
    public Team getById(@PathVariable Long id) {
        return teamService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Team create(@RequestBody Team team) {
        return teamService.create(team);
    }

    @PutMapping("/{id}")
    public Team update(@PathVariable Long id, @RequestBody Team team) {
        return teamService.update(id, team);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        teamService.delete(id);
    }

    // ===== QUẢN LÝ THÀNH VIÊN =====

    /**
     * Lấy danh sách thành viên đang hoạt động của team
     */
    @GetMapping("/{teamId}/members")
    public List<TeamMemberDTO> getMembers(@PathVariable Long teamId) {
        List<TeamMember> members = teamService.getActiveMembersByTeamId(teamId);
        return members.stream()
                .map(teamService::convertMemberToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả thành viên (kể cả đã rời) của team
     */
    @GetMapping("/{teamId}/members/all")
    public List<TeamMemberDTO> getAllMembers(@PathVariable Long teamId) {
        List<TeamMember> members = teamService.getMembersByTeamId(teamId);
        return members.stream()
                .map(teamService::convertMemberToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Thêm thành viên vào team
     */
    @PostMapping("/{teamId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public TeamMember addMember(
            @PathVariable Long teamId,
            @RequestParam Long userId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate joinedAt) {
        return teamService.addMember(teamId, userId, role, joinedAt);
    }

    /**
     * Xóa thành viên khỏi team (set left_at)
     */
    @DeleteMapping("/{teamId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable Long teamId,
            @PathVariable Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate leftAt) {
        teamService.removeMember(teamId, userId, leftAt);
    }
}