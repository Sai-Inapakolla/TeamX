package com.saas.platform.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDTO {
    private Long id;
    private Long projectId;
    private String title;
    private String description;
    private Long assignedTo;
    private String status;
    private String priority;
    private String dueDate;
    private String createdAt;
    private String updatedAt;
}
