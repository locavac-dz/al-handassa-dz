# 📚 Al Handassa.dz — API Documentation

## Overview

REST API for Al Handassa.dz e-commerce platform. All endpoints require JWT authentication (except public endpoints).

**Base URL**: `http://localhost:5000/api`

---

## 🔐 Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "email": "user@example.com", ... }
}
```

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

---

## 📦 Products

### List Products
```http
GET /products?type=cours_pdf&limit=10&offset=0

Query Parameters:
- type: cours_pdf, td_pdf, ouvrage, logiciels, etc.
- category: béton, structure, topographie, etc.
- limit: results per page (default: 20)
- offset: pagination offset (default: 0)
- sort: rating, popularity, newest

Response:
{
  "data": [
    {
      "id": 1,
      "slug": "cours-beton-base",
      "title": "Cours Béton Armé",
      "price": 2500,
      "rating_avg": 4.5,
      "thumbnail_url": "/img/products/thumb.jpg"
    }
  ],
  "total": 500
}
```

### Search Products
```http
GET /products/search/query?q=béton

Response:
{
  "data": [
    { "id": 1, "title": "Cours Béton Armé", ... },
    { "id": 2, "title": "TP Béton", ... }
  ]
}
```

### Get Product Details
```http
GET /products/:slug

Response:
{
  "data": {
    "id": 1,
    "title": "Cours Béton Armé",
    "description": "...",
    "price": 2500,
    "file_url": "/uploads/cours-beton.pdf",
    "reviews": [ ... ]
  }
}
```

---

## 🛒 Cart & Checkout

### Create Order
```http
POST /orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "0123456789",
  "wilaya": "Alger",
  "payment_method": "card",
  "items": [
    { "id": 1, "title": "Cours Béton", "quantity": 1, "price": 2500 }
  ],
  "total_amount": 2500
}

Response:
{
  "success": true,
  "order_id": 123,
  "payment_url": "https://satim.dz/..."
}
```

### Get User Orders
```http
GET /orders
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": 123,
      "created_at": "2026-09-01T10:00:00Z",
      "total_amount": 2500,
      "status": "paid",
      "items": [ ... ]
    }
  ]
}
```

---

## 🎟️ Coupons

### Validate Coupon
```http
POST /coupons/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "WELCOME10",
  "amount": 5000
}

Response:
{
  "valid": true,
  "discount_type": "percent",
  "discount_amount": 500,
  "final_amount": 4500
}
```

### Available Coupons (Public)
```http
GET /coupons/available

Response:
{
  "data": [
    {
      "code": "WELCOME10",
      "type": "percent",
      "value": 10,
      "description": "10% de réduction"
    }
  ]
}
```

---

## 💙 Wishlist

**Frontend-only** (localStorage-based)

```javascript
// Add to wishlist
wishlist.addProduct(product);

// Get wishlist
wishlist.items;

// Remove from wishlist
wishlist.removeProduct(productId);
```

---

## 🎁 Loyalty Points

### Get Loyalty Status
```http
GET /loyalty/status
Authorization: Bearer {token}

Response:
{
  "points": 2500,
  "level": "Gold 🏆",
  "badges": ["🎯 Première centaine", "⭐ Niveau Silver"],
  "redemption_options": [
    { "points": 100, "reward": "10% de réduction" },
    { "points": 500, "reward": "Panier gratuit" }
  ]
}
```

### Redeem Points
```http
POST /loyalty/redeem
Authorization: Bearer {token}
Content-Type: application/json

{
  "redeemPoints": 100
}

Response:
{
  "success": true,
  "reward": 0.10,
  "remaining_points": 2400
}
```

### Leaderboard
```http
GET /loyalty/leaderboard

Response:
{
  "data": [
    { "rank": 1, "points": 10000, "level": "Gold 🏆" },
    { "rank": 2, "points": 5000, "level": "Silver 🥈" }
  ]
}
```

---

## 🤖 AI Assistant

### Ask Question
```http
POST /assistant
Content-Type: application/json

{
  "question": "Comment puis-je utiliser les coupons?",
  "context": { "page": "/index.html" }
}

Response:
{
  "answer": "Les coupons peuvent être appliqués au checkout..."
}
```

---

## 📊 Admin Analytics (Protected)

### Dashboard Stats
```http
GET /analytics/dashboard
Authorization: Bearer {admin_token}

Response:
{
  "total_revenue": 500000,
  "total_orders": 250,
  "total_users": 1500,
  "avg_order_value": 2000,
  "top_products": [ ... ],
  "sales_by_category": { ... }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Description du problème",
  "status": 400
}
```

### Common Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Server Error

---

## Rate Limiting

- 100 requests per 15 minutes per IP
- Headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Webhooks (Coming Soon)

- Order created
- Payment confirmed
- Shipment update
- Review posted

---

## SDK/Libraries

### JavaScript (Vanilla)
```javascript
const API = 'http://localhost:5000/api';
const token = localStorage.getItem('hds_token');

async function getProducts() {
  const res = await fetch(`${API}/products?limit=20`);
  return res.json();
}

async function createOrder(orderData) {
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  return res.json();
}
```

---

**Last Updated**: 2026-09-01
**Version**: 1.0.0
**Status**: ✅ Production Ready
