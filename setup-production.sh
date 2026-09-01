#!/bin/bash

# 🚀 Al Handassa.dz — Production Setup Script for Railway

set -e

echo "================================"
echo "Al Handassa.dz — Production Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found!${NC}"
    echo "Run this script from the project root directory"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production

echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npm run migrate || echo "Migrations may have already run"

echo -e "${YELLOW}🔐 Creating admin user...${NC}"
echo ""
echo "Enter admin credentials:"
read -p "Admin email: " ADMIN_EMAIL
read -sp "Admin password: " ADMIN_PASSWORD
echo ""

# Create admin (requires backend to be configured)
if [ -f "backend/reset-admin-password.js" ]; then
    node backend/reset-admin-password.js << EOF
$ADMIN_EMAIL
$ADMIN_PASSWORD
EOF
else
    echo -e "${YELLOW}⚠️  Admin setup script not found${NC}"
fi

echo -e "${YELLOW}📧 Testing email configuration...${NC}"
if [ -f "backend/test-email.js" ]; then
    node backend/test-email.js || echo "Email test optional"
else
    echo -e "${YELLOW}⚠️  Email test script not found${NC}"
fi

echo ""
echo -e "${GREEN}✅ Production setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify in Railway dashboard"
echo "2. Test at: https://your-railway-url.railway.app"
echo "3. Login with admin credentials"
echo "4. Configure payment gateway (optional)"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "- DEPLOYMENT.md - Full deployment guide"
echo "- RAILWAY_SETUP.md - Railway-specific steps"
echo "- API_DOCS.md - API documentation"
echo ""
echo "Happy deploying! 🚀"
