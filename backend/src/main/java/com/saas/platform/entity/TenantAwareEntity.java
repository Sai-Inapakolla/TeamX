package com.saas.platform.entity;

import com.saas.platform.security.TenantContext;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class TenantAwareEntity {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private Long tenantId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.tenantId == null) {
            this.tenantId = TenantContext.getCurrentTenantId();
        }
    }

    @PostLoad
    public void postLoad() {
        Long currentTenant = TenantContext.getCurrentTenantIdOrNull();
        if (currentTenant != null && !currentTenant.equals(this.tenantId)) {
            throw new IllegalStateException("Tenant mismatch detected");
        }
    }
}
