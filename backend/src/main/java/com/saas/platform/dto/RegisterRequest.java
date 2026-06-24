package com.saas.platform.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    private String orgName;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
}
