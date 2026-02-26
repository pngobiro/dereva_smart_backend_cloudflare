#!/bin/bash

# Test Dereva Smart API endpoints

API_URL="https://dereva-smart-backend.pngobiro.workers.dev"

echo "Testing Dereva Smart API..."
echo "================================"

# Test 1: Health check
echo -e "\n1. Health Check:"
curl -s "$API_URL/" | jq '.'

# Test 2: Get all modules
echo -e "\n2. Get All Modules:"
curl -s "$API_URL/api/content/modules" | jq '.'

# Test 3: Get B1 modules specifically
echo -e "\n3. Get B1 Modules:"
curl -s "$API_URL/api/content/modules?category=B1" | jq '.'

# Test 4: Get A1 modules
echo -e "\n4. Get A1 Modules:"
curl -s "$API_URL/api/content/modules?category=A1" | jq '.'

echo -e "\n================================"
echo "API tests complete!"
