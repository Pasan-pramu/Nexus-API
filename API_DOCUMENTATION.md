# 📘 Nexus API — Complete API Documentation & Testing Guide

> **Version:** 1.0.0  
> **Base URL:** `http://localhost:3000`  
> **Authentication:** JWT via HTTP-only cookie (`token`)  
> **Database:** PostgreSQL (Neon) with Drizzle ORM  
> **Security:** Arcjet (bot detection, shield, rate limiting)

---

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Global Error Responses](#global-error-responses)
3. [API Endpoints by Module](#api-endpoints-by-module)
   - [Health & Root](#1-health--root)
   - [Auth](#2-auth-module)
   - [Users](#3-users-module)
   - [Categories](#4-categories-module)
   - [Products](#5-products-module)
   - [Suppliers](#6-suppliers-module)
   - [Purchase Requests (PR)](#7-purchase-requests-module)
   - [Purchase Orders (PO)](#8-purchase-orders-module)
   - [Inventory](#9-inventory-module)
4. [APIs That Modify Inventory](#apis-that-modify-inventory)
5. [Admin-Only & Manager-Only Endpoints](#admin-only--manager-only-endpoints)
6. [Testing Guide](#testing-guide)

---

## Authentication & Security

### JWT Cookie-Based Auth

All authenticated endpoints require a valid JWT token stored in an HTTP-only cookie named `token`. The token is automatically set on sign-up and sign-in, and cleared on sign-out.

**JWT Payload:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "admin"
}
```

### Roles

| Role      | Description                                                      |
|-----------|------------------------------------------------------------------|
| `user`    | Default role. Can perform basic CRUD operations.                 |
| `admin`   | Full access. Can delete resources, adjust stock, cancel POs.     |
| `manager` | Can approve/reject purchase requests (alongside admin).          |

### Rate Limiting (Arcjet)

Requests are rate-limited via a sliding window (1 minute) based on the user's role:

| Role    | Max Requests / Minute |
|---------|-----------------------|
| `admin` | 20                    |
| `user`  | 10                    |
| `guest` | 5                     |

### Bot Detection

Arcjet's `detectBot` blocks automated clients. Allowed bot categories: `SEARCH_ENGINE`, `PREVIEW`, `MONITOR`, `TOOL`.

---

## Global Error Responses

These error responses can be returned from any endpoint:

| Status | Error                | Description                                       |
|--------|----------------------|---------------------------------------------------|
| `400`  | Validation failed    | Request body or params failed Zod validation      |
| `401`  | Unauthorized         | Missing or invalid/expired JWT token               |
| `403`  | Forbidden            | Insufficient role/permissions                      |
| `403`  | Forbidden            | Bot detection triggered                            |
| `403`  | Forbidden            | Shield protection triggered                        |
| `404`  | Route not found      | Endpoint does not exist                            |
| `429`  | Too Many Requests    | Rate limit exceeded                                |
| `500`  | Internal server error| Unexpected server error                            |

**Validation Error Response Format:**
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

---

## API Endpoints by Module

---

### 1. Health & Root

#### `GET /`

| Field           | Value                                        |
|-----------------|----------------------------------------------|
| **Description** | Root endpoint, returns a hello message        |
| **Auth**        | ❌ No                                         |
| **Role**        | Any                                           |

**Success Response (200):**
```
Hello from Nexus
```

---

#### `GET /health`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Health check endpoint                          |
| **Auth**        | ❌ No                                          |
| **Role**        | Any                                            |

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-28T12:00:00.000Z",
  "uptime": 123.456
}
```

---

#### `GET /api`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | API welcome message                            |
| **Auth**        | ❌ No                                          |
| **Role**        | Any                                            |

**Success Response (200):**
```json
{
  "message": "Welcome to the Nexus API. It is Running"
}
```

---

### 2. Auth Module

Base path: `/api/auth`

---

#### `POST /api/auth/sign-up`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Register a new user                            |
| **Auth**        | ❌ No                                          |
| **Role**        | Any                                            |

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "user"
}
```

| Field      | Type     | Required | Constraints                                  |
|------------|----------|----------|----------------------------------------------|
| `name`     | `string` | ✅       | Min 2, max 255 chars, trimmed                |
| `email`    | `string` | ✅       | Valid email, max 255, lowercased, trimmed     |
| `password` | `string` | ✅       | Min 6, max 128 chars                         |
| `role`     | `string` | ❌       | `"user"` or `"admin"`. Default: `"user"`     |

**Success Response (201):**
```json
{
  "message": "User registered",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

> **Note:** JWT token is set as an HTTP-only cookie `token`.

**Error Responses:**

| Status | Condition                  | Response                                       |
|--------|----------------------------|-------------------------------------------------|
| `400`  | Validation failed          | `{ "error": "Validation failed", "details": [...] }` |
| `409`  | Email already exists       | `{ "error": "Email already exist" }`             |

---

#### `POST /api/auth/sign-in`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Authenticate and sign in                       |
| **Auth**        | ❌ No                                          |
| **Role**        | Any                                            |

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

| Field      | Type     | Required | Constraints                      |
|------------|----------|----------|----------------------------------|
| `email`    | `string` | ✅       | Valid email, lowercased, trimmed |
| `password` | `string` | ✅       | Min 1 char                      |

**Success Response (200):**
```json
{
  "message": "User signed in successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

> **Note:** JWT token is set as an HTTP-only cookie `token`.

**Error Responses:**

| Status | Condition                       | Response                                       |
|--------|---------------------------------|-------------------------------------------------|
| `400`  | Validation failed               | `{ "error": "Validation failed", "details": [...] }` |
| `401`  | Invalid email or password       | `{ "error": "Invalid credentials" }`             |

---

#### `POST /api/auth/sign-out`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Sign out and clear auth cookie                 |
| **Auth**        | ❌ No                                          |
| **Role**        | Any                                            |

**Request Body:** None

**Success Response (200):**
```json
{
  "message": "User signed out successfully"
}
```

> **Note:** The `token` cookie is cleared.

---

### 3. Users Module

Base path: `/api/users`

---

#### `GET /api/users`

| Field           | Value                                          |
|-----------------|------------------------------------------------|
| **Description** | Get all users                                   |
| **Auth**        | ✅ Yes                                          |
| **Role**        | Any authenticated user                          |

**Request Body:** None

**Success Response (200):**
```json
{
  "message": "Successfully retrieved all users",
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "created_at": "2026-02-28T12:00:00.000Z",
      "updated_at": "2026-02-28T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### `GET /api/users/:id`

| Field           | Value                                          |
|-----------------|------------------------------------------------|
| **Description** | Get a single user by ID                         |
| **Auth**        | ✅ Yes                                          |
| **Role**        | Any authenticated user                          |

**URL Parameters:**

| Param | Type     | Constraints                |
|-------|----------|----------------------------|
| `id`  | `string` | Numeric string (e.g. "1") |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved user",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2026-02-28T12:00:00.000Z",
    "updated_at": "2026-02-28T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition         | Response                                         |
|--------|-------------------|--------------------------------------------------|
| `400`  | Invalid ID format | `{ "error": "Validation failed", "details": [...] }` |
| `404`  | User not found    | `{ "error": "Not found", "message": "User not found" }` |

---

#### `PUT /api/users/:id`

| Field           | Value                                          |
|-----------------|------------------------------------------------|
| **Description** | Update a user by ID                             |
| **Auth**        | ✅ Yes                                          |
| **Role**        | Own account or Admin (Admin required to change role) |

**URL Parameters:**

| Param | Type     | Constraints                |
|-------|----------|----------------------------|
| `id`  | `string` | Numeric string (e.g. "1") |

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "newpass123",
  "role": "admin"
}
```

| Field      | Type     | Required | Constraints                                   |
|------------|----------|----------|-----------------------------------------------|
| `name`     | `string` | ❌       | Min 2, max 255 chars, trimmed                 |
| `email`    | `string` | ❌       | Valid email, max 255, lowercased, trimmed      |
| `password` | `string` | ❌       | Min 6, max 128 chars                          |
| `role`     | `string` | ❌       | `"user"` or `"admin"` — **Admin only**        |

**Success Response (200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin"
  }
}
```

**Error Responses:**

| Status | Condition                        | Response                                                 |
|--------|----------------------------------|----------------------------------------------------------|
| `400`  | Validation failed                | `{ "error": "Validation failed", "details": [...] }`    |
| `403`  | Updating other user (non-admin)  | `{ "error": "Forbidden", "message": "You can only update your own information" }` |
| `403`  | Changing role (non-admin)        | `{ "error": "Forbidden", "message": "Only admin users can change roles" }` |
| `404`  | User not found                   | `{ "error": "Not found", "message": "User not found" }` |

---

#### `DELETE /api/users/:id`

| Field           | Value                                          |
|-----------------|------------------------------------------------|
| **Description** | Delete a user by ID                             |
| **Auth**        | ✅ Yes                                          |
| **Role**        | Own account or Admin                            |

**URL Parameters:**

| Param | Type     | Constraints                |
|-------|----------|----------------------------|
| `id`  | `string` | Numeric string (e.g. "1") |

**Success Response (200):**
```json
{
  "message": "User deleted successfully",
  "user": { ... }
}
```

**Error Responses:**

| Status | Condition                          | Response                                                  |
|--------|------------------------------------|-----------------------------------------------------------|
| `400`  | Invalid ID format                  | `{ "error": "Validation failed", "details": [...] }`     |
| `403`  | Deleting other user (non-admin)    | `{ "error": "Forbidden", "message": "You can only delete your own account" }` |
| `404`  | User not found                     | `{ "error": "Not found", "message": "User not found" }`  |

---

### 4. Categories Module

Base path: `/api/categories`

---

#### `POST /api/categories`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Create a new category                          |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "isActive": true
}
```

| Field         | Type      | Required | Constraints                   |
|---------------|-----------|----------|-------------------------------|
| `name`        | `string`  | ✅       | Min 2, max 100 chars, trimmed|
| `description` | `string`  | ❌       | Max 500 chars, trimmed       |
| `isActive`    | `boolean` | ❌       | Default: `true`              |

**Success Response (201):**
```json
{
  "message": "Category created successfully",
  "category": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "is_active": true,
    "created_at": "2026-02-28T12:00:00.000Z",
    "updated_at": "2026-02-28T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition                    | Response                                                    |
|--------|------------------------------|-------------------------------------------------------------|
| `400`  | Validation failed            | `{ "error": "Validation failed", "details": [...] }`       |
| `409`  | Category name already exists | `{ "error": "Conflict", "message": "Category with this name already exists" }` |

---

#### `GET /api/categories`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get all categories                             |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved all categories",
  "categories": [ ... ],
  "count": 5
}
```

---

#### `GET /api/categories/:id`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get a single category by ID                    |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved category",
  "category": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "is_active": true,
    "created_at": "2026-02-28T12:00:00.000Z",
    "updated_at": "2026-02-28T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition         | Response                                             |
|--------|-------------------|------------------------------------------------------|
| `400`  | Invalid ID format | `{ "error": "Validation failed", "details": [...] }` |
| `404`  | Not found         | `{ "error": "Not found", "message": "Category not found" }` |

---

#### `PUT /api/categories/:id`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Update a category by ID                        |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Request Body:**
```json
{
  "name": "Updated Electronics",
  "description": "Updated description",
  "isActive": false
}
```

| Field         | Type      | Required | Constraints                   |
|---------------|-----------|----------|-------------------------------|
| `name`        | `string`  | ❌       | Min 2, max 100 chars, trimmed|
| `description` | `string`  | ❌       | Max 500 chars, trimmed       |
| `isActive`    | `boolean` | ❌       |                              |

**Success Response (200):**
```json
{
  "message": "Category updated successfully",
  "category": { ... }
}
```

**Error Responses:**

| Status | Condition                    | Response                                                    |
|--------|------------------------------|-------------------------------------------------------------|
| `400`  | Validation failed            | `{ "error": "Validation failed", "details": [...] }`       |
| `404`  | Category not found           | `{ "error": "Not found", "message": "Category not found" }` |
| `409`  | Category name already exists | `{ "error": "Conflict", "message": "Category with this name already exists" }` |

---

#### `DELETE /api/categories/:id` 🔒 Admin Only

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Delete a category by ID                        |
| **Auth**        | ✅ Yes                                         |
| **Role**        | **Admin only**                                 |

**Success Response (200):**
```json
{
  "message": "Category deleted successfully",
  "category": { ... }
}
```

**Error Responses:**

| Status | Condition          | Response                                             |
|--------|--------------------|------------------------------------------------------|
| `400`  | Invalid ID format  | `{ "error": "Validation failed", "details": [...] }` |
| `403`  | Not admin          | `{ "error": "Forbidden", "message": "Admin access required" }` |
| `404`  | Category not found | `{ "error": "Not found", "message": "Category not found" }` |

---

### 5. Products Module

Base path: `/api/products`

---

#### `POST /api/products`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Create a new product                           |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Request Body:**
```json
{
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse",
  "category": "Electronics",
  "price": 29.99,
  "status": "active",
  "stock": 100
}
```

| Field         | Type              | Required | Constraints                                          |
|---------------|-------------------|----------|------------------------------------------------------|
| `name`        | `string`          | ✅       | Min 2, max 255 chars, trimmed                        |
| `description` | `string`          | ❌       | Max 1000 chars, trimmed                              |
| `category`    | `string`          | ✅       | Min 2, max 100 chars, trimmed                        |
| `price`       | `number\|string`  | ✅       | Positive number or numeric string (up to 2 decimals) |
| `status`      | `string`          | ❌       | `"active"`, `"inactive"`, `"out_of_stock"`. Default: `"active"` |
| `stock`       | `number`          | ❌       | Non-negative integer. Default: `0`                   |

**Success Response (201):**
```json
{
  "message": "Product created successfully",
  "product": {
    "id": 1,
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "category": "Electronics",
    "price": "29.99",
    "status": "active",
    "stock": 100,
    "created_at": "2026-02-28T12:00:00.000Z",
    "updated_at": "2026-02-28T12:00:00.000Z"
  }
}
```

---

#### `GET /api/products`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get all products (with optional filters)       |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Query Parameters:**

| Param      | Type     | Required | Constraints                                         |
|------------|----------|----------|-----------------------------------------------------|
| `category` | `string` | ❌       | Filter by category name                             |
| `status`   | `string` | ❌       | `"active"`, `"inactive"`, `"out_of_stock"`          |
| `search`   | `string` | ❌       | Search term                                          |

**Example:** `GET /api/products?category=Electronics&status=active`

**Success Response (200):**
```json
{
  "message": "Successfully retrieved all products",
  "products": [ ... ],
  "count": 10
}
```

---

#### `GET /api/products/:id`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get a single product by ID                     |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved product",
  "product": { ... }
}
```

**Error Responses:**

| Status | Condition         | Response                                             |
|--------|-------------------|------------------------------------------------------|
| `400`  | Invalid ID format | `{ "error": "Validation failed", "details": [...] }` |
| `404`  | Not found         | `{ "error": "Not found", "message": "Product not found" }` |

---

#### `PUT /api/products/:id`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Update a product by ID                         |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Request Body:**
```json
{
  "name": "Updated Mouse",
  "description": "Updated description",
  "category": "Electronics",
  "price": 34.99,
  "status": "inactive",
  "stock": 50
}
```

All fields are optional. Same constraints as create.

**Success Response (200):**
```json
{
  "message": "Product updated successfully",
  "product": { ... }
}
```

**Error Responses:**

| Status | Condition         | Response                                             |
|--------|-------------------|------------------------------------------------------|
| `400`  | Validation failed | `{ "error": "Validation failed", "details": [...] }` |
| `404`  | Product not found | `{ "error": "Not found", "message": "Product not found" }` |

---

#### `DELETE /api/products/:id` 🔒 Admin Only

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Delete a product by ID                         |
| **Auth**        | ✅ Yes                                         |
| **Role**        | **Admin only**                                 |

**Success Response (200):**
```json
{
  "message": "Product deleted successfully",
  "product": { ... }
}
```

**Error Responses:**

| Status | Condition         | Response                                             |
|--------|-------------------|------------------------------------------------------|
| `400`  | Invalid ID format | `{ "error": "Validation failed", "details": [...] }` |
| `403`  | Not admin         | `{ "error": "Forbidden", "message": "Admin access required" }` |
| `404`  | Product not found | `{ "error": "Not found", "message": "Product not found" }` |

---

### 6. Suppliers Module

Base path: `/api/suppliers`

---

#### `POST /api/suppliers`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Create a new supplier                          |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Request Body:**
```json
{
  "name": "ACME Corp",
  "email": "contact@acme.com",
  "phone": "+1-555-0100",
  "address": "123 Main St, Springfield",
  "status": "active"
}
```

| Field     | Type     | Required | Constraints                                           |
|-----------|----------|----------|-------------------------------------------------------|
| `name`    | `string` | ✅       | Min 2, max 255 chars, trimmed                         |
| `email`   | `string` | ✅       | Valid email, max 255, lowercased, trimmed              |
| `phone`   | `string` | ❌       | Max 50 chars, trimmed                                 |
| `address` | `string` | ❌       | Max 1000 chars, trimmed                               |
| `status`  | `string` | ❌       | `"active"`, `"inactive"`, `"suspended"`. Default: `"active"` |

**Success Response (201):**
```json
{
  "message": "Supplier created successfully",
  "supplier": {
    "id": 1,
    "name": "ACME Corp",
    "email": "contact@acme.com",
    "phone": "+1-555-0100",
    "address": "123 Main St, Springfield",
    "status": "active",
    "created_at": "2026-02-28T12:00:00.000Z",
    "updated_at": "2026-02-28T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition                     | Response                                                        |
|--------|-------------------------------|-----------------------------------------------------------------|
| `400`  | Validation failed             | `{ "error": "Validation failed", "details": [...] }`           |
| `409`  | Supplier email already exists | `{ "error": "Conflict", "message": "Supplier with this email already exists" }` |

---

#### `GET /api/suppliers`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get all suppliers                              |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved all suppliers",
  "suppliers": [ ... ],
  "count": 5
}
```

---

#### `GET /api/suppliers/:id`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get a single supplier by ID                    |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved supplier",
  "supplier": { ... }
}
```

**Error Responses:**

| Status | Condition         | Response                                              |
|--------|-------------------|-------------------------------------------------------|
| `400`  | Invalid ID format | `{ "error": "Validation failed", "details": [...] }`  |
| `404`  | Not found         | `{ "error": "Not found", "message": "Supplier not found" }` |

---

#### `PUT /api/suppliers/:id`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Update a supplier by ID                        |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Request Body:** All fields optional. Same constraints as create.

**Success Response (200):**
```json
{
  "message": "Supplier updated successfully",
  "supplier": { ... }
}
```

**Error Responses:**

| Status | Condition                     | Response                                                        |
|--------|-------------------------------|-----------------------------------------------------------------|
| `400`  | Validation failed             | `{ "error": "Validation failed", "details": [...] }`           |
| `404`  | Supplier not found            | `{ "error": "Not found", "message": "Supplier not found" }`    |
| `409`  | Supplier email already exists | `{ "error": "Conflict", "message": "Supplier with this email already exists" }` |

---

#### `DELETE /api/suppliers/:id` 🔒 Admin Only

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Delete a supplier by ID                        |
| **Auth**        | ✅ Yes                                         |
| **Role**        | **Admin only**                                 |

**Success Response (200):**
```json
{
  "message": "Supplier deleted successfully",
  "supplier": { ... }
}
```

**Error Responses:**

| Status | Condition          | Response                                              |
|--------|--------------------|-------------------------------------------------------|
| `400`  | Invalid ID format  | `{ "error": "Validation failed", "details": [...] }`  |
| `403`  | Not admin          | `{ "error": "Forbidden", "message": "Admin access required" }` |
| `404`  | Supplier not found | `{ "error": "Not found", "message": "Supplier not found" }` |

---

### 7. Purchase Requests Module

Base path: `/api/purchase-requests`

---

#### `POST /api/purchase-requests`

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Create a new purchase request                     |
| **Auth**        | ✅ Yes                                            |
| **Role**        | Any authenticated user                            |

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "product_name": "Wireless Mouse",
      "quantity": 50,
      "unit_price": 29.99,
      "total_price": 1499.50
    }
  ],
  "notes": "Urgent restock needed"
}
```

| Field               | Type     | Required | Constraints                 |
|---------------------|----------|----------|-----------------------------|
| `items`             | `array`  | ✅       | Min 1 item                  |
| `items[].product_id`| `number` | ✅       | Positive integer            |
| `items[].product_name`| `string` | ✅     | Min 1, max 255 chars        |
| `items[].quantity`  | `number` | ✅       | Positive integer            |
| `items[].unit_price`| `number` | ✅       | Positive number             |
| `items[].total_price`| `number`| ✅       | Positive number             |
| `notes`             | `string` | ❌       | Max 1000 chars, trimmed     |

> **Note:** `requester_id` is automatically set from the authenticated user's JWT token.

**Success Response (201):**
```json
{
  "message": "Purchase request created successfully",
  "purchase_request": {
    "id": 1,
    "requester_id": 1,
    "items": [ ... ],
    "total_cost": "1499.50",
    "status": "pending",
    "notes": "Urgent restock needed",
    "approved_by": null,
    "approved_at": null,
    "rejection_reason": null,
    "created_at": "2026-02-28T12:00:00.000Z",
    "updated_at": "2026-02-28T12:00:00.000Z"
  }
}
```

---

#### `GET /api/purchase-requests`

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Get all purchase requests (with optional filters) |
| **Auth**        | ✅ Yes                                            |
| **Role**        | Any authenticated user                            |

**Query Parameters:**

| Param          | Type     | Required | Constraints                                       |
|----------------|----------|----------|---------------------------------------------------|
| `status`       | `string` | ❌       | `"pending"`, `"approved"`, `"rejected"`, `"cancelled"` |
| `requester_id` | `string` | ❌       | Numeric string                                     |

**Example:** `GET /api/purchase-requests?status=pending`

**Success Response (200):**
```json
{
  "message": "Successfully retrieved all purchase requests",
  "purchase_requests": [ ... ],
  "count": 5
}
```

---

#### `GET /api/purchase-requests/:id`

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Get a single purchase request by ID               |
| **Auth**        | ✅ Yes                                            |
| **Role**        | Any authenticated user                            |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved purchase request",
  "purchase_request": { ... }
}
```

**Error Responses:**

| Status | Condition         | Response                                                     |
|--------|-------------------|--------------------------------------------------------------|
| `400`  | Invalid ID format | `{ "error": "Validation failed", "details": [...] }`        |
| `404`  | Not found         | `{ "error": "Not found", "message": "Purchase request not found" }` |

---

#### `PUT /api/purchase-requests/:id`

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Update a purchase request (only if pending)       |
| **Auth**        | ✅ Yes                                            |
| **Role**        | Any authenticated user                            |

**Request Body:**
```json
{
  "items": [ ... ],
  "notes": "Updated notes"
}
```

All fields are optional. Same item constraints as create.

**Success Response (200):**
```json
{
  "message": "Purchase request updated successfully",
  "purchase_request": { ... }
}
```

**Error Responses:**

| Status | Condition                   | Response                                                     |
|--------|-----------------------------|--------------------------------------------------------------|
| `400`  | Validation failed           | `{ "error": "Validation failed", "details": [...] }`        |
| `400`  | PR is not pending           | `{ "error": "Bad request", "message": "Cannot update a purchase request that is not pending" }` |
| `404`  | PR not found                | `{ "error": "Not found", "message": "Purchase request not found" }` |

---

#### `DELETE /api/purchase-requests/:id`

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Delete a purchase request (only if pending)       |
| **Auth**        | ✅ Yes                                            |
| **Role**        | Any authenticated user                            |

**Success Response (200):**
```json
{
  "message": "Purchase request deleted successfully",
  "purchase_request": { ... }
}
```

**Error Responses:**

| Status | Condition                   | Response                                                     |
|--------|-----------------------------|--------------------------------------------------------------|
| `400`  | Invalid ID format           | `{ "error": "Validation failed", "details": [...] }`        |
| `400`  | PR is not pending           | `{ "error": "Bad request", "message": "Cannot delete a purchase request that is not pending" }` |
| `404`  | PR not found                | `{ "error": "Not found", "message": "Purchase request not found" }` |

---

#### `POST /api/purchase-requests/:id/approve` 🔒 Admin or Manager Only

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Approve a pending purchase request                |
| **Auth**        | ✅ Yes                                            |
| **Role**        | **Admin or Manager only**                         |

**Request Body:**
```json
{
  "notes": "Approved for Q1 budget"
}
```

| Field   | Type     | Required | Constraints           |
|---------|----------|----------|-----------------------|
| `notes` | `string` | ❌       | Max 500 chars, trimmed|

**Success Response (200):**
```json
{
  "message": "Purchase request approved successfully",
  "purchase_request": {
    "id": 1,
    "status": "approved",
    "approved_by": 2,
    "approved_at": "2026-02-28T12:00:00.000Z",
    ...
  }
}
```

**Error Responses:**

| Status | Condition                   | Response                                                     |
|--------|-----------------------------|--------------------------------------------------------------|
| `400`  | PR is not pending           | `{ "error": "Bad request", "message": "Only pending purchase requests can be approved" }` |
| `403`  | Not admin/manager           | `{ "error": "Forbidden", "message": "Admin or manager access required" }` |
| `404`  | PR not found                | `{ "error": "Not found", "message": "Purchase request not found" }` |

---

#### `POST /api/purchase-requests/:id/reject` 🔒 Admin or Manager Only

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Reject a pending purchase request                 |
| **Auth**        | ✅ Yes                                            |
| **Role**        | **Admin or Manager only**                         |

**Request Body:**
```json
{
  "rejection_reason": "Budget exceeded for this quarter"
}
```

| Field              | Type     | Required | Constraints                    |
|--------------------|----------|----------|--------------------------------|
| `rejection_reason` | `string` | ✅       | Min 5, max 500 chars, trimmed |

**Success Response (200):**
```json
{
  "message": "Purchase request rejected successfully",
  "purchase_request": {
    "id": 1,
    "status": "rejected",
    "rejection_reason": "Budget exceeded for this quarter",
    ...
  }
}
```

**Error Responses:**

| Status | Condition                   | Response                                                     |
|--------|-----------------------------|--------------------------------------------------------------|
| `400`  | Validation failed           | `{ "error": "Validation failed", "details": [...] }`        |
| `400`  | PR is not pending           | `{ "error": "Bad request", "message": "Only pending purchase requests can be rejected" }` |
| `403`  | Not admin/manager           | `{ "error": "Forbidden", "message": "Admin or manager access required" }` |
| `404`  | PR not found                | `{ "error": "Not found", "message": "Purchase request not found" }` |

---

### 8. Purchase Orders Module

Base path: `/api/purchase-orders`

---

#### `POST /api/purchase-orders`

| Field           | Value                                                     |
|-----------------|-----------------------------------------------------------|
| **Description** | Create a purchase order from an approved purchase request  |
| **Auth**        | ✅ Yes                                                     |
| **Role**        | Any authenticated user                                     |

**Request Body:**
```json
{
  "supplier_id": 1,
  "pr_id": 1,
  "items": [
    {
      "product_id": 1,
      "product_name": "Wireless Mouse",
      "quantity": 50,
      "unit_price": 29.99,
      "total_price": 1499.50
    }
  ],
  "notes": "Rush delivery requested"
}
```

| Field               | Type     | Required | Constraints                 |
|---------------------|----------|----------|-----------------------------|
| `supplier_id`       | `number` | ✅       | Positive integer            |
| `pr_id`             | `number` | ✅       | Positive integer (must reference an **approved** PR) |
| `items`             | `array`  | ✅       | Min 1 item                  |
| `items[].product_id`| `number` | ✅       | Positive integer            |
| `items[].product_name`| `string` | ✅     | Min 1, max 255 chars        |
| `items[].quantity`  | `number` | ✅       | Positive integer            |
| `items[].unit_price`| `number` | ✅       | Positive number             |
| `items[].total_price`| `number`| ✅       | Positive number             |
| `notes`             | `string` | ❌       | Max 1000 chars, trimmed     |

**Success Response (201):**
```json
{
  "message": "Purchase order created successfully",
  "purchase_order": {
    "id": 1,
    "supplier_id": 1,
    "pr_id": 1,
    "items": [ ... ],
    "total_amount": "1499.50",
    "status": "pending",
    "notes": "Rush delivery requested",
    "created_by": 1,
    "received_at": null,
    "received_by": null,
    "cancelled_by": null,
    "cancelled_at": null,
    "cancellation_reason": null,
    "created_at": "2026-02-28T12:00:00.000Z",
    "updated_at": "2026-02-28T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition                   | Response                                                     |
|--------|-----------------------------|--------------------------------------------------------------|
| `400`  | Validation failed           | `{ "error": "Validation failed", "details": [...] }`        |
| `400`  | PR not approved             | `{ "error": "Bad request", "message": "Purchase order can only be created from approved purchase requests" }` |
| `404`  | PR not found                | `{ "error": "Not found", "message": "Purchase request not found" }` |

---

#### `GET /api/purchase-orders`

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Get all purchase orders (with optional filters)   |
| **Auth**        | ✅ Yes                                            |
| **Role**        | Any authenticated user                            |

**Query Parameters:**

| Param         | Type     | Required | Constraints                                          |
|---------------|----------|----------|------------------------------------------------------|
| `status`      | `string` | ❌       | `"pending"`, `"approved"`, `"received"`, `"cancelled"` |
| `supplier_id` | `string` | ❌       | Numeric string                                        |
| `pr_id`       | `string` | ❌       | Numeric string                                        |

**Example:** `GET /api/purchase-orders?status=pending&supplier_id=1`

**Success Response (200):**
```json
{
  "message": "Successfully retrieved all purchase orders",
  "purchase_orders": [ ... ],
  "count": 3
}
```

---

#### `GET /api/purchase-orders/:id`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get a single purchase order by ID              |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved purchase order",
  "purchase_order": { ... }
}
```

**Error Responses:**

| Status | Condition         | Response                                                    |
|--------|-------------------|-------------------------------------------------------------|
| `400`  | Invalid ID format | `{ "error": "Validation failed", "details": [...] }`       |
| `404`  | Not found         | `{ "error": "Not found", "message": "Purchase order not found" }` |

---

#### `PUT /api/purchase-orders/:id`

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Update a purchase order (only if pending)         |
| **Auth**        | ✅ Yes                                            |
| **Role**        | Any authenticated user                            |

**Request Body:**
```json
{
  "supplier_id": 2,
  "items": [ ... ],
  "notes": "Updated delivery instructions"
}
```

| Field         | Type     | Required | Constraints         |
|---------------|----------|----------|---------------------|
| `supplier_id` | `number` | ❌       | Positive integer    |
| `items`       | `array`  | ❌       | Min 1 item          |
| `notes`       | `string` | ❌       | Max 1000 chars      |

**Success Response (200):**
```json
{
  "message": "Purchase order updated successfully",
  "purchase_order": { ... }
}
```

**Error Responses:**

| Status | Condition              | Response                                                    |
|--------|------------------------|-------------------------------------------------------------|
| `400`  | Validation failed      | `{ "error": "Validation failed", "details": [...] }`       |
| `400`  | PO is not pending      | `{ "error": "Bad request", "message": "Cannot update a purchase order that is not pending" }` |
| `404`  | PO not found           | `{ "error": "Not found", "message": "Purchase order not found" }` |

---

#### `POST /api/purchase-orders/:id/cancel` 🔒 Admin Only

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Cancel a purchase order                           |
| **Auth**        | ✅ Yes                                            |
| **Role**        | **Admin only**                                    |

**Request Body:**
```json
{
  "cancellation_reason": "Supplier unable to fulfill order"
}
```

| Field                 | Type     | Required | Constraints                    |
|-----------------------|----------|----------|--------------------------------|
| `cancellation_reason` | `string` | ✅       | Min 5, max 500 chars, trimmed |

**Success Response (200):**
```json
{
  "message": "Purchase order cancelled successfully",
  "purchase_order": {
    "id": 1,
    "status": "cancelled",
    "cancelled_by": 1,
    "cancelled_at": "2026-02-28T12:00:00.000Z",
    "cancellation_reason": "Supplier unable to fulfill order",
    ...
  }
}
```

**Error Responses:**

| Status | Condition                      | Response                                                    |
|--------|--------------------------------|-------------------------------------------------------------|
| `400`  | Validation failed              | `{ "error": "Validation failed", "details": [...] }`       |
| `400`  | PO already cancelled           | `{ "error": "Bad request", "message": "Purchase order is already cancelled" }` |
| `400`  | PO already received            | `{ "error": "Bad request", "message": "Cannot cancel a purchase order that has been received" }` |
| `403`  | Not admin                      | `{ "error": "Forbidden", "message": "Admin access required" }` |
| `404`  | PO not found                   | `{ "error": "Not found", "message": "Purchase order not found" }` |

---

#### `POST /api/purchase-orders/:id/receive` ⚠️ Modifies Inventory

| Field           | Value                                                       |
|-----------------|-------------------------------------------------------------|
| **Description** | Mark a purchase order as received and update inventory       |
| **Auth**        | ✅ Yes                                                       |
| **Role**        | Any authenticated user                                       |

**Request Body:**
```json
{
  "notes": "All items received in good condition"
}
```

| Field   | Type     | Required | Constraints           |
|---------|----------|----------|-----------------------|
| `notes` | `string` | ❌       | Max 500 chars, trimmed|

**Success Response (200):**
```json
{
  "message": "Purchase order marked as received successfully",
  "purchase_order": {
    "id": 1,
    "status": "received",
    "received_by": 1,
    "received_at": "2026-02-28T12:00:00.000Z",
    ...
  }
}
```

> **⚠️ Side Effect:** This endpoint automatically:
> 1. Increases `products.stock` for each item in the PO
> 2. Updates or creates `inventory` records with increased quantities

**Error Responses:**

| Status | Condition                   | Response                                                    |
|--------|-----------------------------|-------------------------------------------------------------|
| `400`  | Validation failed           | `{ "error": "Validation failed", "details": [...] }`       |
| `400`  | PO already received         | `{ "error": "Bad request", "message": "Purchase order is already marked as received" }` |
| `400`  | PO is cancelled             | `{ "error": "Bad request", "message": "Cannot mark a cancelled purchase order as received" }` |
| `404`  | PO not found                | `{ "error": "Not found", "message": "Purchase order not found" }` |

---

### 9. Inventory Module

Base path: `/api/inventory`

---

#### `GET /api/inventory`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get all inventory records (with optional filters) |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Query Parameters:**

| Param       | Type     | Required | Constraints                     |
|-------------|----------|----------|---------------------------------|
| `product_id`| `string` | ❌       | Numeric string                  |
| `low_stock` | `string` | ❌       | `"true"` or `"false"`          |

**Example:** `GET /api/inventory?low_stock=true`

**Success Response (200):**
```json
{
  "message": "Successfully retrieved inventory",
  "inventory": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Wireless Mouse",
      "quantity": 50,
      "min_threshold": 10,
      "is_low_stock": false,
      "created_at": "2026-02-28T12:00:00.000Z",
      "updated_at": "2026-02-28T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### `GET /api/inventory/alerts`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get products with stock below minimum threshold|
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved low stock alerts",
  "alerts": [
    {
      "id": 1,
      "product_id": 3,
      "product_name": "USB Cable",
      "quantity": 2,
      "min_threshold": 10,
      "shortage": 8,
      "created_at": "2026-02-28T12:00:00.000Z",
      "updated_at": "2026-02-28T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### `GET /api/inventory/:id`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get a single inventory record by ID            |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved inventory item",
  "inventory": { ... }
}
```

**Error Responses:**

| Status | Condition         | Response                                                  |
|--------|-------------------|-----------------------------------------------------------|
| `400`  | Invalid ID format | `{ "error": "Validation failed", "details": [...] }`     |
| `404`  | Not found         | `{ "error": "Not found", "message": "Inventory item not found" }` |

---

#### `GET /api/inventory/product/:product_id`

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Get inventory record by product ID             |
| **Auth**        | ✅ Yes                                         |
| **Role**        | Any authenticated user                         |

**Success Response (200):**
```json
{
  "message": "Successfully retrieved inventory item",
  "inventory": { ... }
}
```

**Error Responses:**

| Status | Condition            | Response                                                  |
|--------|----------------------|-----------------------------------------------------------|
| `400`  | Invalid product ID   | `{ "error": "Validation failed", "message": "Invalid product ID" }` |
| `404`  | Not found            | `{ "error": "Not found", "message": "Inventory item not found for this product" }` |

---

#### `POST /api/inventory/adjust` 🔒 Admin Only ⚠️ Modifies Inventory

| Field           | Value                                         |
|-----------------|-----------------------------------------------|
| **Description** | Manually adjust stock quantity for a product   |
| **Auth**        | ✅ Yes                                         |
| **Role**        | **Admin only**                                 |

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": -10,
  "reason": "Damaged goods removed from stock"
}
```

| Field        | Type     | Required | Constraints                                    |
|--------------|----------|----------|------------------------------------------------|
| `product_id` | `number` | ✅       | Positive integer                               |
| `quantity`   | `number` | ✅       | Integer (positive = add, negative = subtract)  |
| `reason`     | `string` | ✅       | Min 5, max 500 chars, trimmed                 |

> **Note:** If no inventory record exists for the product, one will be created automatically with `quantity: 0` before applying the adjustment.

**Success Response (200):**
```json
{
  "message": "Stock adjusted successfully",
  "inventory": {
    "id": 1,
    "product_id": 1,
    "quantity": 40,
    "min_threshold": 10,
    "created_at": "2026-02-28T12:00:00.000Z",
    "updated_at": "2026-02-28T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition                        | Response                                                  |
|--------|----------------------------------|-----------------------------------------------------------|
| `400`  | Validation failed                | `{ "error": "Validation failed", "details": [...] }`     |
| `400`  | Would result in negative stock   | `{ "error": "Bad request", "message": "Adjustment would result in negative stock quantity" }` |
| `403`  | Not admin                        | `{ "error": "Forbidden", "message": "Admin access required" }` |

---

#### `PUT /api/inventory/product/:product_id/threshold` 🔒 Admin Only

| Field           | Value                                            |
|-----------------|--------------------------------------------------|
| **Description** | Update the minimum stock threshold for a product  |
| **Auth**        | ✅ Yes                                            |
| **Role**        | **Admin only**                                    |

**Request Body:**
```json
{
  "min_threshold": 25
}
```

| Field           | Type     | Required | Constraints            |
|-----------------|----------|----------|------------------------|
| `min_threshold` | `number` | ✅       | Non-negative integer   |

> **Note:** If no inventory record exists for the product, one will be created with `quantity: 0` and the given threshold.

**Success Response (200):**
```json
{
  "message": "Minimum threshold updated successfully",
  "inventory": {
    "id": 1,
    "product_id": 1,
    "quantity": 50,
    "min_threshold": 25,
    "created_at": "2026-02-28T12:00:00.000Z",
    "updated_at": "2026-02-28T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition          | Response                                                  |
|--------|--------------------|-----------------------------------------------------------|
| `400`  | Validation failed  | `{ "error": "Validation failed", "details": [...] }`     |
| `400`  | Invalid product ID | `{ "error": "Validation failed", "message": "Invalid product ID" }` |
| `403`  | Not admin          | `{ "error": "Forbidden", "message": "Admin access required" }` |

---

## APIs That Modify Inventory

| Endpoint                                       | How It Affects Inventory                                                    |
|------------------------------------------------|-----------------------------------------------------------------------------|
| `POST /api/purchase-orders/:id/receive`        | ⬆️ Increases `products.stock` and `inventory.quantity` for all PO items      |
| `POST /api/inventory/adjust`                   | ⬆️⬇️ Directly adjusts `inventory.quantity` (add or subtract)                |
| `PUT /api/inventory/product/:product_id/threshold` | 📏 Updates the `min_threshold` for low-stock alerts                     |

> **Note:** There is **no budget module** currently implemented. The `total_cost` field on Purchase Requests and `total_amount` on Purchase Orders track monetary values, but there is no dedicated budget tracking or enforcement system.

---

## Admin-Only & Manager-Only Endpoints

### 🔒 Admin-Only Endpoints

| Method   | Endpoint                                          | Action                          |
|----------|---------------------------------------------------|---------------------------------|
| `DELETE` | `/api/products/:id`                               | Delete a product                |
| `DELETE` | `/api/categories/:id`                             | Delete a category               |
| `DELETE` | `/api/suppliers/:id`                              | Delete a supplier               |
| `POST`   | `/api/purchase-orders/:id/cancel`                 | Cancel a purchase order         |
| `POST`   | `/api/inventory/adjust`                           | Adjust stock quantity           |
| `PUT`    | `/api/inventory/product/:product_id/threshold`    | Update min stock threshold      |

### 🔒 Admin or Manager Endpoints

| Method | Endpoint                                    | Action                            |
|--------|---------------------------------------------|-----------------------------------|
| `POST` | `/api/purchase-requests/:id/approve`        | Approve a purchase request        |
| `POST` | `/api/purchase-requests/:id/reject`         | Reject a purchase request         |

### 🔐 Self-or-Admin Endpoints

| Method   | Endpoint            | Rule                                            |
|----------|---------------------|-------------------------------------------------|
| `PUT`    | `/api/users/:id`    | Users can update their own profile; admin can update any. Only admin can change `role`. |
| `DELETE` | `/api/users/:id`    | Users can delete their own account; admin can delete any. |

---

## Testing Guide

### Prerequisites

1. **Server running** at `http://localhost:3000`
2. **Database migrated:** `npm run db:migrate`
3. **Postman** (recommended) or **cURL** configured to:
   - Send/receive cookies (Postman does this automatically)
   - Set `Content-Type: application/json`

### Recommended Testing Order

Follow this order to satisfy data dependencies:

```
1. Auth (sign-up admin → sign-up user → sign-in)
2. Categories (create → list → get by ID → update → delete)
3. Products (create → list with filters → get by ID → update → delete)
4. Suppliers (create → list → get by ID → update → delete)
5. Purchase Requests (create → list → get → update → approve/reject → delete)
6. Purchase Orders (create from approved PR → list → get → update → receive → cancel)
7. Inventory (list → alerts → get by ID → get by product → adjust stock → update threshold)
8. Users (list → get by ID → update → delete)
```

---

### Step 1: Create Admin Account

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "name": "Admin User",
    "email": "admin@nexus.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### Step 2: Create Regular User Account

```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "name": "Regular User",
    "email": "user@nexus.com",
    "password": "user1234",
    "role": "user"
  }'
```

### Step 3: Sign In as Admin

```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@nexus.com",
    "password": "admin123"
  }'
```

### Step 4: Create a Category

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices and accessories"
  }'
```

### Step 5: Create a Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "category": "Electronics",
    "price": 29.99,
    "status": "active",
    "stock": 100
  }'
```

### Step 6: Create a Supplier

```bash
curl -X POST http://localhost:3000/api/suppliers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Tech Supplies Inc",
    "email": "sales@techsupplies.com",
    "phone": "+1-555-0100",
    "address": "456 Industrial Ave, Tech City"
  }'
```

### Step 7: Create a Purchase Request

```bash
curl -X POST http://localhost:3000/api/purchase-requests \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "items": [
      {
        "product_id": 1,
        "product_name": "Wireless Mouse",
        "quantity": 50,
        "unit_price": 25.00,
        "total_price": 1250.00
      }
    ],
    "notes": "Restock for Q1"
  }'
```

### Step 8: Approve the Purchase Request (Admin/Manager)

```bash
curl -X POST http://localhost:3000/api/purchase-requests/1/approve \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "notes": "Approved for Q1 budget"
  }'
```

### Step 9: Create a Purchase Order

```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "supplier_id": 1,
    "pr_id": 1,
    "items": [
      {
        "product_id": 1,
        "product_name": "Wireless Mouse",
        "quantity": 50,
        "unit_price": 25.00,
        "total_price": 1250.00
      }
    ],
    "notes": "Standard delivery"
  }'
```

### Step 10: Receive the Purchase Order (Updates Inventory)

```bash
curl -X POST http://localhost:3000/api/purchase-orders/1/receive \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "notes": "All items received in good condition"
  }'
```

### Step 11: Check Inventory

```bash
curl -X GET http://localhost:3000/api/inventory \
  -b cookies.txt
```

### Step 12: Check Low Stock Alerts

```bash
curl -X GET http://localhost:3000/api/inventory/alerts \
  -b cookies.txt
```

### Step 13: Adjust Stock (Admin Only)

```bash
curl -X POST http://localhost:3000/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "product_id": 1,
    "quantity": -5,
    "reason": "Damaged items removed from stock"
  }'
```

### Step 14: Update Stock Threshold (Admin Only)

```bash
curl -X PUT http://localhost:3000/api/inventory/product/1/threshold \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "min_threshold": 20
  }'
```

---

### Edge Cases to Test

#### Authentication & Authorization

| Test Case                                                  | Expected Status |
|------------------------------------------------------------|-----------------|
| Access any authenticated endpoint without cookie           | `401`           |
| Access any authenticated endpoint with expired/invalid JWT | `401`           |
| Regular user tries to delete a product                     | `403`           |
| Regular user tries to approve a purchase request           | `403`           |
| Regular user tries to cancel a purchase order              | `403`           |
| Regular user tries to adjust stock                         | `403`           |
| Regular user tries to change another user's role           | `403`           |
| Regular user tries to delete another user's account        | `403`           |

#### Validation Errors

| Test Case                                        | Expected Status |
|--------------------------------------------------|-----------------|
| Sign up with email shorter than valid format     | `400`           |
| Sign up with password less than 6 chars          | `400`           |
| Create product with empty name                   | `400`           |
| Create product with negative price               | `400`           |
| Create PR with empty items array                 | `400`           |
| Create PO with invalid `supplier_id` (0 or neg)  | `400`           |
| Adjust stock with reason less than 5 chars       | `400`           |
| Pass non-numeric ID in URL (`/api/products/abc`) | `400`           |

#### Business Logic Errors

| Test Case                                                    | Expected Status |
|--------------------------------------------------------------|-----------------|
| Sign up with an already-registered email                     | `409`           |
| Create a category with a duplicate name                      | `409`           |
| Create a supplier with a duplicate email                     | `409`           |
| Create a PO from a non-approved PR                           | `400`           |
| Update a PR that has already been approved                   | `400`           |
| Delete a PR that has already been approved                   | `400`           |
| Approve an already-approved PR                               | `400`           |
| Reject an already-approved PR                                | `400`           |
| Update a PO that is not pending                              | `400`           |
| Cancel a PO that is already cancelled                        | `400`           |
| Cancel a PO that has been received                           | `400`           |
| Receive a PO that is already received                        | `400`           |
| Receive a PO that is cancelled                               | `400`           |
| Adjust stock that would result in negative quantity           | `400`           |
| Get a user/product/category/supplier that doesn't exist       | `404`           |
| Access a non-existent route                                   | `404`           |

#### Rate Limiting

| Test Case                                                | Expected Status |
|----------------------------------------------------------|-----------------|
| Send > 5 requests in 1 minute as guest                   | `429`           |
| Send > 10 requests in 1 minute as regular user           | `429`           |
| Send > 20 requests in 1 minute as admin                  | `429`           |

---

### Postman Collection Tips

1. **Environment Variables:**
   - `base_url`: `http://localhost:3000`
   - Postman automatically handles cookies — no manual token setup needed

2. **Collection Structure:**
   ```
   📁 Nexus API
   ├── 📁 Health
   │   ├── GET /
   │   ├── GET /health
   │   └── GET /api
   ├── 📁 Auth
   │   ├── POST Sign Up (Admin)
   │   ├── POST Sign Up (User)
   │   ├── POST Sign In
   │   └── POST Sign Out
   ├── 📁 Users
   │   ├── GET All Users
   │   ├── GET User by ID
   │   ├── PUT Update User
   │   └── DELETE User
   ├── 📁 Categories
   │   ├── POST Create Category
   │   ├── GET All Categories
   │   ├── GET Category by ID
   │   ├── PUT Update Category
   │   └── DELETE Category (Admin)
   ├── 📁 Products
   │   ├── POST Create Product
   │   ├── GET All Products
   │   ├── GET Product by ID
   │   ├── PUT Update Product
   │   └── DELETE Product (Admin)
   ├── 📁 Suppliers
   │   ├── POST Create Supplier
   │   ├── GET All Suppliers
   │   ├── GET Supplier by ID
   │   ├── PUT Update Supplier
   │   └── DELETE Supplier (Admin)
   ├── 📁 Purchase Requests
   │   ├── POST Create PR
   │   ├── GET All PRs
   │   ├── GET PR by ID
   │   ├── PUT Update PR
   │   ├── DELETE PR
   │   ├── POST Approve PR (Admin/Manager)
   │   └── POST Reject PR (Admin/Manager)
   ├── 📁 Purchase Orders
   │   ├── POST Create PO
   │   ├── GET All POs
   │   ├── GET PO by ID
   │   ├── PUT Update PO
   │   ├── POST Cancel PO (Admin)
   │   └── POST Receive PO (Modifies Inventory)
   └── 📁 Inventory
       ├── GET All Inventory
       ├── GET Low Stock Alerts
       ├── GET Inventory by ID
       ├── GET Inventory by Product ID
       ├── POST Adjust Stock (Admin)
       └── PUT Update Threshold (Admin)
   ```

---

## API Summary Table

| #  | Method   | Endpoint                                        | Auth | Role              | Description                           |
|----|----------|-------------------------------------------------|------|-------------------|---------------------------------------|
| 1  | `GET`    | `/`                                             | ❌   | Any               | Root hello message                    |
| 2  | `GET`    | `/health`                                       | ❌   | Any               | Health check                          |
| 3  | `GET`    | `/api`                                          | ❌   | Any               | API welcome message                   |
| 4  | `POST`  | `/api/auth/sign-up`                              | ❌   | Any               | Register a new user                   |
| 5  | `POST`  | `/api/auth/sign-in`                              | ❌   | Any               | Sign in                               |
| 6  | `POST`  | `/api/auth/sign-out`                             | ❌   | Any               | Sign out                              |
| 7  | `GET`   | `/api/users`                                     | ✅   | Any               | Get all users                         |
| 8  | `GET`   | `/api/users/:id`                                 | ✅   | Any               | Get user by ID                        |
| 9  | `PUT`   | `/api/users/:id`                                 | ✅   | Self / Admin      | Update user                           |
| 10 | `DELETE`| `/api/users/:id`                                 | ✅   | Self / Admin      | Delete user                           |
| 11 | `POST`  | `/api/categories`                                | ✅   | Any               | Create category                       |
| 12 | `GET`   | `/api/categories`                                | ✅   | Any               | Get all categories                    |
| 13 | `GET`   | `/api/categories/:id`                            | ✅   | Any               | Get category by ID                    |
| 14 | `PUT`   | `/api/categories/:id`                            | ✅   | Any               | Update category                       |
| 15 | `DELETE`| `/api/categories/:id`                            | ✅   | **Admin**         | Delete category                       |
| 16 | `POST`  | `/api/products`                                  | ✅   | Any               | Create product                        |
| 17 | `GET`   | `/api/products`                                  | ✅   | Any               | Get all products (filterable)         |
| 18 | `GET`   | `/api/products/:id`                              | ✅   | Any               | Get product by ID                     |
| 19 | `PUT`   | `/api/products/:id`                              | ✅   | Any               | Update product                        |
| 20 | `DELETE`| `/api/products/:id`                              | ✅   | **Admin**         | Delete product                        |
| 21 | `POST`  | `/api/suppliers`                                 | ✅   | Any               | Create supplier                       |
| 22 | `GET`   | `/api/suppliers`                                 | ✅   | Any               | Get all suppliers                     |
| 23 | `GET`   | `/api/suppliers/:id`                             | ✅   | Any               | Get supplier by ID                    |
| 24 | `PUT`   | `/api/suppliers/:id`                             | ✅   | Any               | Update supplier                       |
| 25 | `DELETE`| `/api/suppliers/:id`                             | ✅   | **Admin**         | Delete supplier                       |
| 26 | `POST`  | `/api/purchase-requests`                         | ✅   | Any               | Create purchase request               |
| 27 | `GET`   | `/api/purchase-requests`                         | ✅   | Any               | Get all PRs (filterable)              |
| 28 | `GET`   | `/api/purchase-requests/:id`                     | ✅   | Any               | Get PR by ID                          |
| 29 | `PUT`   | `/api/purchase-requests/:id`                     | ✅   | Any               | Update PR (pending only)              |
| 30 | `DELETE`| `/api/purchase-requests/:id`                     | ✅   | Any               | Delete PR (pending only)              |
| 31 | `POST`  | `/api/purchase-requests/:id/approve`             | ✅   | **Admin/Manager** | Approve PR                            |
| 32 | `POST`  | `/api/purchase-requests/:id/reject`              | ✅   | **Admin/Manager** | Reject PR                             |
| 33 | `POST`  | `/api/purchase-orders`                           | ✅   | Any               | Create PO (from approved PR)          |
| 34 | `GET`   | `/api/purchase-orders`                           | ✅   | Any               | Get all POs (filterable)              |
| 35 | `GET`   | `/api/purchase-orders/:id`                       | ✅   | Any               | Get PO by ID                          |
| 36 | `PUT`   | `/api/purchase-orders/:id`                       | ✅   | Any               | Update PO (pending only)              |
| 37 | `POST`  | `/api/purchase-orders/:id/cancel`                | ✅   | **Admin**         | Cancel PO                             |
| 38 | `POST`  | `/api/purchase-orders/:id/receive`               | ✅   | Any               | Receive PO ⚠️ *modifies inventory*    |
| 39 | `GET`   | `/api/inventory`                                 | ✅   | Any               | Get all inventory (filterable)        |
| 40 | `GET`   | `/api/inventory/alerts`                          | ✅   | Any               | Get low stock alerts                  |
| 41 | `GET`   | `/api/inventory/:id`                             | ✅   | Any               | Get inventory by ID                   |
| 42 | `GET`   | `/api/inventory/product/:product_id`             | ✅   | Any               | Get inventory by product ID           |
| 43 | `POST`  | `/api/inventory/adjust`                          | ✅   | **Admin**         | Adjust stock ⚠️ *modifies inventory*  |
| 44 | `PUT`   | `/api/inventory/product/:product_id/threshold`   | ✅   | **Admin**         | Update min threshold                  |

**Total Endpoints: 44**

---

*Generated from actual codebase analysis — routes, controllers, services, middleware, models, and validation schemas.*

