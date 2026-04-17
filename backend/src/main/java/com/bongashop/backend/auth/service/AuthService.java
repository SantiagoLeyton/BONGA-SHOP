package com.bongashop.backend.auth.service;

import com.bongashop.backend.auth.dto.AuthResponse;
import com.bongashop.backend.auth.dto.LoginRequest;
import com.bongashop.backend.auth.dto.RegisterRequest;
import com.bongashop.backend.auth.mapper.AuthMapper;
import com.bongashop.backend.config.security.CustomUserDetails;
import com.bongashop.backend.config.security.JwtService;
import com.bongashop.backend.role.service.RoleService;
import com.bongashop.backend.shared.enums.RoleName;
import com.bongashop.backend.shared.exception.BusinessException;
import com.bongashop.backend.shared.exception.InvalidCredentialsException;
import com.bongashop.backend.user.entity.User;
import com.bongashop.backend.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthMapper authMapper;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            RoleService roleService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthMapper authMapper
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleService = roleService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authMapper = authMapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Email is already registered");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone() == null ? null : request.phone().trim());
        user.setActive(true);
        user.setRole(roleService.getRole(RoleName.ROLE_CLIENT));

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(new CustomUserDetails(savedUser));
        return authMapper.toResponse(token, savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password())
            );
        } catch (BadCredentialsException exception) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));
        if (!user.isActive()) {
            throw new InvalidCredentialsException("Inactive users cannot log in");
        }

        String token = jwtService.generateToken(new CustomUserDetails(user));
        return authMapper.toResponse(token, user);
    }
}
