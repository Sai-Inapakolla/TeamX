package com.saas.platform.repository;

import com.saas.platform.entity.UserTenant;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class RolePermissionRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<String> findPermissionsByRole(UserTenant.Role role) {
        try {
            return jdbcTemplate.queryForList(
                    "SELECT permission_name FROM role_permissions WHERE role_name = ? ORDER BY permission_name",
                    String.class,
                    role.name());
        } catch (Exception e) {
            return List.of();
        }
    }
}
