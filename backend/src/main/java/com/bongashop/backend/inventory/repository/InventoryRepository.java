package com.bongashop.backend.inventory.repository;

import com.bongashop.backend.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    @EntityGraph(attributePaths = {"variant", "variant.product", "variant.product.brand"})
    @Query("""
            select i from Inventory i
            where (:productId is null or i.variant.product.id = :productId)
              and (:variantId is null or i.variant.id = :variantId)
              and (:lowStock = false or i.stock <= :threshold)
            order by i.variant.product.name asc, i.variant.id asc
            """)
    List<Inventory> findByFilters(
            @Param("productId") Long productId,
            @Param("variantId") Long variantId,
            @Param("lowStock") boolean lowStock,
            @Param("threshold") int threshold
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Inventory i join fetch i.variant v join fetch v.product p join fetch p.brand where v.id = :variantId")
    Optional<Inventory> findByVariantIdForUpdate(@Param("variantId") Long variantId);

    @EntityGraph(attributePaths = {"variant", "variant.product", "variant.product.brand"})
    Optional<Inventory> findByVariantId(Long variantId);
}
