package com.bongashop.backend.auth.service;

import com.bongashop.backend.auth.dto.AuthResponse;
import com.bongashop.backend.auth.dto.LoginRequest;
import com.bongashop.backend.auth.dto.RegisterRequest;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private static final String CUSTOMER_ROLE = "customer";
    private static final String ADMIN_ROLE = "admin";

    public AuthResponse register(RegisterRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Register request is required.");
        }

        return register(request.getName(), request.getEmail(), request.getPassword());
    }

    public AuthResponse register(String name, String email, String password) {
        String normalizedName = normalizeName(name);
        String normalizedEmail = normalizeEmail(email);

        validateName(normalizedName);
        validateEmail(normalizedEmail);
        validatePassword(password);

        Long id = nextId();
        AuthResponse.User user = new AuthResponse.User(id, normalizedName, normalizedEmail, CUSTOMER_ROLE);

        return new AuthResponse(mockToken(id), user);
    }

    public AuthResponse login(LoginRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Login request is required.");
        }

        return login(request.getEmail(), request.getPassword());
    }

    public AuthResponse login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);

        validateEmail(normalizedEmail);
        validatePassword(password);

        Long id = nextId();
        String role = resolveRole(normalizedEmail);
        String name = ADMIN_ROLE.equals(role) ? "Admin" : resolveNameFromEmail(normalizedEmail);
        AuthResponse.User user = new AuthResponse.User(id, name, normalizedEmail, role);

        return new AuthResponse(mockToken(id), user);
    }

    private void validateName(String name) {
        if (name.length() < 2) {
            throw new IllegalArgumentException("Name must be at least 2 characters long.");
        }
    }

    private void validateEmail(String email) {
        if (!email.contains("@")) {
            throw new IllegalArgumentException("Email must contain '@'.");
        }
    }

    private void validatePassword(String password) {
        if (password == null || password.trim().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }
    }

    private String resolveRole(String email) {
        if (email.contains("admin") || email.endsWith("@bonga.shop")) {
            return ADMIN_ROLE;
        }

        return CUSTOMER_ROLE;
    }

    private String resolveNameFromEmail(String email) {
        String localPart = email.split("@", 2)[0];
        return localPart.isBlank() ? "Customer" : localPart;
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private Long nextId() {
        return System.currentTimeMillis();
    }

    private String mockToken(Long id) {
        return "mock." + id;
    }
}
