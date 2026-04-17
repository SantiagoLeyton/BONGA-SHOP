package com.bongashop.backend.user.repository;

import com.bongashop.backend.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = "role")
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "role")
    Optional<User> findWithRoleById(Long id);

    @EntityGraph(attributePaths = "role")
    @Query("""
            select u from User u
            where (:search is null
               or lower(u.name) like lower(concat('%', :search, '%'))
               or lower(u.email) like lower(concat('%', :search, '%')))
            """)
    Page<User> search(@Param("search") String search, Pageable pageable);
}
