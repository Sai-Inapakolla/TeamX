package com.saas.platform.service;

import com.saas.platform.dto.TaskDTO;
import com.saas.platform.entity.Task;
import com.saas.platform.entity.UserTenant;
import com.saas.platform.repository.TaskRepository;
import com.saas.platform.repository.UserTenantRepository;
import com.saas.platform.security.SecurityUtils;
import com.saas.platform.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserTenantRepository userTenantRepository;

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
        Long tenantId = TenantContext.getCurrentTenantId();

        UserTenant currentMembership = userTenantRepository.findByUserIdAndTenantId(currentUserId, tenantId).orElse(null);
        if (currentMembership != null && currentMembership.getRole() == UserTenant.Role.USER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employees cannot create or assign tasks. They can only update completion status.");
        }

        if (dto.getAssignedTo() != null) {
            validateTaskAssignment(currentUserId, tenantId, dto.getAssignedTo());
        }

        Task task = Task.builder()
                .projectId(dto.getProjectId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .assignedTo(dto.getAssignedTo())
                .status(parseStatus(dto.getStatus(), "TODO"))
                .priority(parsePriority(dto.getPriority(), "MEDIUM"))
                .dueDate(parseDueDate(dto.getDueDate()))
                .createdBy(currentUserId)
                .build();

        task = Objects.requireNonNull(taskRepository.save(task));
        return toDTO(task);
    }

    @Transactional
    @PreAuthorize("hasAuthority('TASK_READ')")
    public TaskDTO updateTask(Long projectId, Long taskId, TaskDTO dto) {
        Long tenantId = TenantContext.getCurrentTenantId();
        Long currentUserId = SecurityUtils.getCurrentUserId();

        Task task = taskRepository.findByIdAndTenantIdAndProjectId(taskId, tenantId, projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        UserTenant currentMembership = userTenantRepository.findByUserIdAndTenantId(currentUserId, tenantId).orElse(null);

        // Employee rule: Employee can only update task completion status
        if (currentMembership != null && currentMembership.getRole() == UserTenant.Role.USER) {
            if (dto.getStatus() != null) {
                task.setStatus(parseStatus(dto.getStatus(), null));
            }
        } else {
            // Admins & Managers can update other fields with assignment rules
            if (dto.getTitle() != null) task.setTitle(dto.getTitle());
            if (dto.getDescription() != null) task.setDescription(dto.getDescription());
            if (dto.getStatus() != null) task.setStatus(parseStatus(dto.getStatus(), null));
            if (dto.getPriority() != null) task.setPriority(parsePriority(dto.getPriority(), null));
            if (dto.getDueDate() != null) task.setDueDate(parseDueDate(dto.getDueDate()));

            if (dto.getAssignedTo() != null) {
                validateTaskAssignment(currentUserId, tenantId, dto.getAssignedTo());
                task.setAssignedTo(dto.getAssignedTo());
            }
        }

        task = taskRepository.save(task);
        return toDTO(task);
    }

    private void validateTaskAssignment(Long currentUserId, Long tenantId, Long assignedToUserId) {
        if (assignedToUserId == null) return;

        UserTenant currentMembership = userTenantRepository.findByUserIdAndTenantId(currentUserId, tenantId).orElse(null);
        UserTenant targetMembership = userTenantRepository.findByUserIdAndTenantId(assignedToUserId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned user does not belong to this organization"));

        if (currentMembership != null) {
            // Rule 1: Employee cannot assign tasks
            if (currentMembership.getRole() == UserTenant.Role.USER) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employees cannot assign tasks");
            }

            // Rule 2: Manager can ONLY assign tasks to Employees
            if (currentMembership.getRole() == UserTenant.Role.MANAGER) {
                if (targetMembership.getRole() != UserTenant.Role.USER) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Managers can assign tasks to Employees only (cannot assign to Admins or Managers)");
                }
            }

            // Rule 3: Admin / Owner can assign tasks to anyone
        }
    }

    private LocalDate parseDueDate(String dueDate) {
        if (dueDate == null || dueDate.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(dueDate);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid due date format: " + dueDate);
        }
    }

    private Task.TaskStatus parseStatus(String status, String defaultValue) {
        String value = (status != null && !status.isBlank()) ? status.trim().toUpperCase(Locale.ROOT) : defaultValue;
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }
        try {
            return Task.TaskStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid task status: " + status);
        }
    }

    private Task.Priority parsePriority(String priority, String defaultValue) {
        String value = (priority != null && !priority.isBlank()) ? priority.trim().toUpperCase(Locale.ROOT) : defaultValue;
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Priority is required");
        }
        try {
            return Task.Priority.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid task priority: " + priority);
        }
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
