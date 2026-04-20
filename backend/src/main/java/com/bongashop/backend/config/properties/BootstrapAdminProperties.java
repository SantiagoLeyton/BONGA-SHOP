package com.bongashop.backend.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.bootstrap")
public record BootstrapAdminProperties(
        boolean adminEnabled,
        String adminName,
        String adminEmail,
        String adminPassword
) {
}
