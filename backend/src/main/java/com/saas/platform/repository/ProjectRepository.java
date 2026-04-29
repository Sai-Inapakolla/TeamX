package com.saas.platform.repository;

import com.saas.platform.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByTenantId(Long tenantId);

    Optional<Project> findByIdAndTenantId(Long id, Long tenantId);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.tenantId = :tenantId")
    long countByTenantId(@Param("tenantId") Long tenantId);

    List<Project> findByTenantIdAndStatus(Long tenantId, Project.ProjectStatus status);
}
