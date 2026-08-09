package com.saas.platform.controller;

import com.saas.platform.dto.InviteUserRequest;
import com.saas.platform.dto.UpdateUserRoleRequest;
import com.saas.platform.dto.UserManagementDTO;
import com.saas.platform.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<List<UserManagementDTO>> getUsers() {
        return ResponseEntity.ok(userManagementService.listUsers());
    }

    @PostMapping("/invite")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<UserManagementDTO> inviteUser(@Valid @RequestBody InviteUserRequest request) {
        return ResponseEntity.ok(userManagementService.inviteUser(request));
    }

    @PutMapping("/{userId}/role")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<UserManagementDTO> updateUserRole(@PathVariable Long userId, @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(userManagementService.updateUserRole(userId, request));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userManagementService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}