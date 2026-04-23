package com.bongashop.backend.auth.passwordreset.service;

import com.bongashop.backend.auth.passwordreset.entity.PasswordResetToken;
import com.bongashop.backend.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.bongashop.backend.shared.exception.BusinessException;
import com.bongashop.backend.user.entity.User;
import com.bongashop.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository tokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private MailerService mailerService;

    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(
                userRepository,
                tokenRepository,
                passwordEncoder,
                mailerService,
                "http://localhost:4200/",
                60
        );
    }

    @Test
    void requestReset_shouldGenerateTokenAndSendEmail_whenUserExistsAndActive() {
        User user = buildUser(10L, "nina@bonga.shop", true);
        when(userRepository.findByEmailIgnoreCase("nina@bonga.shop")).thenReturn(Optional.of(user));

        service.requestReset("  NINA@bonga.shop  ");

        verify(tokenRepository).invalidateActiveTokensForUser(eq(10L), any(Instant.class));

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        PasswordResetToken saved = tokenCaptor.getValue();
        assertThat(saved.getUser()).isSameAs(user);
        assertThat(saved.getTokenHash()).isNotBlank().hasSize(64);
        assertThat(saved.getExpiresAt()).isAfter(Instant.now());

        ArgumentCaptor<String> linkCaptor = ArgumentCaptor.forClass(String.class);
        verify(mailerService).sendPasswordResetEmail(
                eq("nina@bonga.shop"),
                eq("Nina"),
                linkCaptor.capture()
        );
        assertThat(linkCaptor.getValue()).startsWith("http://localhost:4200/restablecer?token=");
    }

    @Test
    void requestReset_shouldBeSilent_whenUserDoesNotExist() {
        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        service.requestReset("ghost@bonga.shop");

        verify(tokenRepository, never()).save(any());
        verify(mailerService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    void requestReset_shouldBeSilent_whenUserInactive() {
        User user = buildUser(11L, "inactive@bonga.shop", false);
        when(userRepository.findByEmailIgnoreCase("inactive@bonga.shop")).thenReturn(Optional.of(user));

        service.requestReset("inactive@bonga.shop");

        verify(tokenRepository, never()).save(any());
        verify(mailerService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    void requestReset_shouldBeSilent_whenEmailBlank() {
        service.requestReset("   ");

        verify(userRepository, never()).findByEmailIgnoreCase(anyString());
        verify(mailerService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    void confirmReset_shouldUpdatePasswordAndMarkTokenUsed() {
        String plainToken = "plain-token-for-tests";
        User user = buildUser(20L, "change@bonga.shop", true);
        PasswordResetToken token = buildToken(user, plainToken, Instant.now().plusSeconds(600), null);

        when(tokenRepository.findByTokenHash(sha256Hex(plainToken))).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NuevaClave123!")).thenReturn("ENCODED");

        service.confirmReset(plainToken, "NuevaClave123!");

        assertThat(user.getPassword()).isEqualTo("ENCODED");
        assertThat(token.getUsedAt()).isNotNull();
        verify(userRepository).save(user);
        verify(tokenRepository).save(token);
    }

    @Test
    void confirmReset_shouldFail_whenTokenUnknown() {
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.confirmReset("anything", "NuevaClave123!"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid or expired");
        verify(userRepository, never()).save(any());
    }

    @Test
    void confirmReset_shouldFail_whenTokenExpired() {
        String plainToken = "expired";
        User user = buildUser(21L, "expired@bonga.shop", true);
        PasswordResetToken token = buildToken(user, plainToken, Instant.now().minusSeconds(60), null);
        when(tokenRepository.findByTokenHash(sha256Hex(plainToken))).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.confirmReset(plainToken, "NuevaClave123!"))
                .isInstanceOf(BusinessException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void confirmReset_shouldFail_whenTokenAlreadyUsed() {
        String plainToken = "used";
        User user = buildUser(22L, "used@bonga.shop", true);
        PasswordResetToken token = buildToken(user, plainToken, Instant.now().plusSeconds(600), Instant.now());
        when(tokenRepository.findByTokenHash(sha256Hex(plainToken))).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.confirmReset(plainToken, "NuevaClave123!"))
                .isInstanceOf(BusinessException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void confirmReset_shouldFail_whenPasswordTooShort() {
        assertThatThrownBy(() -> service.confirmReset("any", "short"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("at least");
        verify(tokenRepository, never()).findByTokenHash(anyString());
    }

    @Test
    void confirmReset_shouldFail_whenUserInactive() {
        String plainToken = "inactive-user";
        User user = buildUser(23L, "inactive@bonga.shop", false);
        PasswordResetToken token = buildToken(user, plainToken, Instant.now().plusSeconds(600), null);
        when(tokenRepository.findByTokenHash(sha256Hex(plainToken))).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.confirmReset(plainToken, "NuevaClave123!"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Inactive");
        verify(userRepository, never()).save(any());
    }

    private User buildUser(long id, String email, boolean active) {
        User user = new User();
        setField(user, "id", id);
        user.setName(capitalize(email.substring(0, email.indexOf('@'))));
        user.setEmail(email);
        user.setPassword("OLD");
        user.setActive(active);
        return user;
    }

    private PasswordResetToken buildToken(User user, String plain, Instant expiresAt, Instant usedAt) {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash(sha256Hex(plain));
        token.setCreatedAt(Instant.now().minusSeconds(10));
        token.setExpiresAt(expiresAt);
        token.setUsedAt(usedAt);
        return token;
    }

    private static String capitalize(String value) {
        return value.substring(0, 1).toUpperCase() + value.substring(1);
    }

    private static String sha256Hex(String value) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static void setField(Object target, String name, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
