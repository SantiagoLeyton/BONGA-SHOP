package com.bongashop.backend.user.service;

import com.bongashop.backend.config.properties.BootstrapAdminProperties;
import com.bongashop.backend.role.service.RoleService;
import com.bongashop.backend.shared.dto.PageResponse;
import com.bongashop.backend.shared.enums.RoleName;
import com.bongashop.backend.shared.exception.BusinessException;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import com.bongashop.backend.user.dto.UserProfileResponse;
import com.bongashop.backend.user.dto.UserStatusUpdateRequest;
import com.bongashop.backend.user.dto.UserSummaryResponse;
import com.bongashop.backend.user.dto.UserUpdateRequest;
import com.bongashop.backend.user.entity.User;
import com.bongashop.backend.user.mapper.UserMapper;
import com.bongashop.backend.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleService roleService;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, RoleService roleService, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.roleService = roleService;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findWithRoleById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getOwnProfile(Long userId) {
        return userMapper.toProfile(getById(userId));
    }

    @Transactional
    public UserProfileResponse updateOwnProfile(Long userId, UserUpdateRequest request) {
        User user = getById(userId);
        String normalizedEmail = request.email().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(normalizedEmail) && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BusinessException("Email is already in use");
        }
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(request.phone() == null ? null : request.phone().trim());
        return userMapper.toProfile(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public PageResponse<UserSummaryResponse> listUsers(String search, int page, int size) {
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
        return PageResponse.from(userRepository.search(normalizedSearch, PageRequest.of(page, Math.min(size, 100)))
                .map(userMapper::toSummary));
    }

    @Transactional
    public UserSummaryResponse updateStatus(Long id, UserStatusUpdateRequest request) {
        User user = getById(id);
        user.setActive(request.active());
        return userMapper.toSummary(userRepository.save(user));
    }

    @Transactional
    public void ensureBootstrapAdmin(BootstrapAdminProperties properties, PasswordEncoder passwordEncoder) {
        if (!properties.adminEnabled() || userRepository.existsByEmailIgnoreCase(properties.adminEmail())) {
            return;
        }
        User admin = new User();
        admin.setName(properties.adminName());
        admin.setEmail(properties.adminEmail().trim().toLowerCase());
        admin.setPassword(passwordEncoder.encode(properties.adminPassword()));
        admin.setRole(roleService.getRole(RoleName.ROLE_ADMIN));
        admin.setActive(true);
        userRepository.save(admin);
    }
}
