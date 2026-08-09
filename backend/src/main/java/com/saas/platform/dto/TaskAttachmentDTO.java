package com.saas.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskAttachmentDTO {
    private Long id;
    private Long taskId;
    private String originalFilename;
    private String storedFilename;
    private String contentType;
    private Long fileSize;
    private String cloudinaryPublicId;
    private String cloudinarySecureUrl;
    private Long uploadedBy;
    private String resourceType;
    private String createdAt;
}