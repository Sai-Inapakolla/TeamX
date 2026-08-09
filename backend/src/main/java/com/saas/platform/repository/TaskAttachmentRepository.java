package com.saas.platform.repository;

import com.saas.platform.entity.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {
    List<TaskAttachment> findAllByTenantIdAndTaskIdOrderByCreatedAtDesc(Long tenantId, Long taskId);

    Optional<TaskAttachment> findByIdAndTenantIdAndTaskId(Long id, Long tenantId, Long taskId);

    Optional<TaskAttachment> findByIdAndTenantId(Long id, Long tenantId);
}