package com.bongashop.backend.ai.service;

import com.bongashop.backend.ai.dto.VapeAssistantRequest;
import com.bongashop.backend.ai.dto.VapeRecommendationItem;
import com.bongashop.backend.ai.dto.VapeRecommendationResponse;
import com.bongashop.backend.productvariant.entity.ProductVariant;
import com.bongashop.backend.productvariant.repository.ProductVariantRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class VapeAssistantService {

    private static final int MAX_CONTEXT_ITEMS = 8;
    private static final int MAX_RECOMMENDATIONS = 3;

    private final ProductVariantRepository variantRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String ollamaBaseUrl;
    private final String ollamaModel;

    public VapeAssistantService(
            ProductVariantRepository variantRepository,
            ObjectMapper objectMapper,
            @Value("${app.ai.ollama.base-url:http://localhost:11434}") String ollamaBaseUrl,
            @Value("${app.ai.ollama.model:gemma:2b}") String ollamaModel
    ) {
        this.variantRepository = variantRepository;
        this.objectMapper = objectMapper;
        this.ollamaBaseUrl = ollamaBaseUrl.replaceAll("/+$", "");
        this.ollamaModel = ollamaModel;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    @Transactional(readOnly = true)
    public VapeRecommendationResponse recommend(VapeAssistantRequest request) {
        List<ScoredVariant> candidates = variantRepository.findAvailableForAiRecommendation().stream()
                .map(variant -> new ScoredVariant(variant, score(variant, request)))
                .sorted(Comparator.comparingInt(ScoredVariant::score).reversed())
                .limit(MAX_CONTEXT_ITEMS)
                .toList();

        List<VapeRecommendationItem> recommendations = candidates.stream()
                .limit(MAX_RECOMMENDATIONS)
                .map(item -> toRecommendation(item.variant(), reasonFor(item.variant(), request)))
                .toList();

        if (recommendations.isEmpty()) {
            return new VapeRecommendationResponse(
                    false,
                    "No encontramos vapes disponibles con stock en este momento.",
                    List.of()
            );
        }

        String fallback = fallbackMessage(recommendations, request);
        try {
            String aiMessage = askOllama(buildPrompt(request, candidates));
            return new VapeRecommendationResponse(true, sanitizeAiMessage(aiMessage, fallback), recommendations);
        } catch (RuntimeException exception) {
            return new VapeRecommendationResponse(false, fallback, recommendations);
        }
    }

    private int score(ProductVariant variant, VapeAssistantRequest request) {
        String flavor = normalize(variant.getFlavor());
        String productName = normalize(variant.getProduct().getName());
        String description = normalize(variant.getProduct().getDescription());
        String nicotine = normalize(variant.getNicotineLevel());
        String searchable = flavor + " " + productName + " " + description;
        int score = Math.min(variant.getInventory().getStock(), 20);

        for (String preference : request.flavors()) {
            score += scoreFlavorPreference(searchable, normalize(preference));
        }
        score += scoreIntensity(nicotine, normalize(request.intensity()));
        score += scoreExperience(searchable, normalize(request.experience()));
        return score;
    }

    private int scoreFlavorPreference(String text, String preference) {
        Map<String, List<String>> keywords = new HashMap<>();
        keywords.put("frutales", List.of("mango", "uva", "limon", "naranja", "berry", "arandano", "frutos", "lichi", "cola"));
        keywords.put("dulces", List.of("mango", "berry", "frutos", "cola", "lichi", "uva"));
        keywords.put("mentolados", List.of("menta", "mint", "ice", "glacial", "helado", "arctic", "fresco"));
        keywords.put("fuertes", List.of("shadow", "concrete", "afterdark", "potente"));
        return keywords.getOrDefault(preference, List.of(preference)).stream().anyMatch(text::contains) ? 35 : 0;
    }

    private int scoreIntensity(String nicotine, String intensity) {
        int mg = parseNicotine(nicotine);
        return switch (intensity) {
            case "suave" -> mg <= 20 ? 28 : 0;
            case "media" -> mg >= 20 && mg <= 35 ? 24 : 0;
            case "fuerte" -> mg >= 35 ? 32 : 0;
            default -> 0;
        };
    }

    private int scoreExperience(String text, String experience) {
        return switch (experience) {
            case "fresca" -> containsAny(text, "menta", "mint", "ice", "glacial", "helado", "arctic") ? 30 : 0;
            case "dulce" -> containsAny(text, "mango", "berry", "frutos", "cola", "lichi", "uva") ? 24 : 0;
            case "relajante" -> containsAny(text, "velvet", "lichi", "uva", "berry", "frutos") ? 20 : 0;
            case "potente" -> containsAny(text, "shadow", "concrete", "afterdark") ? 24 : 0;
            default -> 0;
        };
    }

    private boolean containsAny(String text, String... values) {
        for (String value : values) {
            if (text.contains(value)) {
                return true;
            }
        }
        return false;
    }

    private String buildPrompt(VapeAssistantRequest request, List<ScoredVariant> candidates) {
        StringBuilder catalog = new StringBuilder();
        for (ScoredVariant candidate : candidates) {
            ProductVariant variant = candidate.variant();
            catalog.append("- ID producto ").append(variant.getProduct().getId())
                    .append(", ID variante ").append(variant.getId())
                    .append(": ").append(variant.getProduct().getName())
                    .append(" | marca ").append(variant.getProduct().getBrand().getName())
                    .append(" | sabor ").append(variant.getFlavor())
                    .append(" | intensidad ").append(variant.getNicotineLevel())
                    .append(" | stock ").append(variant.getInventory().getStock())
                    .append(" | afinidad ").append(candidate.score())
                    .append('\n');
        }

        return """
                Eres el asistente premium de BONGA SHOP. Recomienda vapes reales.
                Reglas estrictas:
                - Usa solo productos de la lista.
                - No inventes productos, sabores, marcas ni precios.
                - Responde en español, natural, elegante y breve.
                - Maximo 55 palabras.
                - Menciona 1 producto principal y opcionalmente 1 alternativa.
                - No uses markdown ni listas.

                Preferencias del usuario:
                Sabores: %s
                Intensidad: %s
                Experiencia: %s

                Productos reales disponibles:
                %s
                """.formatted(
                String.join(", ", request.flavors()),
                request.intensity(),
                request.experience(),
                catalog
        );
    }

    private String askOllama(String prompt) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "model", ollamaModel,
                    "prompt", prompt,
                    "stream", false,
                    "options", Map.of(
                            "temperature", 0.25,
                            "num_predict", 90
                    )
            ));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ollamaBaseUrl + "/api/generate"))
                    .timeout(Duration.ofSeconds(12))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Ollama returned status " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            String value = root.path("response").asText("");
            if (value.isBlank()) {
                throw new IllegalStateException("Ollama returned an empty response");
            }
            return value;
        } catch (Exception exception) {
            throw new IllegalStateException("Ollama is unavailable", exception);
        }
    }

    private String sanitizeAiMessage(String message, String fallback) {
        String normalized = message.replace('\n', ' ').replaceAll("\\s+", " ").trim();
        if (normalized.length() < 20) {
            return fallback;
        }
        if (normalized.length() > 420) {
            return normalized.substring(0, 417).trim() + "...";
        }
        return normalized;
    }

    private VapeRecommendationItem toRecommendation(ProductVariant variant, String reason) {
        return new VapeRecommendationItem(
                variant.getProduct().getId(),
                variant.getId(),
                variant.getProduct().getName(),
                variant.getProduct().getBrand().getName(),
                variant.getFlavor(),
                variant.getNicotineLevel(),
                variant.getPrice(),
                variant.getInventory().getStock(),
                reason
        );
    }

    private String reasonFor(ProductVariant variant, VapeAssistantRequest request) {
        String intensity = request.intensity().trim().toLowerCase(Locale.ROOT);
        String experience = request.experience().trim().toLowerCase(Locale.ROOT);
        return "Encaja con una intensidad " + intensity + " y una experiencia " + experience + ".";
    }

    private String fallbackMessage(List<VapeRecommendationItem> recommendations, VapeAssistantRequest request) {
        VapeRecommendationItem first = recommendations.get(0);
        return "Te recomendamos " + first.productName() + " " + first.nicotineLevel()
                + " porque combina " + first.flavor().toLowerCase(Locale.ROOT)
                + " con una experiencia " + request.experience().trim().toLowerCase(Locale.ROOT)
                + " y está disponible ahora.";
    }

    private int parseNicotine(String value) {
        String digits = value.replaceAll("[^0-9]", "");
        return digits.isBlank() ? 0 : Integer.parseInt(digits);
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

    private record ScoredVariant(ProductVariant variant, int score) {
    }
}
