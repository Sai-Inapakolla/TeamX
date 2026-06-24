package com.saas.platform.controller;

import com.saas.platform.dto.TaskDTO;
import com.saas.platform.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @PreAuthorize("hasAuthority('TASK_READ')")
    public ResponseEntity<List<TaskDTO>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('TASK_WRITE')")
    public ResponseEntity<TaskDTO> createTask(@PathVariable Long projectId, @RequestBody TaskDTO dto) {
        dto.setProjectId(projectId);
        return ResponseEntity.ok(taskService.createTask(dto));
    }

    @PutMapping("/{taskId}")
    @PreAuthorize("hasAuthority('TASK_WRITE')")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable Long projectId, @PathVariable Long taskId, @RequestBody TaskDTO dto) {
        return ResponseEntity.ok(taskService.updateTask(projectId, taskId, dto));
    }
}
