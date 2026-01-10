#!/bin/bash

# Script to install git hooks for The Connection
# This ensures console.log statements don't get committed

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Git Hooks Installation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the project root (parent of scripts directory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

# Check if we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
  echo -e "${YELLOW}⚠️  Not in a git repository. Skipping git hooks installation.${NC}"
  exit 0
fi

echo -e "${YELLOW}Installing pre-commit hook...${NC}"

# Copy the pre-commit hook
cp "$SCRIPT_DIR/pre-commit-hook.sh" "$GIT_HOOKS_DIR/pre-commit"
chmod +x "$GIT_HOOKS_DIR/pre-commit"

echo -e "${GREEN}✓ Pre-commit hook installed successfully!${NC}"
echo ""
echo -e "${BLUE}What this does:${NC}"
echo "  • Checks for console.log statements before each commit"
echo "  • Prevents commits with console.log (use console.error, console.warn instead)"
echo "  • Can be bypassed with: git commit --no-verify (not recommended)"
echo ""
echo -e "${BLUE}Available commands:${NC}"
echo "  • pnpm run clean:logs        - Remove all console.logs"
echo "  • pnpm run clean:logs:check  - Preview what would be removed"
echo "  • pnpm run lint              - Run ESLint"
echo "  • pnpm run lint:fix          - Auto-fix ESLint issues"
echo ""
echo -e "${GREEN}Setup complete! 🎉${NC}"
