package com.bongashop.backend.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.inventory")
public record InventoryProperties(
        int lowStockThreshold
) {
}
