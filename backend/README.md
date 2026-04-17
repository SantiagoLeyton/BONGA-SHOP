# BONGA SHOP Backend

Backend REST para BONGA SHOP construido con Spring Boot, PostgreSQL, JWT y arquitectura de monolito modular.

## Stack

- Java 17
- Spring Boot 3.3.5
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Docker / Docker Compose

## Modular structure

Código principal en `src/main/java/com/bongashop/backend`:

- `config`: seguridad, propiedades y bootstrap
- `auth`: registro, login y respuestas JWT
- `user`: perfil, listado y estado de usuarios
- `role`: roles `ADMIN` y `CLIENT`
- `brand`: CRUD de marcas
- `product`: CRUD y catálogo de productos
- `productvariant`: variantes por sabor, nicotina y precio
- `inventory`: stock por variante
- `order`: creación, detalle, historial y cambio de estado
- `orderdetail`: persistencia de ítems de orden
- `shared`: DTOs compartidos, enums y manejo global de errores

## Environment variables

Variables principales:

- `SERVER_PORT` default `8080`
- `SPRING_PROFILES_ACTIVE` default `dev`
- `DB_HOST` default `localhost`
- `DB_PORT` default `5432`
- `DB_NAME` default `bonga_shop`
- `DB_USERNAME` default `postgres`
- `DB_PASSWORD` default `postgres`
- `JWT_SECRET` default `change-this-secret-key-for-bonga-shop-please-2026`
- `JWT_EXPIRATION_MINUTES` default `1440`
- `LOW_STOCK_THRESHOLD` default `5`
- `APP_ADMIN_ENABLED` default `true`
- `APP_ADMIN_NAME` default `Bonga Admin`
- `APP_ADMIN_EMAIL` default `admin@bonga.shop`
- `APP_ADMIN_PASSWORD` default `Admin123!`

## Run locally

1. Levanta PostgreSQL.
2. Entra a `backend`.
3. Ejecuta:

```bash
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8080`.

## Run with Docker

Desde la raíz del repositorio:

```bash
docker compose up --build
```

Servicios:

- API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

## Authentication flow

1. `POST /api/v1/auth/register` crea un cliente y devuelve JWT.
2. `POST /api/v1/auth/login` autentica y devuelve JWT.
3. Usa el token en el header:

```http
Authorization: Bearer <token>
```

## Main endpoints

### Public

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/brands`
- `GET /api/v1/products`
- `GET /api/v1/products/{id}`
- `GET /api/v1/products/{productId}/variants`

### Authenticated

- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `GET /api/v1/orders/{id}`

### Admin

- `GET /api/v1/users`
- `PATCH /api/v1/users/{id}/status`
- `POST|PUT|DELETE /api/v1/brands`
- `POST|PUT|DELETE /api/v1/products`
- `POST /api/v1/products/{productId}/variants`
- `PUT|DELETE /api/v1/variants/{id}`
- `GET /api/v1/inventory`
- `PUT /api/v1/inventory/{variantId}`
- `GET /api/v1/orders`
- `PATCH /api/v1/orders/{id}/status`

### Client

- `POST /api/v1/orders`
- `GET /api/v1/orders/my-orders`

## Validation and errors

- Bean Validation en DTOs
- respuestas uniformes de error en `shared.exception.GlobalExceptionHandler`
- casos cubiertos: credenciales inválidas, validación, stock insuficiente, recurso no encontrado y acceso denegado

## Tests

Ejecutar:

```bash
./mvnw test
```

Cobertura actual base:

- autenticación
- servicio de órdenes
- validación de stock
- servicio JWT

## Postman

Colección lista para importar:

- `postman/BONGA-SHOP-Backend.postman_collection.json`

## Notes

- La carpeta `frontend` no fue modificada.
- `documentos/database.sql` estaba vacío, por lo que el modelo final fue derivado de `requisitos.xlsx` y `endpoints.xlsx`.
- El detalle de inconsistencias y ajustes quedó documentado en `docs/document-adjustments.md`.
