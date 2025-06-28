#!/bin/bash

echo "=== Testing Register API ==="
echo ""

# 테스트 데이터
EMAIL="test$(date +%s)@example.com"
PASSWORD="password123"
NAME="Test User"

echo "Request URL: http://localhost:3001/api/v1/auth/register"
echo "Request Data:"
echo "  email: $EMAIL"
echo "  password: $PASSWORD"
echo "  name: $NAME"
echo ""

echo "Sending request..."
echo ""

curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"$NAME\"
  }" \
  -v 2>&1 | grep -E "(< HTTP|< |{|})"|sed 's/< //'

echo ""
echo "=== Test Complete ==="