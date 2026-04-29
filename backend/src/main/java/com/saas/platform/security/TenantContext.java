package com.saas.platform.security;

public class TenantContext {
    
    private static final ThreadLocal<Long> currentTenant = new ThreadLocal<>();
    
    public static void setCurrentTenantId(Long tenantId) {
        currentTenant.set(tenantId);
    }
    
    public static Long getCurrentTenantId() {
        Long tenantId = currentTenant.get();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant context available");
        }
        return tenantId;
    }
    
    public static Long getCurrentTenantIdOrNull() {
        return currentTenant.get();
    }
    
    public static void clear() {
        currentTenant.remove();
    }
}
