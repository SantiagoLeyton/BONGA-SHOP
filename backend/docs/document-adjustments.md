# BONGA SHOP Backend Document Adjustments

## Source priority applied
1. `documentos/requisitos.xlsx`
2. `documentos/endpoints.xlsx`
3. `documentos/database.sql`

## Detected inconsistencies

- `documentos/database.sql` is empty, so there was no usable relational schema to implement directly.
- `requisitos.xlsx` asks for catalog filters by brand, flavor, and nicotine level, while `endpoints.xlsx` lists `search`, `brandId`, `minPrice`, `maxPrice`, `page`, and `size` for `GET /api/v1/products`.
- `requisitos.xlsx` says users can update `name`, `phone`, and basic profile data, while `endpoints.xlsx` only mentions `name` and `email` for `PUT /api/v1/users/me`.
- `requisitos.xlsx` requires active/published entities for public catalog visibility, but `endpoints.xlsx` does not expose explicit status fields in all admin payloads.

## Adjustments implemented

- The relational model was designed from the functional requirements and endpoints because the SQL source was empty.
- `GET /api/v1/products` supports the documented filters plus `flavor` and `nicotineLevel` to satisfy the catalog filtering requirement.
- `PUT /api/v1/users/me` accepts `name`, `email`, and `phone` so the profile update requirement is fully covered.
- Brands, products, and variants use a logical active flag.
  Public endpoints only expose active catalog records.
  Delete operations are implemented as logical deactivation to preserve order history and business integrity.
- Variants create their inventory row automatically with stock `0`, because inventory is managed separately through the inventory module.
- Orders start with status `CREATED` and stock is discounted immediately at order creation, matching the purchase confirmation rule.
