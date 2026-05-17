# Ollama + Gemma 2B para BONGA SHOP

Esta integracion usa IA local gratuita. No requiere OpenAI, LangChain, Python ni servicios pagos.

## 1. Instalar Ollama

Windows:

1. Descargar Ollama desde `https://ollama.com/download`.
2. Instalar y abrir Ollama.
3. Confirmar que el servicio responde en `http://localhost:11434`.

macOS/Linux:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## 2. Descargar Gemma 2B

```bash
ollama pull gemma:2b
```

## 3. Iniciar o probar el modelo

```bash
ollama run gemma:2b
```

O por HTTP:

```bash
curl http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"gemma:2b\",\"prompt\":\"Recomienda un vape mentolado en una frase.\",\"stream\":false}"
```

## 4. Configuracion del backend

Local sin Docker:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma:2b
```

Backend en Docker Desktop para Windows:

```bash
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=gemma:2b
```

`docker-compose.yml` ya define `OLLAMA_BASE_URL=http://host.docker.internal:11434` para que el contenedor backend alcance el Ollama instalado en la maquina host.

## 5. Flujo

Angular envia preferencias guiadas al backend autenticado. Spring Boot resume productos reales con stock y preferencias del usuario, llama a Ollama, y devuelve recomendaciones reales existentes en PostgreSQL. Si Ollama no responde, el backend devuelve una recomendacion local con `aiAvailable=false` para que la UI muestre un mensaje elegante sin romper la experiencia.
