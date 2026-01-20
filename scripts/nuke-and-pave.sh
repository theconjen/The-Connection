#!/usr/bin/env bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting complete environment reset...${NC}"

# 1. Kill processes
echo -e "${YELLOW}1. Stopping processes...${NC}"
pkill -f "node" || true
pkill -f "expo" || true
pkill -f "metro" || true
echo -e "${GREEN}Processes stopped.${NC}"

# 2. Clean everything
echo -e "${YELLOW}2. Deleting node_modules and lockfiles (this may take a moment)...${NC}"
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
rm -f pnpm-lock.yaml
echo -e "${GREEN}Cleaned.${NC}"

# 3. Prune store
echo -e "${YELLOW}3. Pruning pnpm store...${NC}"
pnpm store prune || true

# 4. Install
echo -e "${YELLOW}4. Installing dependencies...${NC}"
# We set HUSKY=0 to avoid git hook installation issues during this critical fix
export HUSKY=0
pnpm install

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}       Environment Reset Complete!        ${NC}"
echo -e "${GREEN}==========================================${NC}"

# Java Check
JAVA_VER=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')
echo -e "${YELLOW}Java Version Detected: $JAVA_VER${NC}"
if [[ "$JAVA_VER" == "25"* ]]; then
    echo -e "${RED}WARNING: Java 25 is detected. React Native / Gradle usually requires Java 17 or 21.${NC}"
    echo -e "${RED}You may encounter build errors. Please install Java 17 if the Android build fails.${NC}"
fi
