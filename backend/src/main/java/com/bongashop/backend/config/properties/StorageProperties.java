package com.bongashop.backend.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuración de almacenamiento de archivos subidos (p. ej. imágenes de productos).
 */
@ConfigurationProperties(prefix = "app.uploads")
public class StorageProperties {

    /**
     * Directorio raíz donde se persisten los archivos cargados por admins.
     * En Docker se monta a un volumen para que no se pierda entre despliegues.
     */
    private String dir = "./uploads";

    /**
     * Tamaño máximo aceptado por archivo, en bytes. Default 5 MB.
     */
    private long maxFileSize = 5L * 1024L * 1024L;

    public String getDir() {
        return dir;
    }

    public void setDir(String dir) {
        this.dir = dir;
    }

    public long getMaxFileSize() {
        return maxFileSize;
    }

    public void setMaxFileSize(long maxFileSize) {
        this.maxFileSize = maxFileSize;
    }
}
