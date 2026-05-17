package com.bongashop.backend.role.repository;

import com.bongashop.backend.role.entity.Role;
import com.bongashop.backend.shared.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
