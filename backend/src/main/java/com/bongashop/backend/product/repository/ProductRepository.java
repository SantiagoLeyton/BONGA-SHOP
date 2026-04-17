package com.bongashop.backend.product.repository;

import com.bongashop.backend.product.entity.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @EntityGraph(attributePaths = {"brand", "variants", "variants.inventory"})
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findDetailedById(@Param("id") Long id);

    boolean existsByBrandIdAndActiveTrue(Long brandId);
}
