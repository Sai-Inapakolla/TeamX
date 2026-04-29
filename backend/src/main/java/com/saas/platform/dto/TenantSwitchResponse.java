package com.saas.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSwitchResponse {
    private String accessToken;
    private String refreshToken;
    private Long tenantId;
    private String tenantName;
    private String role;
}
