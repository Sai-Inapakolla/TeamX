package com.saas.platform.controller;

import com.saas.platform.dto.TenantDTO;
import com.saas.platform.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tenant")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class TenantController {

    private final TenantService tenantService;

    @GetMapping("/current")
    public ResponseEntity<TenantDTO> getCurrentTenant() {
        return ResponseEntity.ok(tenantService.getCurrentTenant());
    }
}