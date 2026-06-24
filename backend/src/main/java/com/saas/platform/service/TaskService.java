package com.saas.platform.service;

import com.saas.platform.dto.TaskDTO;
import com.saas.platform.entity.Task;
import com.saas.platform.repository.TaskRepository;
import com.saas.platform.security.SecurityUtils;
import com.saas.platform.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('TASK_READ')")
    public List<TaskDTO> getTasksByProject(Long projectId) {
        Long tenantId = TenantContext.getCurrentTenantId();
        return taskRepository.findAllByTenantIdAndProjectId(tenantId, projectId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @SuppressWarnings("null")
    @PreAuthorize("hasAuthority('TASK_WRITE')")
    public TaskDTO createTask(TaskDTO dto) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Task task = Task.builder()
                .projectId(dto.getProjectId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .assignedTo(dto.getAssignedTo())
                .status(Task.TaskStatus.valueOf(dto.getStatus() != null ? dto.getStatus() : "TODO"))
                .priority(Task.Priority.valueOf(dto.getPriority() != null ? dto.getPriority() : "MEDIUM"))
                .dueDate(parseDueDate(dto.getDueDate()))
            .createdBy(currentUserId)
                .build();

        task = Objects.requireNonNull(taskRepository.save(task));
        return toDTO(task);
    }

    @Transactional
    @PreAuthorize("hasAuthority('TASK_WRITE')")
    public TaskDTO updateTask(Long projectId, Long taskId, TaskDTO dto) {
        Long tenantId = TenantContext.getCurrentTenantId();
        Task task = taskRepository.findByIdAndTenantIdAndProjectId(taskId, tenantId, projectId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (dto.getTitle() != null) task.setTitle(dto.getTitle());
        if (dto.getDescription() != null) task.setDescription(dto.getDescription());
        if (dto.getStatus() != null) task.setStatus(Task.TaskStatus.valueOf(dto.getStatus()));
        if (dto.getPriority() != null) task.setPriority(Task.Priority.valueOf(dto.getPriority()));
        if (dto.getAssignedTo() != null) task.setAssignedTo(dto.getAssignedTo());
        if (dto.getDueDate() != null) task.setDueDate(parseDueDate(dto.getDueDate()));

        task = taskRepository.save(task);
        return toDTO(task);
    }

    private LocalDate parseDueDate(String dueDate) {
        if (dueDate == null || dueDate.isBlank()) {
            return null;
        }
        return LocalDate.parse(dueDate);
    }

    private TaskDTO toDTO(Task task) {
        return TaskDTO.builder()
                .id(task.getId())
                .projectId(task.getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .assignedTo(task.getAssignedTo())
                .status(task.getStatus().name())
                .priority(task.getPriority().name())
                .dueDate(task.getDueDate() != null ? task.getDueDate().toString() : null)
                .createdAt(task.getCreatedAt() != null ? task.getCreatedAt().toString() : null)
                .updatedAt(task.getUpdatedAt() != null ? task.getUpdatedAt().toString() : null)
                .build();
    }
}
