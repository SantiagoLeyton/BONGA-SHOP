package com.bongashop.backend.favorite.repository;

import com.bongashop.backend.favorite.entity.Favorite;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    @EntityGraph(attributePaths = {"product", "product.brand"})
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"product", "product.brand"})
    Optional<Favorite> findByUserIdAndProductId(Long userId, Long productId);

    void deleteByUserIdAndProductId(Long userId, Long productId);

    long countByUserId(Long userId);
}
