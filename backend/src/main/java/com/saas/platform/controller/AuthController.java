package com.saas.platform.controller;

import com.saas.platform.dto.LoginRequest;
import com.saas.platform.dto.LoginResponse;
import com.saas.platform.dto.TenantSwitchRequest;
import com.saas.platform.dto.TenantSwitchResponse;
import com.saas.platform.dto.RegisterRequest;
import com.saas.platform.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tenant-switch")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TenantSwitchResponse> switchTenant(@RequestBody TenantSwitchRequest request) {
        TenantSwitchResponse response = authService.switchTenant(request);
        return ResponseEntity.ok(response);
    }
}
