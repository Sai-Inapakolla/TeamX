package com.saas.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDTO {
    private Long id;
    private String name;
    private String subdomain;
    private String status;
    private String createdAt;
    private String updatedAt;
}