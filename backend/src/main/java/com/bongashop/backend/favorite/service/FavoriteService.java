package com.bongashop.backend.favorite.service;

import com.bongashop.backend.favorite.dto.FavoriteResponse;
import com.bongashop.backend.favorite.entity.Favorite;
import com.bongashop.backend.favorite.mapper.FavoriteMapper;
import com.bongashop.backend.favorite.repository.FavoriteRepository;
import com.bongashop.backend.product.service.ProductService;
import com.bongashop.backend.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserService userService;
    private final ProductService productService;
    private final FavoriteMapper favoriteMapper;

    public FavoriteService(
            FavoriteRepository favoriteRepository,
            UserService userService,
            ProductService productService,
            FavoriteMapper favoriteMapper
    ) {
        this.favoriteRepository = favoriteRepository;
        this.userService = userService;
        this.productService = productService;
        this.favoriteMapper = favoriteMapper;
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> listFavorites(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(favoriteMapper::toResponse)
                .toList();
    }

    @Transactional
    public FavoriteResponse addFavorite(Long userId, Long productId) {
        return favoriteRepository.findByUserIdAndProductId(userId, productId)
                .map(favoriteMapper::toResponse)
                .orElseGet(() -> {
                    Favorite favorite = new Favorite();
                    favorite.setUser(userService.getById(userId));
                    favorite.setProduct(productService.getProductEntity(productId));
                    return favoriteMapper.toResponse(favoriteRepository.save(favorite));
                });
    }

    @Transactional
    public void removeFavorite(Long userId, Long productId) {
        favoriteRepository.deleteByUserIdAndProductId(userId, productId);
    }

    @Transactional
    public void clearFavorites(Long userId) {
        favoriteRepository.deleteAll(favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(Long userId, Long productId) {
        return favoriteRepository.existsByUserIdAndProductId(userId, productId);
    }

    @Transactional(readOnly = true)
    public long countFavorites(Long userId) {
        return favoriteRepository.countByUserId(userId);
    }
}
