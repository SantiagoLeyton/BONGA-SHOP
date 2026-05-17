package com.bongashop.backend.config.security;

import com.bongashop.backend.config.properties.JwtProperties;
import com.bongashop.backend.role.entity.Role;
import com.bongashop.backend.shared.enums.RoleName;
import com.bongashop.backend.user.entity.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            new JwtProperties("change-this-secret-key-for-bonga-shop-please-2026", 60)
    );

    @Test
    void shouldGenerateAndValidateToken() {
        User user = new User();
        setField(user, "id", 99L);
        user.setName("Admin");
        user.setEmail("admin@bonga.shop");
        user.setPassword("encoded");
        user.setActive(true);
        user.setRole(new Role(RoleName.ROLE_ADMIN));

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtService.generateToken(userDetails);
        String role = jwtService.extractClaim(token, claims -> claims.get("role", String.class));

        assertThat(jwtService.extractUsername(token)).isEqualTo("admin@bonga.shop");
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
        assertThat(role).isEqualTo("ROLE_ADMIN");
    }

    private void setField(User user, String fieldName, Object value) {
        try {
            java.lang.reflect.Field field = User.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(user, value);
        } catch (ReflectiveOperationException exception) {
            throw new RuntimeException(exception);
        }
    }
}
