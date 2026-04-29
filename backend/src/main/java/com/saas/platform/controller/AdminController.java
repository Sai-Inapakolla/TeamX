package com.saas.platform.controller;

import com.saas.platform.dto.UserTenantAssignmentRequest;
import com.saas.platform.dto.UserTenantAssignmentResponse;
import com.saas.platform.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ORG_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/users/assign")
    public ResponseEntity<UserTenantAssignmentResponse> assignUserToTenant(@RequestBody UserTenantAssignmentRequest request) {
        UserTenantAssignmentResponse response = adminService.assignUserToTenant(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserTenantAssignmentResponse>> listTenantUsers() {
        List<UserTenantAssignmentResponse> users = adminService.listTenantUsers();
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> removeUserFromTenant(@PathVariable Long userId) {
        adminService.removeUserFromTenant(userId);
        return ResponseEntity.noContent().build();
    }
}
