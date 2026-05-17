package com.bongashop.backend.inventory.repository;

import com.bongashop.backend.inventory.entity.InventoryMovement;
import com.bongashop.backend.shared.enums.InventoryMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long>, JpaSpecificationExecutor<InventoryMovement> {

    @EntityGraph(attributePaths = {"variant", "variant.product", "user"})
    Page<InventoryMovement> findAll(Specification<InventoryMovement> specification, Pageable pageable);

    @EntityGraph(attributePaths = {"variant", "variant.product", "variant.product.brand", "user"})
    List<InventoryMovement> findByCreatedAtGreaterThanEqualOrderByCreatedAtDesc(LocalDateTime since);

    @EntityGraph(attributePaths = {"variant", "variant.product", "variant.product.brand", "user"})
    List<InventoryMovement> findByTypeAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            InventoryMovementType type,
            LocalDateTime since
    );
}
