package com.bongashop.backend.product.service;

import com.bongashop.backend.config.properties.StorageProperties;
import com.bongashop.backend.shared.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Persiste imágenes de productos en disco bajo {@code app.uploads.dir}.
 *
 * <p>Valida tamaño y content-type antes de escribir. La ruta relativa retornada
 * (p. ej. {@code products/uuid.png}) se guarda en la entidad {@code Product}
 * y posteriormente se expone vía {@code /uploads/**}.</p>
 */
@Service
public class ProductImageStorageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProductImageStorageService.class);
    private static final String PRODUCTS_SUBDIR = "products";

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private static final Map<String, String> CONTENT_TYPE_TO_EXTENSION = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final StorageProperties properties;

    public ProductImageStorageService(StorageProperties properties) {
        this.properties = properties;
    }

    /**
     * Guarda el archivo bajo {@code {uploads.dir}/products/{uuid}.{ext}} y
     * retorna la ruta relativa a almacenar en BD.
     */
    public String store(MultipartFile file) {
        validate(file);

        String contentType = file.getContentType();
        String extension = CONTENT_TYPE_TO_EXTENSION.getOrDefault(contentType, ".bin");
        String storedFilename = PRODUCTS_SUBDIR + "/" + UUID.randomUUID() + extension;

        Path root = resolveRoot();
        Path target = root.resolve(storedFilename).normalize();

        if (!target.startsWith(root)) {
            // Defensa en profundidad: nunca debería pasar con UUIDs, pero evita path traversal.
            throw new BusinessException("Ruta de destino inválida.");
        }

        try {
            Files.createDirectories(target.getParent());
            try (var input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            LOGGER.error("Error guardando imagen de producto", ex);
            throw new BusinessException("No se pudo guardar la imagen del producto.");
        }

        return storedFilename;
    }

    /**
     * Borra el archivo en disco asociado a un {@code imagePath} previo. Silencia
     * errores: si falla no bloqueamos el flujo de negocio.
     */
    public void deleteQuietly(String imagePath) {
        if (imagePath == null || imagePath.isBlank()) {
            return;
        }
        try {
            Path root = resolveRoot();
            Path target = root.resolve(imagePath).normalize();
            if (target.startsWith(root)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException ex) {
            LOGGER.warn("No se pudo eliminar la imagen previa {}: {}", imagePath, ex.getMessage());
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Debes seleccionar un archivo de imagen.");
        }
        if (file.getSize() > properties.getMaxFileSize()) {
            long limitMb = properties.getMaxFileSize() / (1024L * 1024L);
            throw new BusinessException("La imagen supera el tamaño máximo permitido (" + limitMb + " MB).");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BusinessException("Formato de imagen no soportado. Usa JPG, PNG o WEBP.");
        }
    }

    private Path resolveRoot() {
        return Paths.get(properties.getDir()).toAbsolutePath().normalize();
    }
}
