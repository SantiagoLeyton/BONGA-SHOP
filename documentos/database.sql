-- BONGA SHOP
-- PostgreSQL reference schema
-- This document reflects the backend domain model expected after Phase 4.
-- JPA remains the source used by the application at runtime; this SQL is the structural reference.

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE role_name AS ENUM (
    'ROLE_ADMIN',
    'ROLE_CLIENT'
);

CREATE TYPE order_status AS ENUM (
    'CREATED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);

CREATE TYPE cart_status AS ENUM (
    'ACTIVE',
    'CHECKED_OUT',
    'ABANDONED'
);

CREATE TYPE payment_method_type AS ENUM (
    'CARD',
    'BANK_TRANSFER',
    'WALLET',
    'CASH_ON_DELIVERY',
    'OTHER'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'AUTHORIZED',
    'CAPTURED',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);

-- ============================================================
-- CORE SECURITY AND USERS
-- ============================================================

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name role_name NOT NULL UNIQUE
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles (id),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_users_active ON users (active);

-- ============================================================
-- CATALOG
-- ============================================================

CREATE TABLE brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands (id),
    name VARCHAR(150) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_brand_id ON products (brand_id);
CREATE INDEX idx_products_active ON products (active);
CREATE INDEX idx_products_name ON products (name);

CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products (id),
    flavor VARCHAR(120) NOT NULL,
    nicotine_level VARCHAR(60) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX idx_product_variants_active ON product_variants (active);

CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    variant_id BIGINT NOT NULL UNIQUE REFERENCES product_variants (id),
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_inventory_stock_non_negative CHECK (stock >= 0)
);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id),
    status order_status NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    shipping_recipient VARCHAR(120) NOT NULL,
    shipping_phone VARCHAR(30) NOT NULL,
    shipping_address VARCHAR(255) NOT NULL,
    shipping_city VARCHAR(120) NOT NULL,
    notes VARCHAR(500),
    placed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_placed_at ON orders (placed_at DESC);

CREATE TABLE order_details (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders (id),
    variant_id BIGINT NOT NULL REFERENCES product_variants (id),
    product_name VARCHAR(150) NOT NULL,
    variant_description VARCHAR(180) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    CONSTRAINT chk_order_details_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_order_details_order_id ON order_details (order_id);
CREATE INDEX idx_order_details_variant_id ON order_details (variant_id);

-- ============================================================
-- PHASE 4: FAVORITES
-- ============================================================

CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id),
    product_id BIGINT NOT NULL REFERENCES products (id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_favorites_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX idx_favorites_user_created_at ON favorites (user_id, created_at DESC);
CREATE INDEX idx_favorites_product_id ON favorites (product_id);

-- ============================================================
-- PHASE 4: PERSISTENT CART
-- ============================================================

CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id),
    status cart_status NOT NULL,
    order_id BIGINT UNIQUE REFERENCES orders (id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carts_user_status ON carts (user_id, status);
CREATE INDEX idx_carts_updated_at ON carts (updated_at DESC);

-- Recommended PostgreSQL invariant for one active cart per user.
-- If the project later adopts schema migrations, this index should be created there.
CREATE UNIQUE INDEX uk_carts_single_active_per_user
    ON carts (user_id)
    WHERE status = 'ACTIVE';

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES product_variants (id),
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_cart_items_cart_variant UNIQUE (cart_id, variant_id),
    CONSTRAINT chk_cart_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items (cart_id);
CREATE INDEX idx_cart_items_variant_id ON cart_items (variant_id);

-- ============================================================
-- PHASE 4: PAYMENT METHODS AND PAYMENTS
-- ============================================================

CREATE TABLE payment_methods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id),
    type payment_method_type NOT NULL,
    provider VARCHAR(60) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    last_four VARCHAR(4),
    expiration_month INTEGER,
    expiration_year INTEGER,
    token_reference VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    default_method BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_payment_methods_expiration_month
        CHECK (expiration_month IS NULL OR expiration_month BETWEEN 1 AND 12)
);

CREATE INDEX idx_payment_methods_user_active ON payment_methods (user_id, active);
CREATE INDEX idx_payment_methods_user_default ON payment_methods (user_id, default_method);

-- Recommended PostgreSQL invariant for one default method per user.
CREATE UNIQUE INDEX uk_payment_methods_single_default_per_user
    ON payment_methods (user_id)
    WHERE default_method = TRUE AND active = TRUE;

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders (id),
    user_id BIGINT NOT NULL REFERENCES users (id),
    payment_method_id BIGINT REFERENCES payment_methods (id),
    status payment_status NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    provider VARCHAR(60) NOT NULL,
    transaction_reference VARCHAR(120) UNIQUE,
    provider_payment_id VARCHAR(120),
    failure_reason VARCHAR(500),
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_payments_amount_non_negative CHECK (amount >= 0)
);

CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_user_status ON payments (user_id, status);
CREATE INDEX idx_payments_created_at ON payments (created_at DESC);

-- ============================================================
-- RELATIONSHIP SUMMARY
-- ============================================================
-- roles 1 --- n users
-- brands 1 --- n products
-- products 1 --- n product_variants
-- product_variants 1 --- 1 inventory
-- users 1 --- n orders
-- orders 1 --- n order_details
-- users 1 --- n favorites
-- products 1 --- n favorites
-- users 1 --- n carts
-- carts 1 --- n cart_items
-- product_variants 1 --- n cart_items
-- users 1 --- n payment_methods
-- orders 1 --- n payments
-- users 1 --- n payments
-- payment_methods 1 --- n payments
