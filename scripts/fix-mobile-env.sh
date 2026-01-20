#!/usr/bin/env bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# FORCE JAVA 17 (Fix for "Can't use Java 25" error)
if [ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    echo -e "${GREEN}Found and set JAVA_HOME to OpenJDK 17: $JAVA_HOME${NC}"
elif [ -d "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
    export JAVA_HOME="/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    echo -e "${GREEN}Found and set JAVA_HOME to OpenJDK 17: $JAVA_HOME${NC}"
else
    echo -e "${YELLOW}Warning: OpenJDK 17 not found in standard Homebrew paths. Using system Java.${NC}"
fi

# Verify Java version
java -version

echo -e "${YELLOW}Starting comprehensive mobile environment fix...${NC}"

# 1. Kill processes
echo -e "${YELLOW}1. Stopping running processes...${NC}"
pkill -f "expo" || true
pkill -f "metro" || true
pkill -f "react-native" || true
pkill -f "node" || true
echo -e "${GREEN}Processes stopped.${NC}"

# 2. Remove problematic directories
echo -e "${YELLOW}2. Cleaning problematic node_modules...${NC}"
ROOT_DIR=$(pwd)
PROBLEM_DIR="$ROOT_DIR/node_modules/@smithy/middleware-content-length"

if [ -d "$PROBLEM_DIR" ]; then
    echo "Found problematic directory: $PROBLEM_DIR"
    # Try to remove, if fails, move to tmp
    rm -rf "$PROBLEM_DIR" || {
        echo "rm failed, attempting to move to /tmp..."
        BACKUP_DIR="/tmp/smithy-backup-$(date +%s)"
        mv "$PROBLEM_DIR" "$BACKUP_DIR" || sudo mv "$PROBLEM_DIR" "$BACKUP_DIR"
        echo "Moved to $BACKUP_DIR"
    }
else
    echo "Problematic directory not found (good)."
fi

# 3. Clean pnpm cache
echo -e "${YELLOW}3. Pruning pnpm store...${NC}"
pnpm store prune || true

# 4. Install dependencies
echo -e "${YELLOW}4. Installing dependencies (this may take a few minutes)...${NC}"
# Skip husky to avoid lifecycle errors during install
export HUSKY=0 
pnpm install

# 5. Fix Expo dependencies
echo -e "${YELLOW}5. Verifying Expo dependencies...${NC}"
cd mobile-app/TheConnectionMobile-new

# Ensure expo-notifications and expo-device are installed correctly
# We use pnpm dlx expo install to ensure compatible versions
pnpm dlx expo install expo-notifications expo-device --fix

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}       Fix Complete!                      ${NC}"
echo -e "${GREEN}==========================================${NC}"
echo -e "You can now start the app with:"
echo -e "  cd mobile-app/TheConnectionMobile-new"
echo -e "  npx expo start"
