package com.saas.platform.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private UserInfo user;
    private List<TenantInfo> tenants;
    private boolean requiresTenantSelection;
    private TenantInfo activeTenant;

    @Data
    @Builder
    public static class UserInfo {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
    }

    @Data
    @Builder
    public static class TenantInfo {
        private Long id;
        private String name;
        private String role;
        private String status;
        private String subdomain;
    }
}
