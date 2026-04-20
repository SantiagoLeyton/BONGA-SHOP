package com.bongashop.backend.auth.service;

import com.bongashop.backend.auth.dto.LoginRequest;
import com.bongashop.backend.auth.dto.RegisterRequest;
import com.bongashop.backend.auth.mapper.AuthMapper;
import com.bongashop.backend.config.security.JwtService;
import com.bongashop.backend.role.entity.Role;
import com.bongashop.backend.role.service.RoleService;
import com.bongashop.backend.shared.enums.RoleName;
import com.bongashop.backend.shared.exception.BusinessException;
import com.bongashop.backend.shared.exception.InvalidCredentialsException;
import com.bongashop.backend.user.entity.User;
import com.bongashop.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleService roleService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    private AuthMapper authMapper;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authMapper = new AuthMapper();
        authService = new AuthService(authenticationManager, userRepository, roleService, passwordEncoder, jwtService, authMapper);
    }

    @Test
    void shouldRegisterClientAndReturnJwt() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@example.com", "Password123", "3001234567");
        Role clientRole = new Role(RoleName.ROLE_CLIENT);

        when(userRepository.existsByEmailIgnoreCase("alice@example.com")).thenReturn(false);
        when(roleService.getRole(RoleName.ROLE_CLIENT)).thenReturn(clientRole);
        when(passwordEncoder.encode("Password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            java.lang.reflect.Field idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, 1L);
            return user;
        });
        when(jwtService.generateToken(any())).thenReturn("jwt-token");

        var response = authService.register(request);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().role()).isEqualTo("CLIENT");
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("alice@example.com");
        assertThat(captor.getValue().getPassword()).isEqualTo("encoded-password");
    }

    @Test
    void shouldRejectDuplicatedEmailOnRegister() {
        when(userRepository.existsByEmailIgnoreCase("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(new RegisterRequest("Alice", "alice@example.com", "Password123", null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    void shouldLoginExistingActiveUser() {
        User user = new User();
        user.setName("Admin");
        user.setEmail("admin@bonga.shop");
        user.setPassword("encoded");
        user.setActive(true);
        user.setRole(new Role(RoleName.ROLE_ADMIN));

        when(userRepository.findByEmailIgnoreCase("admin@bonga.shop")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any())).thenReturn("jwt-token");

        var response = authService.login(new LoginRequest("admin@bonga.shop", "Admin123!"));

        verify(authenticationManager).authenticate(new UsernamePasswordAuthenticationToken("admin@bonga.shop", "Admin123!"));
        assertThat(response.user().role()).isEqualTo("ADMIN");
    }

    @Test
    void shouldRejectInvalidCredentials() {
        User user = new User();
        user.setName("Bad User");
        user.setEmail("bad@example.com");
        user.setPassword("encoded");
        user.setActive(true);
        user.setRole(new Role(RoleName.ROLE_CLIENT));

        when(userRepository.findByEmailIgnoreCase("bad@example.com")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("bad@example.com", "wrong")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }
}
