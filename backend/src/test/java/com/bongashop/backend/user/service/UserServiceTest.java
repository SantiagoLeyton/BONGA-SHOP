package com.bongashop.backend.user.service;

import com.bongashop.backend.config.properties.BootstrapAdminProperties;
import com.bongashop.backend.role.entity.Role;
import com.bongashop.backend.role.service.RoleService;
import com.bongashop.backend.shared.enums.RoleName;
import com.bongashop.backend.user.entity.User;
import com.bongashop.backend.user.mapper.UserMapper;
import com.bongashop.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleService roleService;
    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, roleService, new UserMapper());
    }

    @Test
    void shouldCreateBootstrapAdminWhenMissing() {
        BootstrapAdminProperties properties = new BootstrapAdminProperties(
                true,
                "Bonga Admin",
                "admin@bonga.shop",
                "Admin123!"
        );
        Role adminRole = new Role(RoleName.ROLE_ADMIN);

        when(roleService.getRole(RoleName.ROLE_ADMIN)).thenReturn(adminRole);
        when(userRepository.findByEmailIgnoreCase("admin@bonga.shop")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Admin123!")).thenReturn("encoded-admin-password");

        userService.ensureBootstrapAdmin(properties, passwordEncoder);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User savedUser = captor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("admin@bonga.shop");
        assertThat(savedUser.getName()).isEqualTo("Bonga Admin");
        assertThat(savedUser.getRole().getName()).isEqualTo(RoleName.ROLE_ADMIN);
        assertThat(savedUser.isActive()).isTrue();
        assertThat(savedUser.getPassword()).isEqualTo("encoded-admin-password");
    }

    @Test
    void shouldRepairBootstrapAdminWhenExistingUserIsInconsistent() throws Exception {
        BootstrapAdminProperties properties = new BootstrapAdminProperties(
                true,
                "Bonga Admin",
                "admin@bonga.shop",
                "Admin123!"
        );
        Role adminRole = new Role(RoleName.ROLE_ADMIN);
        User existingUser = new User();
        java.lang.reflect.Field idField = User.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(existingUser, 77L);
        existingUser.setName("Legacy Admin");
        existingUser.setEmail("admin@bonga.shop");
        existingUser.setPassword("legacy-password-hash");
        existingUser.setActive(false);
        existingUser.setRole(new Role(RoleName.ROLE_CLIENT));

        when(roleService.getRole(RoleName.ROLE_ADMIN)).thenReturn(adminRole);
        when(userRepository.findByEmailIgnoreCase("admin@bonga.shop")).thenReturn(Optional.of(existingUser));

        userService.ensureBootstrapAdmin(properties, passwordEncoder);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User repairedUser = captor.getValue();
        assertThat(repairedUser.getId()).isEqualTo(77L);
        assertThat(repairedUser.getName()).isEqualTo("Legacy Admin");
        assertThat(repairedUser.getRole().getName()).isEqualTo(RoleName.ROLE_ADMIN);
        assertThat(repairedUser.isActive()).isTrue();
        assertThat(repairedUser.getPassword()).isEqualTo("legacy-password-hash");
    }

    @Test
    void shouldSkipSaveWhenBootstrapAdminAlreadyMatchesExpectedConfiguration() throws Exception {
        BootstrapAdminProperties properties = new BootstrapAdminProperties(
                true,
                "Bonga Admin",
                "admin@bonga.shop",
                "Admin123!"
        );
        User existingUser = new User();
        java.lang.reflect.Field idField = User.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(existingUser, 1L);
        existingUser.setName("Bonga Admin");
        existingUser.setEmail("admin@bonga.shop");
        existingUser.setPassword("encoded-admin-password");
        existingUser.setActive(true);
        existingUser.setRole(new Role(RoleName.ROLE_ADMIN));

        when(roleService.getRole(RoleName.ROLE_ADMIN)).thenReturn(new Role(RoleName.ROLE_ADMIN));
        when(userRepository.findByEmailIgnoreCase("admin@bonga.shop")).thenReturn(Optional.of(existingUser));

        userService.ensureBootstrapAdmin(properties, passwordEncoder);

        verify(userRepository, never()).save(any(User.class));
    }
}
