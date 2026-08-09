package com.saas.platform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.saas.platform.dto.TaskAttachmentDTO;
import com.saas.platform.entity.Task;
import com.saas.platform.entity.TaskAttachment;
import com.saas.platform.repository.TaskAttachmentRepository;
import com.saas.platform.repository.TaskRepository;
import com.saas.platform.security.SecurityUtils;
import com.saas.platform.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.HashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskAttachmentService {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp");

    private final TaskRepository taskRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    @Transactional(readOnly = true)
    public List<TaskAttachmentDTO> listAttachments(Long projectId, Long taskId) {
        Long tenantId = TenantContext.getCurrentTenantId();
        assertTaskExists(tenantId, projectId, taskId);
        return taskAttachmentRepository.findAllByTenantIdAndTaskIdOrderByCreatedAtDesc(tenantId, taskId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public TaskAttachmentDTO uploadAttachment(Long projectId, Long taskId, MultipartFile file) {
        Long tenantId = TenantContext.getCurrentTenantId();
        assertTaskExists(tenantId, projectId, taskId);
        validateUpload(file);

        CloudinaryUploadResult uploadResult = uploadToCloudinary(file);

        TaskAttachment attachment = TaskAttachment.builder()
                .taskId(taskId)
                .originalFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : uploadResult.originalFilename())
                .storedFilename(uploadResult.publicId())
                .contentType(file.getContentType() != null ? file.getContentType() : uploadResult.contentType())
                .fileSize(uploadResult.bytes())
                .cloudinaryPublicId(uploadResult.publicId())
                .cloudinarySecureUrl(uploadResult.secureUrl())
                .uploadedBy(SecurityUtils.getCurrentUserId())
                .resourceType(uploadResult.resourceType())
                .build();

        try {
            return toDTO(taskAttachmentRepository.save(attachment));
        } catch (Exception e) {
            // Compensate: clean up the Cloudinary asset since DB save failed
            try {
                Cloudinary cloudinary = new Cloudinary(cloudinaryUrl);
                cloudinary.uploader().destroy(uploadResult.publicId(), ObjectUtils.asMap("resource_type", uploadResult.resourceType()));
            } catch (Exception cleanupEx) {
                log.error("Failed to clean up Cloudinary asset {} after DB save failure", uploadResult.publicId(), cleanupEx);
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save attachment");
        }
    }

    @Transactional
    public void deleteAttachment(Long projectId, Long taskId, Long attachmentId) {
        Long tenantId = TenantContext.getCurrentTenantId();
        assertTaskExists(tenantId, projectId, taskId);

        TaskAttachment attachment = taskAttachmentRepository.findByIdAndTenantIdAndTaskId(attachmentId, tenantId, taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));

        taskAttachmentRepository.delete(attachment);

        try {
            Cloudinary cloudinary = new Cloudinary(cloudinaryUrl);
            cloudinary.uploader().destroy(attachment.getCloudinaryPublicId(), ObjectUtils.asMap("resource_type", attachment.getResourceType()));
        } catch (IOException e) {
            log.error("Failed to delete Cloudinary asset {}", attachment.getCloudinaryPublicId(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cloudinary delete failed");
        } catch (RuntimeException e) {
            log.error("Failed to delete Cloudinary asset {}", attachment.getCloudinaryPublicId(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cloudinary delete failed");
        }
    }

    private void validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment file is required");
        }

        if (file.getSize() > 20L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment must be 20MB or smaller");
        }

        // Detect actual content type from file bytes rather than trusting client header
        String detectedType = detectContentType(file);
        if (detectedType == null || !ALLOWED_CONTENT_TYPES.contains(detectedType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF and common image files are supported");
        }
    }

    private String detectContentType(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = is.readNBytes(12);
            if (header.length < 4) {
                return null;
            }
            // PDF: starts with %PDF
            if (header.length >= 4 && header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46) {
                return "application/pdf";
            }
            // JPEG: starts with FF D8 FF
            if (header.length >= 3 && (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
                return "image/jpeg";
            }
            // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
            if (header.length >= 8
                    && (header[0] & 0xFF) == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                    && (header[4] & 0xFF) == 0x0D && (header[5] & 0xFF) == 0x0A && (header[6] & 0xFF) == 0x1A && (header[7] & 0xFF) == 0x0A) {
                return "image/png";
            }
            // GIF: starts with GIF87a or GIF89a
            if (header.length >= 6
                    && header[0] == 'G' && header[1] == 'I' && header[2] == 'F'
                    && header[3] == '8' && (header[4] == '7' || header[4] == '9') && header[5] == 'a') {
                return "image/gif";
            }
            // WebP: starts with RIFF....WEBP
            if (header.length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                    && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
                return "image/webp";
            }
            return null;
        } catch (IOException e) {
            return null;
        }
    }

    private Task assertTaskExists(Long tenantId, Long projectId, Long taskId) {
        return taskRepository.findByIdAndTenantIdAndProjectId(taskId, tenantId, projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private CloudinaryUploadResult uploadToCloudinary(MultipartFile file) {
        try {
            Cloudinary cloudinary = new Cloudinary(cloudinaryUrl);
            Map<String, Object> uploadOptions = new HashMap<>();
            uploadOptions.put("folder", "teamx/tickets");
            uploadOptions.put("resource_type", "auto");

            @SuppressWarnings("unchecked")
            Map<String, Object> response = cloudinary.uploader().upload(file.getBytes(), uploadOptions);

            return new CloudinaryUploadResult(
                    Objects.toString(response.get("public_id"), ""),
                    Objects.toString(response.get("secure_url"), ""),
                    Objects.toString(response.get("resource_type"), "auto"),
                    response.get("bytes") instanceof Number bytes ? bytes.longValue() : file.getSize(),
                    Objects.toString(response.get("content_type"), file.getContentType() != null ? file.getContentType() : "application/octet-stream"),
                    Objects.toString(response.get("original_filename"), stripExtension(file.getOriginalFilename())));
        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Attachment upload failed");
        } catch (RuntimeException e) {
            log.error("Cloudinary upload failed", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Attachment upload failed");
        }
    }

    private TaskAttachmentDTO toDTO(TaskAttachment attachment) {
        return TaskAttachmentDTO.builder()
                .id(attachment.getId())
                .taskId(attachment.getTaskId())
                .originalFilename(attachment.getOriginalFilename())
                .storedFilename(attachment.getStoredFilename())
                .contentType(attachment.getContentType())
                .fileSize(attachment.getFileSize())
                .cloudinaryPublicId(attachment.getCloudinaryPublicId())
                .cloudinarySecureUrl(attachment.getCloudinarySecureUrl())
                .uploadedBy(attachment.getUploadedBy())
                .resourceType(attachment.getResourceType())
                .createdAt(attachment.getCreatedAt() != null ? attachment.getCreatedAt().toString() : null)
                .build();
    }

    private String stripExtension(String filename) {
        if (filename == null || filename.isBlank()) {
            return "attachment";
        }
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
    }

    private record CloudinaryUploadResult(String publicId, String secureUrl, String resourceType, long bytes, String contentType, String originalFilename) {}
}