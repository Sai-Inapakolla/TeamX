package com.saas.platform.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDTO {
    private Long id;
    private String name;
    private String description;
    private Long ownerId;
    private String status;
    private String createdAt;
    private String updatedAt;
}
