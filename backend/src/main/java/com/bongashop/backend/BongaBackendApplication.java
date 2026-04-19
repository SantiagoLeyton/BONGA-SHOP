package com.bongashop.backend;

import com.bongashop.backend.config.bootstrap.CatalogBootstrapService;
import com.bongashop.backend.config.properties.BootstrapAdminProperties;
import com.bongashop.backend.role.service.RoleService;
import com.bongashop.backend.user.service.UserService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableConfigurationProperties(BootstrapAdminProperties.class)
public class BongaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BongaBackendApplication.class, args);
	}

    @Bean
    public org.springframework.boot.CommandLineRunner bootstrapData(
            RoleService roleService,
            UserService userService,
            BootstrapAdminProperties bootstrapAdminProperties,
            PasswordEncoder passwordEncoder,
            CatalogBootstrapService catalogBootstrapService
    ) {
        return args -> {
            roleService.ensureDefaultRoles();
            userService.ensureBootstrapAdmin(bootstrapAdminProperties, passwordEncoder);
            catalogBootstrapService.seedCatalogIfEmpty();
        };
    }

}
