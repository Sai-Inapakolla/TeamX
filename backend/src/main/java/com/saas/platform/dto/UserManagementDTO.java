package com.saas.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
    private String joinedAt;
    private String inviteUrl;
}
