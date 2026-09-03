package com.mep.mepbackend.controller;

import com.mep.mepbackend.dto.ProjectMemberDetailDTO;
import com.mep.mepbackend.dto.ProjectMemberRequestDTO;
import com.mep.mepbackend.entity.ProjectMember;
import com.mep.mepbackend.service.ProjectMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST API cho ProjectMember (thành viên dự án)
 */
@RestController
@RequestMapping("/api/project-members")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    // ===== LẤY DANH SÁCH =====

    /**
     * Lấy danh sách thành viên của một dự án (có thể bao gồm cả user đã rời)
     * Query param: includeLeft = true/false (mặc định false - chỉ lấy active)
     */
    @GetMapping("/project/{projectId}")
    public List<ProjectMemberDetailDTO> getMembersByProject(
            @PathVariable Long projectId,
            @RequestParam(required = false, defaultValue = "false") Boolean includeLeft) {
        return projectMemberService.getProjectMembersDetail(projectId, includeLeft);
    }

    /**
     * Lấy danh sách dự án mà một user tham gia
     * Query param: includeLeft = true/false (mặc định false - chỉ lấy active)
     */
    @GetMapping("/user/{userId}")
    public List<ProjectMemberDetailDTO> getProjectsByUser(
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "false") Boolean includeLeft) {
        return projectMemberService.getProjectsByUserDetail(userId, includeLeft);
    }

    // ===== CRUD =====

    /**
     * Thêm thành viên vào dự án
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectMember addMember(@RequestBody ProjectMemberRequestDTO request) {
        // Request phải có projectId
        if (request.getProjectId() == null) {
            throw new IllegalArgumentException("projectId là bắt buộc");
        }
        return projectMemberService.addMember(request.getProjectId(), request);
    }

    /**

     * Cập nhật thông tin thành viên (vai trò, ngày tham gia)
     */
    @PutMapping("/{id}")
    public ProjectMember updateMember(@PathVariable Long id, @RequestBody ProjectMemberRequestDTO request) {
        return projectMemberService.updateMember(id, request);
    }
    /**
     * Đánh dấu user rời dự án (set left_at)
     */
    @PostMapping("/{id}/leave")
    @ResponseStatus(HttpStatus.OK)
    public ProjectMember leaveProject(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate leftAt) {
        return projectMemberService.leaveProject(id, leftAt);
    }

    /**
     * Xóa vĩnh viễn bản ghi (admin only)
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMember(@PathVariable Long id) {
        projectMemberService.deleteMember(id);
    }
}