# GitHub Codespaces Quick Reference

## 🚀 How to Open a Codespace - Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Go to GitHub Repository                        │
│  https://github.com/theconjen/The-Connection            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: Click the Green "Code" Button                  │
│                                                           │
│  [< > Code ▼]  ← Click this                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 3: Select "Codespaces" Tab                        │
│                                                           │
│  Local │ Codespaces │ ← Click "Codespaces"              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 4: Create Codespace                               │
│                                                           │
│  [+ Create codespace on main]  ← Click this             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 5: Wait for Setup (1-2 minutes)                   │
│                                                           │
│  ⏳ Setting up your codespace...                        │
│  • Installing Node.js                                    │
│  • Installing PostgreSQL                                 │
│  • Installing dependencies                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 6: VS Code Opens in Browser!                      │
│                                                           │
│  ✅ Ready to code with full IDE experience              │
└─────────────────────────────────────────────────────────┘
```

## 📝 After Codespace Opens - Quick Setup

Run these commands in the terminal:

```bash
# 1. Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/the_connection
SESSION_SECRET=your-secret-key-change-this
NODE_ENV=development
EOF

# 2. Start PostgreSQL
sudo service postgresql start

# 3. Create database
sudo -u postgres psql -c "CREATE DATABASE the_connection;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# 4. Initialize database
npm run db:push

# 5. Start the dev server
npm run dev
```

## 🌐 Access Your App

When the dev server starts, you'll see a notification:

```
Your application running on port 8080 is available
[Open in Browser] [Open in Preview]
```

Click **"Open in Browser"** to view your app!

## 📚 Documentation Links

- **Full Guide**: [docs/CODESPACES.md](./CODESPACES.md)
- **Troubleshooting**: [docs/LOCAL_DEBUGGING.md](./LOCAL_DEBUGGING.md)
- **Devcontainer Config**: [.devcontainer/README.md](../.devcontainer/README.md)

## 💡 Pro Tips

- Codespaces automatically stops after 30 minutes of inactivity
- Free tier: 60 hours/month
- Your work is saved in the codespace until you delete it
- Commit and push to preserve changes
