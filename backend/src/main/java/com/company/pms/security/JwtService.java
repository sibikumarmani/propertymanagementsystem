package com.company.pms.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;
    private final long companySelectionExpirationMs;

    public JwtService(
        @Value("${security.jwt.secret}") String secret,
        @Value("${security.jwt.access-token-expiration-ms}") long accessTokenExpirationMs,
        @Value("${security.jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs
    ) {
        byte[] keyBytes = secret.startsWith("base64:")
            ? Decoders.BASE64.decode(secret.substring(7))
            : secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.companySelectionExpirationMs = 10 * 60 * 1000;
    }

    public String generateAccessToken(Long userId, String subject, List<String> roles, List<String> menuAccessKeys, Long companyId, String companyName) {
        return buildSessionToken(userId, subject, roles, menuAccessKeys, companyId, companyName, accessTokenExpirationMs, "access");
    }

    public String generateRefreshToken(Long userId, String subject, List<String> roles, List<String> menuAccessKeys, Long companyId, String companyName) {
        return buildSessionToken(userId, subject, roles, menuAccessKeys, companyId, companyName, refreshTokenExpirationMs, "refresh");
    }

    public String generateCompanySelectionToken(Long userId, String subject, List<String> roles, List<Long> allowedCompanyIds) {
        Date now = new Date();
        return Jwts.builder()
            .subject(subject)
            .claim("userId", userId)
            .claim("roles", roles)
            .claim("allowedCompanyIds", allowedCompanyIds)
            .claim("tokenUse", "company-selection")
            .issuedAt(now)
            .expiration(new Date(now.getTime() + companySelectionExpirationMs))
            .signWith(key)
            .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Object value = extractAllClaims(token).get("userId");
        return value instanceof Number number ? number.longValue() : null;
    }

    public List<String> extractRoles(String token) {
        Object value = extractAllClaims(token).get("roles");
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    public List<String> extractMenuAccessKeys(String token) {
        Object value = extractAllClaims(token).get("menuAccessKeys");
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    public Long extractCompanyId(String token) {
        Object value = extractAllClaims(token).get("companyId");
        return value instanceof Number number ? number.longValue() : null;
    }

    public String extractCompanyName(String token) {
        Object value = extractAllClaims(token).get("companyName");
        return value == null ? null : String.valueOf(value);
    }

    public List<Long> extractAllowedCompanyIds(String token) {
        Object value = extractAllClaims(token).get("allowedCompanyIds");
        if (value instanceof List<?> list) {
            return list.stream()
                .filter(Number.class::isInstance)
                .map(Number.class::cast)
                .map(Number::longValue)
                .toList();
        }
        return List.of();
    }

    public boolean isCompanySelectionToken(String token) {
        Object value = extractAllClaims(token).get("tokenUse");
        return "company-selection".equals(value);
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    private String buildSessionToken(
        Long userId,
        String subject,
        List<String> roles,
        List<String> menuAccessKeys,
        Long companyId,
        String companyName,
        long expirationMs,
        String tokenUse
    ) {
        Date now = new Date();
        return Jwts.builder()
            .subject(subject)
            .claim("userId", userId)
            .claim("roles", roles)
            .claim("menuAccessKeys", menuAccessKeys)
            .claim("companyId", companyId)
            .claim("companyName", companyName)
            .claim("tokenUse", tokenUse)
            .issuedAt(now)
            .expiration(new Date(now.getTime() + expirationMs))
            .signWith(key)
            .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
