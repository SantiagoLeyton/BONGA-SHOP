package com.bongashop.backend.role.service;

import com.bongashop.backend.role.entity.Role;
import com.bongashop.backend.role.repository.RoleRepository;
import com.bongashop.backend.shared.enums.RoleName;
import com.bongashop.backend.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Transactional
    public void ensureDefaultRoles() {
        Arrays.stream(RoleName.values()).forEach(roleName ->
                roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(new Role(roleName)))
        );
    }

    @Transactional(readOnly = true)
    public Role getRole(RoleName roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
    }
}
