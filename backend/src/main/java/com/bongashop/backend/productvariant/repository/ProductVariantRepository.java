package com.bongashop.backend.productvariant.repository;

import com.bongashop.backend.productvariant.entity.ProductVariant;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    @EntityGraph(attributePaths = {"product", "product.brand", "inventory"})
    List<ProductVariant> findByProductIdAndActiveTrueOrderByIdAsc(Long productId);

    @EntityGraph(attributePaths = {"product", "product.brand", "inventory"})
    List<ProductVariant> findByProductIdOrderByIdAsc(Long productId);

    @EntityGraph(attributePaths = {"product", "product.brand", "inventory"})
    @Query("select v from ProductVariant v where v.id = :id")
    Optional<ProductVariant> findDetailedById(@Param("id") Long id);
}
