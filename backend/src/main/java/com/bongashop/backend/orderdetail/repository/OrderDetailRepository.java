package com.bongashop.backend.orderdetail.repository;

import com.bongashop.backend.orderdetail.entity.OrderDetail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {
}
