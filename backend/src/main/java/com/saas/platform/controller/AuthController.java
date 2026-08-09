package com.saas.platform.controller;

import com.saas.platform.dto.LoginRequest;
import com.saas.platform.dto.LoginResponse;
import com.saas.platform.dto.ResetPasswordRequest;
import com.saas.platform.dto.TenantSwitchRequest;
import com.saas.platform.dto.TenantSwitchResponse;
import com.saas.platform.dto.RegisterRequest;
import com.saas.platform.dto.AcceptInviteRequest;
import com.saas.platform.service.AuthService;
import jakarta.validation.Valid;
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
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tenant-switch")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TenantSwitchResponse> switchTenant(@RequestBody TenantSwitchRequest request) {
        TenantSwitchResponse response = authService.switchTenant(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/accept-invite")
    public ResponseEntity<LoginResponse> acceptInvite(@Valid @RequestBody AcceptInviteRequest request) {
        LoginResponse response = authService.acceptInvite(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody java.util.Map<String, Object> body) {
        String refreshToken = (String) body.get("refreshToken");
        Long tenantId = body.get("tenantId") != null ? ((Number) body.get("tenantId")).longValue() : null;
        LoginResponse response = authService.refreshAccessToken(refreshToken, tenantId);
        return ResponseEntity.ok(response);
    }
}
