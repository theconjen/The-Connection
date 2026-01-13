#!/bin/bash

# Script to remove console.log statements from The Connection codebase
# Preserves console.error, console.warn, console.info which are useful in production
# Last Updated: 2026-01-10

set -e

PROJECT_ROOT="/Users/rawaselou/Desktop/The-Connection-main"
MOBILE_ROOT="/Users/rawaselou/Desktop/TheConnectionMobile-standalone"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Console.log Removal Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to count console.logs
count_logs() {
    local path=$1
    local count=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "$path" 2>/dev/null | wc -l | tr -d ' ')
    echo "$count"
}

# Function to remove console.logs from a directory
remove_logs() {
    local path=$1
    local name=$2

    echo -e "${YELLOW}Processing: $name${NC}"

    # Count before
    local before=$(count_logs "$path")
    echo "  Found $before console.log statements"

    if [ "$before" -eq 0 ]; then
        echo -e "  ${GREEN}✓ No console.logs to remove${NC}"
        return
    fi

    # Remove console.log statements
    # This preserves console.error, console.warn, console.info, console.dir, console.table
    find "$path" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' \
        -e '/console\.log/d' \
        {} +

    # Count after
    local after=$(count_logs "$path")
    local removed=$((before - after))

    echo -e "  ${GREEN}✓ Removed $removed console.log statements${NC}"

    if [ "$after" -gt 0 ]; then
        echo -e "  ${YELLOW}⚠ Warning: $after console.log statements remain (may be in comments or strings)${NC}"
    fi

    echo ""
}

# Backup reminder
echo -e "${YELLOW}⚠️  IMPORTANT: Make sure your changes are committed to git!${NC}"
echo -e "${YELLOW}   This script will modify files in place.${NC}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi
echo ""

# Web App - Client
if [ -d "$PROJECT_ROOT/client" ]; then
    remove_logs "$PROJECT_ROOT/client" "Web App - Client"
fi

# Web App - Server
if [ -d "$PROJECT_ROOT/server" ]; then
    remove_logs "$PROJECT_ROOT/server" "Web App - Server"
fi

# Shared Code
if [ -d "$PROJECT_ROOT/shared" ]; then
    remove_logs "$PROJECT_ROOT/shared" "Shared Code"
fi

# Mobile App
if [ -d "$MOBILE_ROOT/app" ]; then
    remove_logs "$MOBILE_ROOT/app" "Mobile App - App"
fi

if [ -d "$MOBILE_ROOT/src" ]; then
    remove_logs "$MOBILE_ROOT/src" "Mobile App - Src"
fi

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Console.log removal complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Note: The following console methods are preserved:${NC}"
echo "  • console.error() - for errors"
echo "  • console.warn() - for warnings"
echo "  • console.info() - for informational messages"
echo "  • console.dir() - for object inspection"
echo "  • console.table() - for table display"
echo ""
echo -e "${YELLOW}Recommendation:${NC}"
echo "  1. Review the changes: git diff"
echo "  2. Test your app to ensure nothing broke"
echo "  3. Commit the changes: git add . && git commit -m 'Remove console.logs'"
echo ""
