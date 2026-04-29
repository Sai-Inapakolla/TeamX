package com.saas.platform.repository;

import com.saas.platform.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByTenantIdAndProjectId(Long tenantId, Long projectId);

    List<Task> findAllByTenantId(Long tenantId);

    Optional<Task> findByIdAndTenantId(Long id, Long tenantId);

    List<Task> findByTenantIdAndAssignedTo(Long tenantId, Long assignedTo);
}
