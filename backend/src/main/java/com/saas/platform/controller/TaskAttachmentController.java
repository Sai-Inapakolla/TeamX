package com.saas.platform.controller;

import com.saas.platform.dto.TaskAttachmentDTO;
import com.saas.platform.service.TaskAttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/tasks/{taskId}/attachments")
@RequiredArgsConstructor
public class TaskAttachmentController {

    private final TaskAttachmentService taskAttachmentService;

    @GetMapping
    @PreAuthorize("hasAuthority('TICKET_ATTACHMENT_READ') or hasAuthority('TASK_READ')")
    public ResponseEntity<List<TaskAttachmentDTO>> listAttachments(@PathVariable Long projectId, @PathVariable Long taskId) {
        return ResponseEntity.ok(taskAttachmentService.listAttachments(projectId, taskId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('TICKET_ATTACHMENT_UPLOAD') or hasAuthority('TASK_WRITE')")
    public ResponseEntity<TaskAttachmentDTO> uploadAttachment(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(taskAttachmentService.uploadAttachment(projectId, taskId, file));
    }

    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasAuthority('TICKET_ATTACHMENT_UPLOAD') or hasAuthority('TASK_WRITE')")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @PathVariable Long attachmentId) {
        taskAttachmentService.deleteAttachment(projectId, taskId, attachmentId);
        return ResponseEntity.noContent().build();
    }
}