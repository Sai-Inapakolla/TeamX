package com.saas.platform.repository;

import com.saas.platform.entity.UserTenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTenantRepository extends JpaRepository<UserTenant, Long> {

    List<UserTenant> findByUserId(Long userId);

    List<UserTenant> findByTenantId(Long tenantId);

    Optional<UserTenant> findByUserIdAndTenantId(Long userId, Long tenantId);

    @Query("SELECT CASE WHEN COUNT(ut) > 0 THEN true ELSE false END " +
            "FROM UserTenant ut WHERE ut.userId = :userId AND ut.tenantId = :tenantId")
    boolean userBelongsToTenant(@Param("userId") Long userId, @Param("tenantId") Long tenantId);
}
