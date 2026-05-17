package com.bongashop.backend.auth.passwordreset.repository;

import com.bongashop.backend.auth.passwordreset.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /**
     * Invalida (marca como usados) todos los tokens aún vigentes del usuario.
     * Útil cuando se solicita un nuevo reset: así el anterior queda inservible.
     */
    @Modifying
    @Query("""
            update PasswordResetToken t
               set t.usedAt = :now
             where t.user.id = :userId
               and t.usedAt is null
            """)
    int invalidateActiveTokensForUser(@Param("userId") Long userId, @Param("now") Instant now);
}
