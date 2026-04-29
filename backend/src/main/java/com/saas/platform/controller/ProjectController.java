package com.saas.platform.controller;

import com.saas.platform.dto.ProjectDTO;
import com.saas.platform.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public ResponseEntity<List<ProjectDTO>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PROJECT_READ')")
    public ResponseEntity<ProjectDTO> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PROJECT_WRITE')")
    public ResponseEntity<ProjectDTO> createProject(@RequestBody ProjectDTO dto) {
        return ResponseEntity.ok(projectService.createProject(dto));
    }
}
