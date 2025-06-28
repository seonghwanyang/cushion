#!/bin/bash

echo "🚀 Cushion Deployment Readiness Check"
echo "===================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -n "Checking Node.js version... "
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION == v20* ]]; then
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Required: v20.x, Found: $NODE_VERSION"
fi

# Check pnpm
echo -n "Checking pnpm... "
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}✓${NC} $PNPM_VERSION"
else
    echo -e "${RED}✗${NC} pnpm not found"
fi

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker not found"
fi

# Check environment files
echo -e "\n📁 Environment Files:"
for env_file in .env .env.development .env.staging .env.production; do
    echo -n "  $env_file: "
    if [ -f "$env_file" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC} Not found"
    fi
done

# Check backend build
echo -e "\n🔧 Backend Build:"
cd backend
echo -n "  TypeScript compilation... "
if npm run type-check &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} TypeScript errors found"
fi

echo -n "  Prisma client... "
if [ -d "node_modules/.prisma/client" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} Run 'pnpm prisma generate'"
fi

# Check frontend build
echo -e "\n🎨 Frontend Build:"
cd ../frontend
echo -n "  TypeScript compilation... "
if npm run type-check &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} TypeScript errors found"
fi

echo -n "  Next.js build... "
# Skip actual build check for now as it's time consuming
echo -e "${YELLOW}⚠${NC} Skipped (run 'npm run build' to test)"

cd ..

echo -e "\n===================================="
echo "📊 Summary:"
echo "  - Fix any ✗ issues before deployment"
echo "  - Review ⚠ warnings"
echo "  - Run integration tests"
echo "  - Update production secrets"