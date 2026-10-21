package com.saas.platform.service;

import com.saas.platform.dto.TenantDTO;
import com.saas.platform.entity.Tenant;
import com.saas.platform.repository.TenantRepository;
import com.saas.platform.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantDTO getCurrentTenant() {
        Long tenantId = TenantContext.getCurrentTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found"));

        return TenantDTO.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .subdomain(tenant.getSubdomain())
                .status(tenant.getStatus().name())
                .createdAt(tenant.getCreatedAt() != null ? tenant.getCreatedAt().toString() : null)
                .updatedAt(tenant.getUpdatedAt() != null ? tenant.getUpdatedAt().toString() : null)
                .build();
    }
}