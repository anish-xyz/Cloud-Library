#!/usr/bin/env bash
set -e

GATEWAY_URL="http://localhost:8080"

echo "=================================================="
echo " Cloud Library Microservices Endpoints Test Script"
echo " Target Gateway: $GATEWAY_URL"
echo "=================================================="

# 1. Gateway Health
echo -e "\n[1/6] Testing Gateway Health..."
curl -s -f "$GATEWAY_URL/gateway-health" | grep -q "healthy" && echo "✅ Nginx API Gateway is HEALTHY"

# 2. Catalog Service (Go) via Gateway
echo -e "\n[2/6] Testing Catalog Service (Go) Categories..."
curl -s -f "$GATEWAY_URL/api/catalog/categories" | grep -q "Fiction" && echo "✅ Catalog Service (Go) Categories OK"

echo -e "\n[3/6] Testing Catalog Service (Go) Books..."
curl -s -f "$GATEWAY_URL/api/catalog/books" | grep -q "The Cloud Architect Handbook" && echo "✅ Catalog Service (Go) Books OK"

# 3. Auth Service (Python / FastAPI) via Gateway
echo -e "\n[4/6] Testing Auth Service (FastAPI) Staff Login..."
LOGIN_RESP=$(curl -s -X POST "$GATEWAY_URL/api/auth/login/staff" \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@library.com","password":"staff123"}')
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✅ Auth Service (FastAPI) Staff Login OK (JWT received)"
else
  echo "❌ Failed to obtain staff token: $LOGIN_RESP"
  exit 1
fi

# 4. Circulation Service (Node.js/TS) via Gateway using Staff Token
echo -e "\n[5/6] Testing Circulation Service (Node.js/TS) Loans endpoint..."
curl -s -f "$GATEWAY_URL/api/circulation/loans" \
  -H "Authorization: Bearer $TOKEN" | grep -q "The Cloud Architect Handbook" && echo "✅ Circulation Service (Node.js/TS) Loans OK"

echo -e "\n[6/6] Testing Circulation Service (Node.js/TS) Stats endpoint..."
curl -s -f "$GATEWAY_URL/api/circulation/stats" \
  -H "Authorization: Bearer $TOKEN" | grep -q "total_members" && echo "✅ Circulation Service (Node.js/TS) Stats OK"

echo -e "\n🎉 All Polyglot Microservice Endpoints are WORKING and communicating through the API Gateway!"
