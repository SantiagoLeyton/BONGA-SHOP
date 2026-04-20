package com.bongashop.backend.order.repository;

import com.bongashop.backend.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @EntityGraph(attributePaths = {"user", "items", "items.variant", "items.variant.product"})
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"user"})
    @Query(
            value = "select o from Order o where o.user.id = :userId order by o.placedAt desc",
            countQuery = "select count(o) from Order o where o.user.id = :userId"
    )
    Page<Order> findPageByUserId(@Param("userId") Long userId, Pageable pageable);
}
