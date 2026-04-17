package com.bongashop.backend.user.controller;

import com.bongashop.backend.config.security.CustomUserDetails;
import com.bongashop.backend.shared.dto.PageResponse;
import com.bongashop.backend.user.dto.UserProfileResponse;
import com.bongashop.backend.user.dto.UserStatusUpdateRequest;
import com.bongashop.backend.user.dto.UserSummaryResponse;
import com.bongashop.backend.user.dto.UserUpdateRequest;
import com.bongashop.backend.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserProfileResponse getProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return userService.getOwnProfile(userDetails.getUserId());
    }

    @PutMapping("/me")
    public UserProfileResponse updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        return userService.updateOwnProfile(userDetails.getUserId(), request);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<UserSummaryResponse> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        return userService.listUsers(search, page, size);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public UserSummaryResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request
    ) {
        return userService.updateStatus(id, request);
    }
}
