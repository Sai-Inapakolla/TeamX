package com.saas.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTenantAssignmentRequest {
    private Long userId;
    private Long tenantId;
    private String role;
}
