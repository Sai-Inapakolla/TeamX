package com.saas.platform.service;

import com.saas.platform.dto.ProjectDTO;
import com.saas.platform.entity.Project;
import com.saas.platform.repository.ProjectRepository;
import com.saas.platform.security.SecurityUtils;
import com.saas.platform.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public List<ProjectDTO> getAllProjects() {
        Long tenantId = TenantContext.getCurrentTenantId();
        return projectRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public ProjectDTO getProjectById(Long id) {
        Long tenantId = TenantContext.getCurrentTenantId();
        Project project = projectRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        return toDTO(project);
    }

    @Transactional
    @PreAuthorize("hasAuthority('PROJECT_WRITE')")
    public ProjectDTO createProject(ProjectDTO dto) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Long tenantId = TenantContext.getCurrentTenantId();

        Project project = Project.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .ownerId(currentUserId)
                .status(parseStatus(dto.getStatus()))
                .createdBy(currentUserId)
                .build();
        project.setTenantId(tenantId);

        project = projectRepository.save(project);
        return toDTO(project);
    }

    private Project.ProjectStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return Project.ProjectStatus.ACTIVE;
        }
        try {
            return Project.ProjectStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid project status: " + status);
        }
    }

    private ProjectDTO toDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .ownerId(project.getOwnerId())
                .status(project.getStatus().name())
                .createdAt(project.getCreatedAt() != null ? project.getCreatedAt().toString() : null)
                .updatedAt(project.getUpdatedAt() != null ? project.getUpdatedAt().toString() : null)
                .build();
    }
}
