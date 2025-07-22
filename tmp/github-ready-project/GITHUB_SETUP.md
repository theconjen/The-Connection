# GitHub Repository Setup Guide

This guide will help you set up a GitHub repository for The Connection mobile app and prepare it for development and deployment.

## Initial Repository Setup

### 1. Create GitHub Repository
```bash
# Option 1: Using GitHub CLI
gh repo create the-connection-mobile --public --description "React Native mobile app for The Connection Christian community platform"

# Option 2: Create manually on GitHub.com
# Go to github.com/new and create repository
```

### 2. Initialize Local Repository
```bash
# In your project directory
git init
git add .
git commit -m "Initial commit: React Native mobile app for The Connection"
git branch -M main
git remote add origin https://github.com/yourusername/the-connection-mobile.git
git push -u origin main
```

## Repository Structure

Your repository will contain:

```
the-connection-mobile/
├── TheConnectionMobile/          # Main app directory
│   ├── src/                     # Source code
│   ├── assets/                  # App assets (icons, images)
│   ├── app.json                 # Expo configuration
│   ├── eas.json                 # Build configuration
│   ├── package.json             # Dependencies
│   └── App.tsx                  # App entry point
├── docs/                        # Documentation
│   └── DEPLOYMENT_GUIDE.md      # Deployment instructions
├── README.md                    # Project overview
├── GITHUB_SETUP.md             # This file
└── .github/                     # GitHub workflows (optional)
```

## Essential Repository Files

### .gitignore
Create a `.gitignore` file to exclude sensitive and generated files:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Expo
.expo/
dist/
web-build/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# local env files
.env*.local

# Temporary files
*.tmp
*.temp

# IDE
.vscode/
.idea/

# Logs
logs
*.log

# Build artifacts
*.ipa
*.apk
*.aab
```

### Environment Variables
Create `.env.example` to document required environment variables:

```bash
# API Configuration
API_BASE_URL=https://your-production-domain.com/api
API_TIMEOUT=30000

# App Configuration
APP_VERSION=1.0.0
ENVIRONMENT=production

# Push Notifications (configure in Expo Dashboard)
# EXPO_PUSH_TOKEN=your-expo-push-token

# Analytics (optional)
# ANALYTICS_API_KEY=your-analytics-key
```

## Branch Strategy

### Main Branches
- `main` - Production-ready code
- `develop` - Development integration branch

### Feature Branches
- `feature/authentication` - Auth system
- `feature/communities` - Communities functionality
- `feature/prayer-requests` - Prayer requests
- `feature/social-feed` - Social feed features
- `bugfix/issue-description` - Bug fixes

### Example Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature implementation"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review and approval, merge to develop
```

## GitHub Actions (Optional)

Create `.github/workflows/ci.yml` for automated testing:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: |
        cd TheConnectionMobile
        npm ci
        
    - name: Run TypeScript check
      run: |
        cd TheConnectionMobile
        npx tsc --noEmit
        
    - name: Run tests
      run: |
        cd TheConnectionMobile
        npm test
```

## Release Strategy

### Version Management
Follow semantic versioning (semver):
- `1.0.0` - Major release (breaking changes)
- `1.1.0` - Minor release (new features)
- `1.1.1` - Patch release (bug fixes)

### Release Process
1. Create release branch: `git checkout -b release/1.1.0`
2. Update version in `app.json`
3. Create release notes
4. Tag release: `git tag v1.1.0`
5. Push tag: `git push origin v1.1.0`
6. Create GitHub release with changelog

## Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Device: [e.g. iPhone 12]
- OS: [e.g. iOS 15.0]
- App Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

## Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Unit tests pass
- [ ] Integration tests pass

## Screenshots
Include screenshots of UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Code commented where necessary
- [ ] Documentation updated
- [ ] No new warnings
```

## Repository Settings

### Branch Protection Rules
Protect the `main` branch:
1. Go to Settings > Branches
2. Add rule for `main` branch
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators

### Required Status Checks
If using GitHub Actions:
- TypeScript compilation
- Test suite
- Linting

## Team Collaboration

### Code Review Guidelines
- Review for functionality and code quality
- Check mobile-specific considerations
- Verify accessibility compliance
- Test on different screen sizes
- Review security implications

### Communication
- Use GitHub Issues for bugs and features
- Use Pull Requests for code review
- Document decisions in commit messages
- Use GitHub Discussions for questions

## Security Considerations

### Sensitive Data
Never commit:
- API keys or secrets
- Private keys or certificates
- User data or credentials
- Internal URLs or endpoints

### Secret Management
- Use GitHub Secrets for CI/CD
- Use Expo SecureStore for app secrets
- Rotate keys regularly
- Audit secret access

## Deployment Integration

### App Store Connect
Link GitHub to Apple Developer account for:
- Automated builds via GitHub Actions
- Version management
- Release notes automation

### Google Play Console
Configure for:
- Automated AAB uploads
- Release management
- Beta testing distribution

## Documentation

Maintain these docs in your repository:
- `README.md` - Project overview and setup
- `docs/DEPLOYMENT_GUIDE.md` - Deployment instructions
- `docs/CONTRIBUTING.md` - Contribution guidelines
- `docs/API.md` - API documentation
- `CHANGELOG.md` - Version history

## Getting Started for New Contributors

### Setup Instructions
```bash
# Clone repository
git clone https://github.com/yourusername/the-connection-mobile.git
cd the-connection-mobile/TheConnectionMobile

# Install dependencies
npm install

# Start development server
npx expo start
```

### Development Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Address review feedback
6. Merge after approval

This repository structure will provide a professional foundation for your mobile app development and make it easy for other developers to contribute to the project.