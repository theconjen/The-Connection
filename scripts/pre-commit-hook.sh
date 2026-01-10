#!/bin/bash

# Pre-commit hook to prevent console.log statements from being committed
# This hook runs automatically before each commit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running pre-commit checks...${NC}"

# Get list of staged files (only .ts, .tsx, .js, .jsx)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$STAGED_FILES" ]; then
  echo -e "${GREEN}✓ No TypeScript/JavaScript files to check${NC}"
  exit 0
fi

# Check for console.log in staged files
CONSOLE_LOGS_FOUND=false

for FILE in $STAGED_FILES; do
  # Skip node_modules and build directories
  if [[ $FILE == *"node_modules"* ]] || [[ $FILE == *"dist"* ]] || [[ $FILE == *"build"* ]]; then
    continue
  fi

  # Check if file still exists (might have been deleted)
  if [ ! -f "$FILE" ]; then
    continue
  fi

  # Check for console.log (excluding commented lines)
  CONSOLE_LOGS=$(grep -n "console\.log" "$FILE" | grep -v "^\s*//" | grep -v "^\s*\*" || true)

  if [ ! -z "$CONSOLE_LOGS" ]; then
    if [ "$CONSOLE_LOGS_FOUND" = false ]; then
      echo -e "${RED}❌ Found console.log statements in staged files:${NC}"
      CONSOLE_LOGS_FOUND=true
    fi
    echo -e "${YELLOW}$FILE:${NC}"
    echo "$CONSOLE_LOGS"
    echo ""
  fi
done

if [ "$CONSOLE_LOGS_FOUND" = true ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}Commit rejected: console.log statements found${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  1. Remove console.log manually from the files above"
  echo "  2. Run: pnpm run clean:logs"
  echo "  3. Use console.error, console.warn, or console.info instead"
  echo "  4. Skip this hook with: git commit --no-verify (not recommended)"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ No console.log statements found${NC}"
exit 0
