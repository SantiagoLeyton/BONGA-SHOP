package com.bongashop.backend.user.mapper;

import com.bongashop.backend.user.dto.UserProfileResponse;
import com.bongashop.backend.user.dto.UserSummaryResponse;
import com.bongashop.backend.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserProfileResponse toProfile(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName().name().replace("ROLE_", ""),
                user.isActive()
        );
    }

    public UserSummaryResponse toSummary(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName().name().replace("ROLE_", ""),
                user.isActive()
        );
    }
}
