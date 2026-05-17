package com.bongashop.backend.admin.service;

import com.bongashop.backend.admin.dto.AdminRecommendationResponse;
import com.bongashop.backend.ai.service.OllamaClient;
import com.bongashop.backend.config.properties.InventoryProperties;
import com.bongashop.backend.inventory.entity.Inventory;
import com.bongashop.backend.inventory.entity.InventoryMovement;
import com.bongashop.backend.inventory.repository.InventoryMovementRepository;
import com.bongashop.backend.inventory.repository.InventoryRepository;
import com.bongashop.backend.order.repository.OrderRepository;
import com.bongashop.backend.shared.enums.InventoryMovementType;
import com.bongashop.backend.shared.enums.RecommendationPriority;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AdminRecommendationService {

    private static final int MAX_RECOMMENDATIONS = 5;

    private final OllamaClient ollamaClient;
    private final ObjectMapper objectMapper;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final OrderRepository orderRepository;
    private final InventoryProperties inventoryProperties;

    public AdminRecommendationService(
            OllamaClient ollamaClient,
            ObjectMapper objectMapper,
            InventoryRepository inventoryRepository,
            InventoryMovementRepository movementRepository,
            OrderRepository orderRepository,
            InventoryProperties inventoryProperties
    ) {
        this.ollamaClient = ollamaClient;
        this.objectMapper = objectMapper;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
        this.orderRepository = orderRepository;
        this.inventoryProperties = inventoryProperties;
    }

    @Transactional(readOnly = true)
    public List<AdminRecommendationResponse> getRecommendations() {
        LocalDateTime now = LocalDateTime.now();
        List<Inventory> inventory = inventoryRepository.findByFilters(null, null, false, inventoryProperties.lowStockThreshold());
        List<InventoryMovement> sales180 = movementRepository.findByTypeAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                InventoryMovementType.SALE,
                now.minusDays(180)
        );
        long recentOrders = orderRepository.countByPlacedAtGreaterThanEqual(now.minusDays(30));

        Map<Long, ProductStats> stats = buildProductStats(inventory, sales180, now);
        List<RecommendationSignal> signals = buildSignals(stats, sales180, now, recentOrders);
        if (signals.isEmpty()) {
            return List.of();
        }

        try {
            String prompt = buildPrompt(signals, recentOrders);
            List<AdminRecommendationResponse> recommendations = parseAiRecommendations(
                    ollamaClient.generate(prompt, 650, 0.12),
                    signals
            );
            if (recommendations.isEmpty()) {
                recommendations = parseAiRecommendations(
                        ollamaClient.generate(prompt + "\nCorrige: la respuesta anterior fue invalida. Devuelve solo el arreglo JSON con metricas reales del contexto.", 650, 0.05),
                        signals
                );
            }
            if (!recommendations.isEmpty()) {
                return recommendations;
            }
        } catch (RuntimeException ignored) {
            return unavailableFallback();
        }
        return unavailableFallback();
    }

    private Map<Long, ProductStats> buildProductStats(List<Inventory> inventory, List<InventoryMovement> sales, LocalDateTime now) {
        Map<Long, ProductStats> stats = new LinkedHashMap<>();
        for (Inventory item : inventory) {
            long productId = item.getVariant().getProduct().getId();
            ProductStats product = stats.computeIfAbsent(productId, ignored -> new ProductStats(
                    productId,
                    item.getVariant().getProduct().getName(),
                    item.getVariant().getProduct().getBrand().getName()
            ));
            product.stock += item.getStock();
            product.variants += 1;
            product.flavors.add(item.getVariant().getFlavor());
        }

        for (InventoryMovement sale : sales) {
            long productId = sale.getVariant().getProduct().getId();
            ProductStats product = stats.computeIfAbsent(productId, ignored -> new ProductStats(
                    productId,
                    sale.getVariant().getProduct().getName(),
                    sale.getVariant().getProduct().getBrand().getName()
            ));
            int sold = Math.abs(sale.getQuantityChange());
            product.sales180 += sold;
            if (sale.getCreatedAt().isAfter(now.minusDays(60))) product.sales60 += sold;
            if (sale.getCreatedAt().isAfter(now.minusDays(30))) product.sales30 += sold;
            if (sale.getCreatedAt().isAfter(now.minusDays(14))) product.sales14 += sold;
            if (product.lastSale == null || sale.getCreatedAt().isAfter(product.lastSale)) {
                product.lastSale = sale.getCreatedAt();
            }
        }
        return stats;
    }

    private List<RecommendationSignal> buildSignals(
            Map<Long, ProductStats> stats,
            List<InventoryMovement> sales180,
            LocalDateTime now,
            long recentOrders
    ) {
        List<RecommendationSignal> signals = new ArrayList<>();
        addCriticalStockSignals(signals, stats);
        addHighRotationSignals(signals, stats);
        addDeadStockSignals(signals, stats);
        addFlavorTrendSignal(signals, sales180, now, recentOrders);
        addBrandTrendSignal(signals, sales180, now, recentOrders);
        return signals.stream()
                .sorted(Comparator.comparingInt((RecommendationSignal item) -> priorityScore(item.priority())).reversed())
                .limit(MAX_RECOMMENDATIONS)
                .toList();
    }

    private void addCriticalStockSignals(List<RecommendationSignal> signals, Map<Long, ProductStats> stats) {
        stats.values().stream()
                .filter(item -> item.stock <= inventoryProperties.lowStockThreshold() && item.sales30 >= 2)
                .sorted(Comparator.comparingInt((ProductStats item) -> item.sales30).reversed())
                .limit(2)
                .forEach(item -> signals.add(new RecommendationSignal(
                        "STOCK_CRITICO",
                        item.name,
                        RecommendationPriority.HIGH,
                        "Producto: " + item.name + ". Marca: " + item.brand + ". Sabores: "
                                + String.join(", ", item.flavors) + ". Stock actual total: " + item.stock
                                + ". Unidades vendidas en 14 dias: " + item.sales14
                                + ". Unidades vendidas en 30 dias: " + item.sales30
                                + ". Unidades vendidas en 60 dias: " + item.sales60
                                + ". Senal: stock por debajo del umbral " + inventoryProperties.lowStockThreshold()
                                + " con demanda reciente."
                )));
    }

    private void addHighRotationSignals(List<RecommendationSignal> signals, Map<Long, ProductStats> stats) {
        double average30 = stats.values().stream().mapToInt(item -> item.sales30).average().orElse(0);
        stats.values().stream()
                .filter(item -> item.sales30 >= Math.max(3, average30 * 1.35))
                .filter(item -> item.stock < Math.max(8, item.sales30 * 2))
                .sorted(Comparator.comparingInt((ProductStats item) -> item.sales30).reversed())
                .limit(1)
                .forEach(item -> signals.add(new RecommendationSignal(
                        "ALTA_ROTACION",
                        item.name,
                        RecommendationPriority.HIGH,
                        "Producto: " + item.name + ". Marca: " + item.brand + ". Stock actual total: " + item.stock
                                + ". Unidades vendidas en 14 dias: " + item.sales14
                                + ". Unidades vendidas en 30 dias: " + item.sales30
                                + ". Promedio de unidades vendidas en 30 dias del catalogo: " + Math.round(average30 * 10.0) / 10.0
                                + ". Senal: vende por encima del promedio y el stock no cubre dos ciclos de demanda mensual."
                )));
    }

    private void addDeadStockSignals(List<RecommendationSignal> signals, Map<Long, ProductStats> stats) {
        stats.values().stream()
                .filter(item -> item.stock >= 5)
                .filter(item -> item.sales180 <= 1 || item.lastSale == null || item.lastSale.isBefore(LocalDateTime.now().minusDays(60)))
                .sorted(Comparator.comparingInt((ProductStats item) -> item.stock).reversed())
                .limit(1)
                .forEach(item -> signals.add(new RecommendationSignal(
                        "BAJA_ROTACION",
                        item.name,
                        RecommendationPriority.MEDIUM,
                        "Producto: " + item.name + ". Marca: " + item.brand + ". Stock actual total: " + item.stock
                                + ". Unidades vendidas en 180 dias: " + item.sales180 + ". Ultima venta: "
                                + (item.lastSale == null ? "sin registro" : item.lastSale.toLocalDate())
                                + ". Senal: inventario retenido con rotacion baja o inactiva."
                )));
    }

    private void addFlavorTrendSignal(
            List<RecommendationSignal> signals,
            List<InventoryMovement> sales,
            LocalDateTime now,
            long recentOrders
    ) {
        Trend mintTrend = trendForKeyword(sales, now, List.of("ice", "mint", "menthol", "menta"));
        if (mintTrend.current >= 3 && mintTrend.current >= Math.max(2, Math.ceil(mintTrend.previous * 1.3))) {
            signals.add(new RecommendationSignal(
                    "TENDENCIA_SABOR",
                    "sabores mentolados",
                    RecommendationPriority.MEDIUM,
                    "Categoria: sabores ice/menta/menthol. Unidades vendidas en ultimos 14 dias: " + mintTrend.current
                            + ". Unidades vendidas en los 14 dias anteriores: " + mintTrend.previous
                            + ". Ordenes ultimos 30 dias: " + recentOrders
                            + ". Senal: aceleracion simple en sabores frescos."
            ));
        }
    }

    private void addBrandTrendSignal(
            List<RecommendationSignal> signals,
            List<InventoryMovement> sales,
            LocalDateTime now,
            long recentOrders
    ) {
        Map<String, Trend> byBrand = new HashMap<>();
        for (InventoryMovement sale : sales) {
            String brand = sale.getVariant().getProduct().getBrand().getName();
            Trend trend = byBrand.computeIfAbsent(brand, ignored -> new Trend());
            int sold = Math.abs(sale.getQuantityChange());
            if (sale.getCreatedAt().isAfter(now.minusDays(14))) {
                trend.current += sold;
            } else if (sale.getCreatedAt().isAfter(now.minusDays(28))) {
                trend.previous += sold;
            }
        }

        byBrand.entrySet().stream()
                .filter(entry -> entry.getValue().current >= 3)
                .filter(entry -> entry.getValue().current >= Math.max(2, Math.ceil(entry.getValue().previous * 1.4)))
                .max(Comparator.comparingInt(entry -> entry.getValue().current))
                .ifPresent(entry -> signals.add(new RecommendationSignal(
                        "TENDENCIA_MARCA",
                        entry.getKey(),
                        recentOrders >= 5 ? RecommendationPriority.MEDIUM : RecommendationPriority.LOW,
                        "Marca: " + entry.getKey() + ". Unidades vendidas en ultimos 14 dias: " + entry.getValue().current
                                + ". Unidades vendidas en los 14 dias anteriores: " + entry.getValue().previous
                                + ". Ordenes ultimos 30 dias: " + recentOrders
                                + ". Senal: aceleracion de marca frente al periodo anterior."
                )));
    }

    private String buildPrompt(List<RecommendationSignal> signals, long recentOrders) {
        StringBuilder context = new StringBuilder();
        for (int i = 0; i < signals.size(); i += 1) {
            RecommendationSignal signal = signals.get(i);
            context.append(i + 1)
                    .append(". Tipo: ").append(signal.type())
                    .append(" | Entidad: ").append(signal.entity())
                    .append(" | Prioridad sugerida: ").append(signal.priority())
                    .append(" | Titulo obligatorio: ").append(titleFor(signal))
                    .append(" | Datos: ").append(signal.evidence())
                    .append('\n');
        }

        return """
                Eres un analista operativo senior de ecommerce para el panel administrativo de BONGA SHOP.
                Genera recomendaciones administrativas accionables usando SOLO los datos enviados.

                Reglas estrictas:
                - No inventes productos, marcas, sabores, ventas, porcentajes ni metricas.
                - Si falta una metrica, no la menciones.
                - No describas usos del producto ni beneficios de consumo.
                - No uses palabras ajenas a ecommerce operativo como hogar, limpieza, manchas, residuos, medicinal o salud.
                - No uses markdown.
                - Responde solo JSON valido, sin texto antes ni despues.
                - Maximo 5 objetos.
                - Cada objeto debe tener exactamente: title, description, priority.
                - Usa el Titulo obligatorio de cada senal como title, sin cambiar la accion.
                - priority solo puede ser HIGH, MEDIUM o LOW.
                - title debe ser corto, operativo y profesional.
                - Cuando menciones ventas, escribe "unidades vendidas en X dias"; nunca escribas "vendio X dias".
                - description debe tener 2 o 3 frases cortas en espanol y debe mencionar al menos una metrica exacta enviada: stock, unidades vendidas, dias, ordenes, inventario o rotacion.
                - No escribas recomendaciones genericas: cada card debe apoyarse en una senal concreta.

                Resumen general:
                Ordenes ultimos 30 dias: %d

                Senales calculadas desde inventario, ventas e inventory_movements:
                %s

                Ejemplo de estilo:
                [{"title":"Aumentar stock de Producto X","description":"Producto X tiene 3 unidades en stock y 8 unidades vendidas en 30 dias. Se recomienda priorizar reposicion para evitar quiebres de inventario.","priority":"HIGH"}]
                """.formatted(recentOrders, context);
    }

    private List<AdminRecommendationResponse> parseAiRecommendations(String rawResponse, List<RecommendationSignal> signals) {
        try {
            String json = extractJson(rawResponse);
            JsonNode root = objectMapper.readTree(json);
            if (!root.isArray()) {
                return List.of();
            }

            List<AdminRecommendationResponse> recommendations = new ArrayList<>();
            for (JsonNode node : root) {
                String title = clean(node.path("title").asText(""));
                String description = clean(node.path("description").asText(""));
                RecommendationPriority priority = parsePriority(node.path("priority").asText(""));
                if (title.length() < 8 || description.length() < 30 || priority == null) {
                    continue;
                }
                if (!looksOperational(title) || !looksOperational(description) || containsForbiddenBusinessText(description)
                        || containsInvalidMetricText(description)) {
                    continue;
                }
                recommendations.add(new AdminRecommendationResponse(
                        title.length() > 110 ? title.substring(0, 107).trim() + "..." : title,
                        description.length() > 520 ? description.substring(0, 517).trim() + "..." : description,
                        priority
                ));
            }
            return recommendations.stream()
                    .filter(item -> matchesKnownSignalIntent(item, signals))
                    .sorted(Comparator.comparingInt((AdminRecommendationResponse item) -> priorityScore(item.priority())).reversed())
                    .limit(MAX_RECOMMENDATIONS)
                    .toList();
        } catch (Exception exception) {
            return List.of();
        }
    }

    private String titleFor(RecommendationSignal signal) {
        return switch (signal.type()) {
            case "STOCK_CRITICO" -> "Reponer stock de " + signal.entity();
            case "ALTA_ROTACION" -> "Aumentar stock de " + signal.entity();
            case "BAJA_ROTACION" -> "Reducir reposicion de " + signal.entity();
            case "TENDENCIA_SABOR" -> "Priorizar inventario de " + signal.entity();
            case "TENDENCIA_MARCA" -> "Priorizar reposicion de marca " + signal.entity();
            default -> "Revisar " + signal.entity();
        };
    }

    private String extractJson(String value) {
        String cleaned = value.replace("```json", "").replace("```", "").trim();
        int start = cleaned.indexOf('[');
        int end = cleaned.lastIndexOf(']');
        if (start < 0 || end < start) {
            throw new IllegalArgumentException("Missing JSON array");
        }
        return cleaned.substring(start, end + 1);
    }

    private boolean matchesKnownSignalIntent(AdminRecommendationResponse item, List<RecommendationSignal> signals) {
        String title = normalize(item.title());
        String description = normalize(item.description());
        String text = normalize(item.title() + " " + item.description());
        for (RecommendationSignal signal : signals) {
            if (!title.contains(normalize(signal.entity()))) {
                continue;
            }
            if (matchesIntent(signal.type(), text, description)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesIntent(String signalType, String text, String description) {
        return switch (signalType) {
            case "STOCK_CRITICO", "ALTA_ROTACION" ->
                    containsAny(text, "aumentar", "reponer", "reposicion", "priorizar", "stock");
            case "BAJA_ROTACION" ->
                    containsAny(description, "reducir", "pausar", "reemplazar", "rotacion baja", "baja rotacion", "baja demanda")
                            && !containsAny(description, "aumentar stock", "accion de reposicion", "mantener un flujo constante",
                            "se recomienda reposicion", "priorizar reposicion");
            case "TENDENCIA_SABOR", "TENDENCIA_MARCA" ->
                    containsAny(text, "priorizar", "aumentar", "reforzar", "tendencia", "inventario");
            default -> false;
        };
    }

    private boolean looksOperational(String description) {
        String text = normalize(description);
        return containsAny(text, "stock", "venta", "unidade", "dia", "orden", "inventario", "rotacion", "reposicion",
                "reponer", "aumentar", "reducir", "priorizar");
    }

    private boolean containsForbiddenBusinessText(String description) {
        String text = normalize(description);
        return containsAny(text, "hogar", "limpieza", "mancha", "residuo", "medicinal", "salud", "terapeutico");
    }

    private boolean containsInvalidMetricText(String description) {
        String text = normalize(description);
        return text.matches(".*vend[ií]?[ao]\\s+\\d+\\s+dias.*")
                || text.matches(".*ha\\s+vendido\\s+\\d+\\s+dias.*");
    }

    private boolean containsAny(String text, String... values) {
        for (String value : values) {
            if (text.contains(value)) {
                return true;
            }
        }
        return false;
    }

    private RecommendationPriority parsePriority(String value) {
        try {
            return RecommendationPriority.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String clean(String value) {
        return value == null ? "" : value.replaceAll("[\\r\\n]+", " ").replaceAll("\\s+", " ").trim();
    }

    private List<AdminRecommendationResponse> unavailableFallback() {
        return List.of(new AdminRecommendationResponse(
                "Asistente operativo no disponible",
                "El asistente operativo no esta disponible temporalmente. Verifica que Ollama este activo en http://localhost:11434 y que el modelo gemma:2b este instalado.",
                RecommendationPriority.LOW
        ));
    }

    private Trend trendForKeyword(List<InventoryMovement> sales, LocalDateTime now, List<String> keywords) {
        Trend trend = new Trend();
        for (InventoryMovement sale : sales) {
            String flavor = sale.getVariant().getFlavor().toLowerCase(Locale.ROOT);
            boolean matches = keywords.stream().anyMatch(flavor::contains);
            if (!matches) continue;
            int sold = Math.abs(sale.getQuantityChange());
            if (sale.getCreatedAt().isAfter(now.minusDays(14))) {
                trend.current += sold;
            } else if (sale.getCreatedAt().isAfter(now.minusDays(28))) {
                trend.previous += sold;
            }
        }
        return trend;
    }

    private int priorityScore(RecommendationPriority priority) {
        return switch (priority) {
            case HIGH -> 3;
            case MEDIUM -> 2;
            case LOW -> 1;
        };
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim()
                .toLowerCase(Locale.ROOT)
                .replace('á', 'a')
                .replace('é', 'e')
                .replace('í', 'i')
                .replace('ó', 'o')
                .replace('ú', 'u')
                .replace('ñ', 'n');
    }

    private record RecommendationSignal(
            String type,
            String entity,
            RecommendationPriority priority,
            String evidence
    ) {
    }

    private static final class ProductStats {
        private final long productId;
        private final String name;
        private final String brand;
        private final List<String> flavors = new ArrayList<>();
        private int variants;
        private int stock;
        private int sales14;
        private int sales30;
        private int sales60;
        private int sales180;
        private LocalDateTime lastSale;

        private ProductStats(long productId, String name, String brand) {
            this.productId = productId;
            this.name = name;
            this.brand = brand;
        }
    }

    private static final class Trend {
        private int current;
        private int previous;
    }
}
