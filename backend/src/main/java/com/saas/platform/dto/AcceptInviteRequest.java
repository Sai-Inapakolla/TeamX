package com.saas.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcceptInviteRequest {
    @NotBlank(message = "Token is required")
    private String token;

    // Optional because the user might already exist and just accepting invite.
    private String name;
    
    // Optional because the user might already exist.
    private String password;
}
