package com.saas.platform.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long userId, String email, Long tenantId,
            String tenantName, String role, List<String> permissions) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("tenant_id", tenantId)
                .claim("tenant_name", tenantName)
                .claim("role", role)
                .claim("permissions", permissions)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpiration);

        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public Long getTenantIdFromToken(String token) {
        Claims claims = getClaims(token);
        Object tenantIdObj = claims.get("tenant_id");
        if (tenantIdObj instanceof Integer) {
            return ((Integer) tenantIdObj).longValue();
        }
        return (Long) tenantIdObj;
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    @SuppressWarnings("unchecked")
    public List<String> getPermissionsFromToken(String token) {
        Claims claims = getClaims(token);
        Object permissions = claims.get("permissions");
        if (permissions instanceof List<?>) {
            return (List<String>) permissions;
        }
        return Collections.emptyList();
    }

    public String getRoleFromToken(String token) {
        Claims claims = getClaims(token);
        return (String) claims.get("role");
    }

    public boolean validateToken(String authToken) {
        try {
            getClaims(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
