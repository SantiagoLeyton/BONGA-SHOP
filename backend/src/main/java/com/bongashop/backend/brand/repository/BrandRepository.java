package com.bongashop.backend.brand.repository;

import com.bongashop.backend.brand.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<Brand, Long> {

    Optional<Brand> findByNameIgnoreCase(String name);

    List<Brand> findAllByActiveTrueOrderByNameAsc();
}
