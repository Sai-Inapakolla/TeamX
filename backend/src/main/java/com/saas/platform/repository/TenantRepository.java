package com.saas.platform.repository;

import com.saas.platform.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    List<Tenant> findByStatus(Tenant.TenantStatus status);

    boolean existsBySubdomain(String subdomain);
}
