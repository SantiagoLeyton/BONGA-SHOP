package com.bongashop.backend.favorite.mapper;

import com.bongashop.backend.favorite.dto.FavoriteResponse;
import com.bongashop.backend.favorite.entity.Favorite;
import org.springframework.stereotype.Component;

@Component
public class FavoriteMapper {

    public FavoriteResponse toResponse(Favorite favorite) {
        return new FavoriteResponse(
                favorite.getId(),
                favorite.getProduct().getId(),
                favorite.getProduct().getName(),
                favorite.getProduct().getBrand().getName(),
                favorite.getCreatedAt()
        );
    }
}
