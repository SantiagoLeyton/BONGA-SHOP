package com.bongashop.backend.auth.passwordreset.service;

import com.bongashop.backend.auth.passwordreset.entity.PasswordResetToken;
import com.bongashop.backend.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.bongashop.backend.shared.exception.BusinessException;
import com.bongashop.backend.user.entity.User;
import com.bongashop.backend.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Flujo de restablecimiento de contraseña basado en token de un solo uso,
 * con hash en base de datos y entrega por correo.
 *
 * Reglas de seguridad clave:
 *  - Nunca se revela si un correo existe (respuesta siempre 202 en request).
 *  - El token viaja únicamente al email del usuario; en BD solo queda su hash.
 *  - Token expira a la hora y se invalida tras un solo uso.
 *  - Cada nueva solicitud invalida tokens anteriores activos.
 */
@Service
public class PasswordResetService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_BYTES = 32;
    private static final Duration DEFAULT_TTL = Duration.ofHours(1);
    /** Longitud mínima igual a la exigida en RegisterRequest. */
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailerService mailerService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final String frontendUrl;
    private final Duration tokenTtl;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            MailerService mailerService,
            @Value("${app.frontend-url:http://localhost:4200}") String frontendUrl,
            @Value("${app.password-reset.ttl-minutes:60}") long ttlMinutes
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailerService = mailerService;
        this.frontendUrl = stripTrailingSlash(frontendUrl);
        this.tokenTtl = ttlMinutes > 0 ? Duration.ofMinutes(ttlMinutes) : DEFAULT_TTL;
    }

    @Transactional
    public void requestReset(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            return;
        }
        String email = rawEmail.trim().toLowerCase();

        Optional<User> maybeUser = userRepository.findByEmailIgnoreCase(email);
        if (maybeUser.isEmpty()) {
            LOGGER.info("Password reset requested for unknown email {} — silently ignored", email);
            return;
        }
        User user = maybeUser.get();
        if (!user.isActive()) {
            LOGGER.info("Password reset requested for inactive account {} — silently ignored", email);
            return;
        }

        Instant now = Instant.now();
        tokenRepository.invalidateActiveTokensForUser(user.getId(), now);

        String plainToken = generatePlainToken();
        String tokenHash = sha256Hex(plainToken);

        PasswordResetToken entity = new PasswordResetToken();
        entity.setUser(user);
        entity.setTokenHash(tokenHash);
        entity.setCreatedAt(now);
        entity.setExpiresAt(now.plus(tokenTtl));
        tokenRepository.save(entity);

        String resetLink = buildResetLink(plainToken);
        mailerService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);
    }

    @Transactional
    public void confirmReset(String plainToken, String newPassword) {
        if (plainToken == null || plainToken.isBlank()) {
            throw new BusinessException("Invalid or expired reset token");
        }
        if (newPassword == null || newPassword.length() < MIN_PASSWORD_LENGTH) {
            throw new BusinessException("Password must be at least " + MIN_PASSWORD_LENGTH + " characters long");
        }

        String tokenHash = sha256Hex(plainToken.trim());
        PasswordResetToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException("Invalid or expired reset token"));

        Instant now = Instant.now();
        if (token.isUsed() || token.isExpired(now)) {
            throw new BusinessException("Invalid or expired reset token");
        }

        User user = token.getUser();
        if (!user.isActive()) {
            throw new BusinessException("Inactive users cannot reset their password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsedAt(now);
        tokenRepository.save(token);

        LOGGER.info("Password reset completed for user id={}", user.getId());
    }

    private String generatePlainToken() {
        byte[] buffer = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 not available", exception);
        }
    }

    private String buildResetLink(String plainToken) {
        String encoded = URLEncoder.encode(plainToken, StandardCharsets.UTF_8);
        return frontendUrl + "/restablecer?token=" + encoded;
    }

    private static String stripTrailingSlash(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
