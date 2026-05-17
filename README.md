# BONGA SHOP

<div align="center">

![BONGA SHOP](frontend/public/assets/logo-bonga.svg)

### Marketplace premium de vapeadores desechables

Arquitectura **monolito modular** con **Spring Boot**, **Angular**, **PostgreSQL**, **Docker** e integración de IA local con **Ollama + gemma:2b**.

[![Java](https://img.shields.io/badge/Java-17-ea2d2e?style=for-the-badge&logo=openjdk&logoColor=white)](#)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-6db33f?style=for-the-badge&logo=springboot&logoColor=white)](#)
[![Angular](https://img.shields.io/badge/Angular-19-dd0031?style=for-the-badge&logo=angular&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=for-the-badge&logo=docker&logoColor=white)](#)
[![Ollama](https://img.shields.io/badge/Ollama-gemma:2b-111111?style=for-the-badge)](#)

</div>

---

## 📌 Descripción

**BONGA SHOP** es un marketplace académico premium para gestionar y vender vapeadores desechables. El sistema integra experiencia de cliente, panel administrativo, persistencia de carrito y favoritos, control de inventario, checkout, pedidos, recuperación de contraseña por correo de desarrollo e inteligencia artificial local para recomendaciones.

El proyecto está construido como un **monolito modular**: una sola aplicación backend desplegable, organizada internamente por dominios funcionales independientes (`auth`, `product`, `inventory`, `order`, `ai`, etc.). Esta decisión reduce complejidad operativa para el contexto académico, pero mantiene una separación clara de responsabilidades.

> Proyecto desarrollado con fines académicos como proyecto final del corte 2 del curso **Programación II**.

---

## ✨ Características principales

| Módulo | Funcionalidad |
|---|---|
| Autenticación | Registro, login, JWT, sesión persistente en frontend y recuperación de contraseña |
| Roles | Roles `ROLE_ADMIN` y `ROLE_CLIENT` con protección por Spring Security |
| Catálogo | Productos, marcas, variantes, precios, sabores, niveles de nicotina e imágenes |
| Inventario | Stock por variante, alertas de bajo stock e historial de movimientos |
| Carrito | Carrito persistente por usuario autenticado |
| Favoritos | Wishlist persistente por usuario autenticado |
| Checkout | Validación de stock, datos de envío y creación de pedidos |
| Pedidos | Historial del cliente, detalle de orden y actualización administrativa de estados |
| Pagos | Métodos de pago y registro/actualización de pagos |
| Admin | Panel para productos, marcas, inventario, pedidos y recomendaciones operativas |
| Excel | Exportación del historial de inventario a `.xls` desde el frontend |
| Moneda | Cambio visual entre COP y USD |
| Idioma | Interfaz con textos ES/EN mediante servicio de traducción propio |
| IA | Recomendaciones de compra y recomendaciones administrativas con Ollama |
| Docker | PostgreSQL, MailHog y backend dockerizados con Docker Compose |

---

## 🧱 Arquitectura del sistema

```
flowchart LR
    U[Usuario / Administrador] --> A[Angular 19<br/>localhost:4200]
    A -->|HTTP + JWT| B[Spring Boot 3.3.5<br/>API /api/v1]
    B --> C[(PostgreSQL 16)]
    B --> D[MailHog SMTP<br/>mailhog:1025]
    B --> E[Ollama API<br/>gemma:2b]
    B --> F[Uploads<br/>/uploads/**]

    subgraph Docker Compose
      B
      C
      D
    end

    E -. host.docker.internal:11434 en Docker .- B
```

### Monolito modular

El backend se ejecuta como una sola aplicación Spring Boot, pero su código está separado por capacidades de negocio:

| Módulo backend | Responsabilidad |
|---|---|
| `auth` | Registro, login, JWT y recuperación de contraseña |
| `user` | Perfil, listado administrativo y estado de usuarios |
| `role` | Roles base del sistema |
| `brand` | CRUD de marcas |
| `product` | Catálogo, detalle, CRUD e imágenes |
| `productvariant` | Variantes por producto, sabor, nicotina y precio |
| `inventory` | Stock, bajo inventario y movimientos |
| `cart` / `cartitem` | Carrito persistente |
| `favorite` | Favoritos persistentes |
| `order` / `orderdetail` | Pedidos, detalle, estado y checkout |
| `payment` / `paymentmethod` | Pagos y métodos de pago |
| `ai` | Recomendaciones inteligentes para clientes |
| `admin` | Recomendaciones operativas para administradores |
| `shared` | DTOs comunes, enums y manejo global de errores |
| `config` | Seguridad, CORS, propiedades, uploads y bootstrap |

---

## 🛠️ Tecnologías utilizadas

### Backend

| Tecnología | Uso |
|---|---|
| Java 17 | Lenguaje principal |
| Spring Boot 3.3.5 | Framework backend |
| Spring Web | API REST |
| Spring Security | Seguridad y autorización |
| JWT / JJWT 0.12.6 | Autenticación stateless |
| Spring Data JPA / Hibernate | Persistencia |
| PostgreSQL Driver | Conexión a PostgreSQL |
| Spring Mail | Recuperación de contraseña vía SMTP |
| Bean Validation | Validación de DTOs |
| Maven | Build principal usado por Docker |
| Gradle | Wrapper y build alternativo disponible |

> Aunque existen `build.gradle` y `pom.xml`, el `Dockerfile` real usa **Maven** (`./mvnw -DskipTests package`).

### Frontend

| Tecnología | Uso |
|---|---|
| Angular 19.2 | SPA principal |
| TypeScript 5.7 | Lenguaje frontend |
| Angular Signals | Estado reactivo local |
| RxJS 7.8 | Flujos HTTP y datos compartidos |
| SCSS | Estilos |
| GSAP | Animaciones |
| Karma / Jasmine | Pruebas frontend |

### IA e infraestructura

| Tecnología | Uso |
|---|---|
| Ollama | Ejecución local de modelos |
| `gemma:2b` | Modelo configurado para recomendaciones |
| Docker Compose | Orquestación local |
| PostgreSQL 16 Alpine | Base de datos en contenedor |
| MailHog | SMTP y bandeja web de desarrollo |

---

## 📁 Estructura de carpetas

```text
BONGA SHOP/
├── backend/
│   ├── src/main/java/com/bongashop/backend/
│   │   ├── admin/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── brand/
│   │   ├── cart/
│   │   ├── cartitem/
│   │   ├── config/
│   │   ├── favorite/
│   │   ├── inventory/
│   │   ├── order/
│   │   ├── orderdetail/
│   │   ├── payment/
│   │   ├── paymentmethod/
│   │   ├── product/
│   │   ├── productvariant/
│   │   ├── role/
│   │   ├── shared/
│   │   └── user/
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   └── application-prod.yml
│   ├── postman/
│   │   └── BONGA-SHOP-Backend.postman_collection.json
│   ├── Dockerfile
│   ├── pom.xml
│   └── build.gradle
├── frontend/
│   ├── public/assets/
│   ├── src/app/
│   │   ├── core/
│   │   ├── features/
│   │   ├── layouts/
│   │   └── shared/
│   ├── src/environments/
│   ├── angular.json
│   └── package.json
├── database/
│   ├── init/01-init.sql
│   └── seeds/02-seed.sql
├── documentos/
│   ├── ollama-gemma-2b.md
│   ├── decisiones-tecnicas.md
│   ├── endpoints.xlsx
│   └── requisitos.xlsx
├── docker-compose.yml
├── LICENSE
└── README.md
```

---

## 🔙 Backend

El backend expone una API REST bajo el prefijo:

```text
/api/v1
```

Características reales del backend:

- Autenticación JWT con filtro propio `JwtAuthenticationFilter`.
- Seguridad stateless con `SessionCreationPolicy.STATELESS`.
- CORS permitido por defecto para `http://localhost:4200` y `http://127.0.0.1:4200`.
- Bootstrap automático de roles, administrador inicial y catálogo inicial.
- Persistencia con JPA/Hibernate y `ddl-auto: update`.
- Manejo global de errores en `GlobalExceptionHandler`.
- Upload de imágenes de productos bajo `/uploads/**`.
- Recuperación de contraseña usando SMTP; en Docker se usa MailHog.

### Datos iniciales

Al iniciar, `BongaBackendApplication` ejecuta:

1. Creación de roles base: `ROLE_ADMIN`, `ROLE_CLIENT`.
2. Creación/normalización del usuario administrador.
3. Carga o sincronización del catálogo inicial.

Catálogo semilla incluido en código:

| Marca | Producto |
|---|---|
| Urban Mist | Breeze Ice Duo |
| Neon Labs | Neon Citrus |
| Nocturne | Shadow Grape |
| Urban Mist | Metro Mango |
| Concrete | Concrete Mint |
| Neon Labs | Velvet Berry |
| Nocturne | Afterdark Cola |
| Urban Mist | Skyline Lychee |
| Concrete | Arctic Blueberry |

---

## 🎨 Frontend

El frontend es una SPA Angular con componentes standalone y rutas lazy-loaded.

### Rutas principales

| Ruta | Descripción | Protección |
|---|---|---|
| `/` | Home |
| `/products` | Catálogo |
| `/products/:slug` | Detalle de producto |
| `/wishlist` | Favoritos | Usuario autenticado |
| `/cart` | Carrito | Usuario autenticado |
| `/checkout` | Checkout | Usuario autenticado |
| `/orders` | Mis pedidos | Usuario autenticado |
| `/account` | Perfil | Usuario autenticado |
| `/restablecer` | Restablecimiento de contraseña |
| `/admin/resumen` | Dashboard admin | Admin |
| `/admin/productos` | Gestión de productos | Admin |
| `/admin/marcas` | Gestión de marcas | Admin |
| `/admin/inventario` | Inventario e historial | Admin |
| `/admin/pedidos` | Gestión de pedidos | Admin |

### Servicios destacados

| Servicio | Función |
|---|---|
| `auth.service.ts` | Login, registro, JWT y sesión en `localStorage` |
| `cart.service.ts` | Carrito persistente vía API |
| `wishlist.service.ts` | Favoritos persistentes vía API |
| `product.service.ts` | Catálogo y administración de productos |
| `inventory.service.ts` | Stock, movimientos y filtros |
| `order.service.ts` | Checkout, pedidos cliente y pedidos admin |
| `currency.service.ts` | Conversión visual COP/USD |
| `translation.service.ts` | Textos ES/EN |
| `vape-assistant.service.ts` | Integración con recomendaciones IA |
| `admin-recommendation.service.ts` | Recomendaciones operativas admin |

### Configuración de API

```ts
// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081/api/v1',
};
```

En producción:

```ts
apiUrl: '/api/v1'
```

---

## 🗄️ Base de datos

El proyecto usa **PostgreSQL** con entidades JPA. El esquema se actualiza automáticamente con Hibernate:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

Tablas principales derivadas de entidades:

| Tabla | Propósito |
|---|---|
| `roles` | Roles del sistema |
| `users` | Usuarios cliente/admin |
| `brands` | Marcas |
| `products` | Productos |
| `product_variants` | Variantes por sabor/nicotina/precio |
| `inventory` | Stock por variante |
| `inventory_movements` | Movimientos de inventario |
| `carts` | Carritos |
| `cart_items` | Items de carrito |
| `favorites` | Favoritos |
| `orders` | Pedidos |
| `order_details` | Items de pedido |
| `payment_methods` | Métodos de pago |
| `payments` | Pagos |
| `password_reset_tokens` | Tokens de recuperación |

> Los archivos `database/init/01-init.sql` y `database/seeds/02-seed.sql` existen como placeholders. La inicialización real actual ocurre desde JPA y servicios bootstrap del backend.

---

## 🤖 Sistema de IA

BONGA SHOP integra IA local con **Ollama** y el modelo **`gemma:2b`**.

### IA para clientes

Endpoint:

```http
POST /api/v1/ai/vape-recommendations
Authorization: Bearer <token>
```

El backend:

1. Lee preferencias del cliente.
2. Consulta variantes reales disponibles en PostgreSQL.
3. Calcula candidatos por afinidad.
4. Envía contexto limitado a Ollama.
5. Devuelve hasta 3 recomendaciones reales.
6. Si Ollama falla, devuelve fallback local con `aiAvailable=false`.

Ejemplo:

```bash
curl -X POST http://localhost:8081/api/v1/ai/vape-recommendations ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"flavors\":[\"Mentolados\"],\"intensity\":\"Media\",\"experience\":\"Fresca\"}"
```

### IA para administradores

Endpoint:

```http
GET /api/v1/admin/recommendations
Authorization: Bearer <admin-token>
```

El backend genera señales operativas reales desde:

- Stock actual.
- Ventas por movimientos de inventario.
- Pedidos recientes.
- Umbral de bajo stock.
- Tendencias por sabor o marca.

---

## 🐳 Docker

El archivo `docker-compose.yml` define:

| Servicio | Imagen/build | Puerto host | Puerto contenedor |
|---|---|---:|---:|
| `postgres` | `postgres:16-alpine` | No publicado | `5432` |
| `mailhog` | `mailhog/mailhog:latest` | `1025`, `8025` | `1025`, `8025` |
| `backend` | `./backend/Dockerfile` | `8081` | `8080` |

URLs con Docker:

| Servicio | URL |
|---|---|
| Backend API | `http://localhost:8081/api/v1` |
| MailHog UI | `http://localhost:8025` |
| Ollama host | `http://localhost:11434` |
| Ollama desde backend Docker | `http://host.docker.internal:11434` |

> PostgreSQL no está publicado al host en el Compose actual. El backend accede por la red interna con `DB_HOST=postgres`.

---

## ✅ Requisitos previos

| Herramienta | Versión recomendada |
|---|---|
| Git | Actual |
| Docker Desktop | Actual |
| Docker Compose | V2 |
| Java JDK | 17 |
| Node.js | 20+ recomendado para Angular |
| npm | Incluido con Node |
| PostgreSQL | 16 si ejecutas backend manualmente |
| Ollama | Actual |

---

## ⚙️ Variables de entorno

### Backend

| Variable | Valor por defecto | Uso |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` local / `prod` en Docker | Perfil Spring |
| `SERVER_PORT` | `8080` | Puerto interno backend |
| `DB_HOST` | `postgres` | Host PostgreSQL |
| `DB_PORT` | `5432` | Puerto PostgreSQL |
| `DB_NAME` | `bonga_shop` | Base de datos |
| `DB_USERNAME` | `postgres` | Usuario DB |
| `DB_PASSWORD` | `postgres` | Password DB |
| `JWT_SECRET` | `change-this-secret-key-for-bonga-shop-please-2026` | Firma JWT |
| `JWT_EXPIRATION_MINUTES` | `1440` | Duración del token |
| `APP_ADMIN_ENABLED` | `true` | Crear admin bootstrap |
| `APP_ADMIN_NAME` | `Bonga Admin` | Nombre admin |
| `APP_ADMIN_EMAIL` | `admin@bonga.shop` | Email admin |
| `APP_ADMIN_PASSWORD` | `Admin123!` | Password admin |
| `LOW_STOCK_THRESHOLD` | `5` | Umbral bajo stock |
| `OLLAMA_BASE_URL` | `http://localhost:11434` local / `http://host.docker.internal:11434` en Docker | API Ollama |
| `OLLAMA_MODEL` | `gemma:2b` | Modelo IA |
| `APP_FRONTEND_URL` | `http://localhost:4200` | Links de recuperación |
| `APP_MAIL_FROM` | `no-reply@bonga.shop` | Remitente |
| `MAIL_HOST` | vacío local / `mailhog` en Docker | SMTP |
| `MAIL_PORT` | `1025` | Puerto SMTP |
| `APP_UPLOADS_DIR` | `./uploads` local / `/app/uploads` en Docker | Archivos subidos |

### Frontend

La URL de API se define en:

```text
frontend/src/environments/environment.ts
frontend/src/environments/environment.prod.ts
```

---

## 🚀 Instalación completa

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd "BONGA SHOP"
```

### 2. Instalar dependencias frontend

```bash
cd frontend
npm install
```

### 3. Preparar IA local

```bash
ollama pull gemma:2b
```

Probar Ollama:

```bash
ollama run gemma:2b
```

### 4. Levantar backend, PostgreSQL y MailHog con Docker

Desde la raíz:

```bash
docker compose up --build
```

### 5. Levantar frontend

En otra terminal:

```bash
cd frontend
npm start
```

Abrir:

```text
http://localhost:4200
```

---

## ▶️ Cómo levantar el proyecto

### Opción recomendada: backend con Docker + frontend local

Terminal 1:

```bash
docker compose up --build
```

Terminal 2:

```bash
cd frontend
npm start
```

Accesos:

| Recurso | URL |
|---|---|
| Frontend | `http://localhost:4200` |
| API | `http://localhost:8081/api/v1` |
| MailHog | `http://localhost:8025` |

### Detener servicios Docker

```bash
docker compose down
```

### Detener y eliminar volúmenes

```bash
docker compose down -v
```

> Esto borra datos de PostgreSQL y uploads guardados en volúmenes Docker.

---

## 🧪 Ejecución manual sin Docker

### PostgreSQL manual

Crear base de datos:

```sql
CREATE DATABASE bonga_shop;
```

Configurar variables para backend local:

#### PowerShell

```powershell
$env:SPRING_PROFILES_ACTIVE="dev"
$env:SERVER_PORT="8080"
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="bonga_shop"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="postgres"
$env:OLLAMA_BASE_URL="http://localhost:11434"
$env:OLLAMA_MODEL="gemma:2b"
```

#### Bash

```bash
export SPRING_PROFILES_ACTIVE=dev
export SERVER_PORT=8080
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=bonga_shop
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_MODEL=gemma:2b
```

Ejecutar backend con Maven:

```bash
cd backend
./mvnw spring-boot:run
```

En Windows también puedes usar:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

> Si ejecutas el backend manualmente en `8080`, ajusta `frontend/src/environments/environment.ts` a `http://localhost:8080/api/v1`, o ejecuta el backend en `8081` con `SERVER_PORT=8081`.

### Frontend manual

```bash
cd frontend
npm install
npm start
```

---

## 🔐 Acceso administrador

El administrador inicial se crea automáticamente si `APP_ADMIN_ENABLED=true`.

| Campo | Valor por defecto |
|---|---|
| Email | `admin@bonga.shop` |
| Password | `Admin123!` |
| Rol | `ROLE_ADMIN` |

Acceso:

1. Abrir `http://localhost:4200`.
2. Iniciar sesión con las credenciales anteriores.
3. Entrar al panel en `/admin/resumen`.

> Para un entorno público, cambia `APP_ADMIN_PASSWORD` y `JWT_SECRET`.

---

## 📬 Recuperación de contraseña y MailHog

En Docker, el backend envía correos a MailHog:

| Servicio | URL/Puerto |
|---|---|
| SMTP | `mailhog:1025` |
| UI web | `http://localhost:8025` |

Flujo:

1. Solicitar recuperación desde el frontend.
2. Abrir `http://localhost:8025`.
3. Revisar el correo generado.
4. Usar el link hacia `/restablecer`.

---

## 📚 Swagger / documentación API

El estado actual del proyecto **no incluye Springdoc/OpenAPI ni Swagger UI** en `pom.xml` o `build.gradle`. Por eso no existe una ruta funcional como:

```text
/swagger-ui/index.html
/v3/api-docs
```

Alternativas reales incluidas:

- Colección Postman: `backend/postman/BONGA-SHOP-Backend.postman_collection.json`
- Endpoints documentados en este README.
- Archivo académico: `documentos/endpoints.xlsx`

Mejora futura sugerida para habilitar Swagger:

```xml
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.6.0</version>
</dependency>
```

Después de agregarlo y reiniciar:

```text
http://localhost:8081/swagger-ui/index.html
```

---

## 🔌 Endpoints principales

Base Docker:

```text
http://localhost:8081/api/v1
```

### Autenticación

| Método | Endpoint | Acceso |
|---|---|---|
| `POST` | `/auth/register` | Público |
| `POST` | `/auth/login` | Público |
| `POST` | `/auth/password-reset/request` | Público |
| `POST` | `/auth/password-reset/confirm` | Público |

Ejemplo login:

```bash
curl -X POST http://localhost:8081/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@bonga.shop\",\"password\":\"Admin123!\"}"
```

Usar token:

```http
Authorization: Bearer <token>
```

### Catálogo y marcas

| Método | Endpoint | Acceso |
|---|---|---|
| `GET` | `/brands` | Público |
| `POST` | `/brands` | Admin |
| `PUT` | `/brands/{id}` | Admin |
| `DELETE` | `/brands/{id}` | Admin |
| `GET` | `/products` | Público |
| `GET` | `/products/{id}` | Público |
| `POST` | `/products` | Admin |
| `PUT` | `/products/{id}` | Admin |
| `POST` | `/products/{id}/image` | Admin |
| `DELETE` | `/products/{id}` | Admin |
| `GET` | `/products/{productId}/variants` | Público |
| `POST` | `/products/{productId}/variants` | Admin |
| `PUT` | `/variants/{id}` | Admin |
| `DELETE` | `/variants/{id}` | Admin |

### Carrito y favoritos

| Método | Endpoint | Acceso |
|---|---|---|
| `GET` | `/cart` | Cliente/Admin |
| `POST` | `/cart/items` | Cliente/Admin |
| `PUT` | `/cart/items/{variantId}` | Cliente/Admin |
| `PATCH` | `/cart/items/{variantId}/variant` | Cliente/Admin |
| `DELETE` | `/cart/items/{variantId}` | Cliente/Admin |
| `DELETE` | `/cart/items` | Cliente/Admin |
| `GET` | `/favorites` | Cliente/Admin |
| `GET` | `/favorites/count` | Cliente/Admin |
| `POST` | `/favorites/{productId}` | Cliente/Admin |
| `DELETE` | `/favorites/{productId}` | Cliente/Admin |
| `DELETE` | `/favorites` | Cliente/Admin |

### Inventario

| Método | Endpoint | Acceso |
|---|---|---|
| `GET` | `/inventory` | Admin |
| `PUT` | `/inventory/{variantId}` | Admin |
| `GET` | `/inventory/movements` | Admin |

### Pedidos y pagos

| Método | Endpoint | Acceso |
|---|---|---|
| `POST` | `/orders` | Cliente/Admin |
| `GET` | `/orders/my-orders` | Cliente/Admin |
| `GET` | `/orders/{id}` | Cliente/Admin dueño o Admin |
| `GET` | `/orders` | Admin |
| `PATCH` | `/orders/{id}/status` | Admin |
| `GET` | `/orders/{orderId}/payments` | Cliente/Admin |
| `POST` | `/orders/{orderId}/payments` | Cliente/Admin |
| `PATCH` | `/payments/{paymentId}/status` | Admin |
| `GET` | `/payment-methods` | Cliente/Admin |
| `POST` | `/payment-methods` | Cliente/Admin |
| `DELETE` | `/payment-methods/{paymentMethodId}` | Cliente/Admin |

### Usuarios e IA

| Método | Endpoint | Acceso |
|---|---|---|
| `GET` | `/users/me` | Cliente/Admin |
| `PUT` | `/users/me` | Cliente/Admin |
| `GET` | `/users` | Admin |
| `PATCH` | `/users/{id}/status` | Admin |
| `POST` | `/ai/vape-recommendations` | Cliente/Admin |
| `GET` | `/admin/recommendations` | Admin |

---

## 🧭 Panel administrativo

El panel admin está disponible en:

```text
http://localhost:4200/admin/resumen
```

Secciones:

| Ruta | Función |
|---|---|
| `/admin/resumen` | Métricas, bajo stock, pedidos recientes y recomendaciones IA |
| `/admin/productos` | Crear, editar, eliminar productos, variantes, stock e imágenes |
| `/admin/marcas` | Crear, editar y eliminar marcas |
| `/admin/inventario` | Consultar stock, actualizar inventario y exportar historial |
| `/admin/pedidos` | Ver pedidos y cambiar estados |

### Exportación Excel

Desde `/admin/inventario`, el botón **Descargar historial Excel** genera un archivo:

```text
historial-inventario-YYYY-MM-DD.xls
```

La exportación se construye en frontend como HTML compatible con Excel usando los movimientos obtenidos desde:

```http
GET /api/v1/inventory/movements
```

---

## 🖼️ Capturas de pantalla

> Secciones preparadas para GitHub. Agrega aquí capturas reales del proyecto cuando estén disponibles.

### Home

```md
![Home](documentos/screenshots/home.png)
```

### Catálogo

```md
![Catálogo](documentos/screenshots/catalogo.png)
```

### Carrito y checkout

```md
![Checkout](documentos/screenshots/checkout.png)
```

### Panel administrativo

```md
![Admin](documentos/screenshots/admin.png)
```

### Recomendaciones IA

```md
![IA](documentos/screenshots/ia.png)
```

---

## 🧪 Pruebas

### Backend

```bash
cd backend
./mvnw test
```

Windows:

```powershell
cd backend
.\mvnw.cmd test
```

Pruebas existentes:

- `AuthServiceTest`
- `JwtServiceTest`
- `OrderServiceTest`
- `InventoryServiceTest`
- `UserServiceTest`
- `PasswordResetServiceTest`
- `AdminRecommendationServiceTest`

### Frontend

```bash
cd frontend
npm test
```

Pruebas existentes:

- `auth.service.spec.ts`
- `cart.service.spec.ts`
- `wishlist.service.spec.ts`

### Build frontend

```bash
cd frontend
npm run build
```

---

## 🧾 Comandos útiles

| Acción | Comando |
|---|---|
| Levantar Docker | `docker compose up --build` |
| Detener Docker | `docker compose down` |
| Detener y borrar datos | `docker compose down -v` |
| Ver logs backend | `docker compose logs -f backend` |
| Ver logs PostgreSQL | `docker compose logs -f postgres` |
| Ejecutar backend local | `cd backend && ./mvnw spring-boot:run` |
| Ejecutar frontend local | `cd frontend && npm start` |
| Build frontend | `cd frontend && npm run build` |
| Test backend | `cd backend && ./mvnw test` |
| Test frontend | `cd frontend && npm test` |
| Instalar modelo IA | `ollama pull gemma:2b` |
| Probar modelo IA | `ollama run gemma:2b` |

---

## 🔮 Posibles mejoras futuras

- Agregar Swagger/OpenAPI con Springdoc.
- Publicar PostgreSQL opcionalmente para administración externa en desarrollo.
- Agregar migraciones con Flyway o Liquibase.
- Servir frontend desde Nginx en Docker Compose.
- Crear pipeline CI/CD para tests y build.
- Añadir cobertura E2E con Playwright o Cypress.
- Mejorar observabilidad con logs estructurados y métricas.
- Implementar pasarela de pagos real.
- Añadir refresh tokens y rotación de credenciales.
- Externalizar catálogo semilla a migraciones versionadas.
- Añadir paginación avanzada y filtros admin más completos.
- Generar screenshots reales en `documentos/screenshots/`.

---

## 👥 Créditos

Proyecto desarrollado con fines académicos como proyecto final del corte 2 del curso:

> **Programación II**

### Dirección

| Nombre | GitHub |
|---|---|
| Arle Morales Ortiz | [@arlemorales27](https://github.com/arlemorales27) |

### Desarrolladores

| Nombre | GitHub |
|---|---|
| Nasly Mariana Gonzalez Fernandez | [@Mariana44-max](https://github.com/Mariana44-max) |
| Alejandro Ospina Rodriguez | [@Alejoor18](https://github.com/Alejoor18) |
| Esteban Bonilla Giraldo | [@estebanbonilla22](https://github.com/estebanbonilla22) |
| Santiago Leyton | [@SantiagoLeyton](https://github.com/SantiagoLeyton) |

---

## 📄 Licencia

Este proyecto se publica bajo una **licencia de uso libre para fines académicos, educativos y demostrativos**.

Puedes usar, estudiar, modificar y adaptar el código citando los créditos del proyecto original.

---

<div align="center">

**BONGA SHOP** · Marketplace premium académico · Spring Boot + Angular + PostgreSQL + Ollama

</div>
