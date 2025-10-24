# How to Open GitHub Codespaces

GitHub Codespaces provides a complete, cloud-based development environment for The Connection project. You can start coding in seconds without installing anything on your local machine.

## What is GitHub Codespaces?

GitHub Codespaces is a cloud-based development environment that runs in your browser. It comes pre-configured with:
- Node.js 18
- PostgreSQL database
- All project dependencies
- VS Code editor with recommended extensions

## Opening a Codespace

### Method 1: From the GitHub Repository (Recommended)

1. **Navigate to the repository** at https://github.com/theconjen/The-Connection

2. **Click the green "Code" button** at the top of the repository

3. **Select the "Codespaces" tab**

4. **Click "Create codespace on main"** (or the branch you want to work on)

5. **Wait for setup** - GitHub will create your development environment (usually takes 1-2 minutes)

### Method 2: From GitHub.com Dashboard

1. Go to https://github.com/codespaces

2. Click **"New codespace"**

3. Select **"theconjen/The-Connection"** as the repository

4. Choose your branch (typically `main`)

5. Click **"Create codespace"**

## Initial Setup in Codespace

Once your Codespace opens, you'll need to configure the environment:

### 1. Create Environment Variables

Create a `.env` file in the project root:

```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/the_connection
SESSION_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
EOF
```

### 2. Start PostgreSQL

PostgreSQL is included in the Codespace but needs to be started:

```bash
sudo service postgresql start
```

### 3. Create the Database

```bash
sudo -u postgres psql -c "CREATE DATABASE the_connection;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### 4. Initialize the Database Schema

```bash
npm run db:push
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at the forwarded port (usually port 8080). Codespaces will show a notification with a link to open it.

## Working in Your Codespace

### Accessing the Application

When the dev server starts, you'll see a popup notification saying "Your application running on port 8080 is available." Click **"Open in Browser"** to view your app.

Alternatively:
1. Click the **"Ports"** tab in the bottom panel
2. Find port 8080
3. Click the globe icon or right-click and select **"Open in Browser"**

### Installing Additional Dependencies

If you need to install new packages:

```bash
npm install <package-name>
```

### Running Database Migrations

```bash
npm run db:push
```

### TypeScript Type Checking

```bash
npm run check:ts
```

## Codespace Management

### Stopping Your Codespace

Codespaces automatically stop after 30 minutes of inactivity. To manually stop:

1. Click your profile picture in the top right
2. Select **"Your codespaces"**
3. Click the three dots next to your codespace
4. Select **"Stop codespace"**

### Reopening a Codespace

1. Go to https://github.com/codespaces
2. Find your existing codespace
3. Click on its name to reopen it

### Deleting a Codespace

When you're done with a codespace:

1. Go to https://github.com/codespaces
2. Click the three dots next to your codespace
3. Select **"Delete"**

## Troubleshooting

### Port 8080 is not accessible

1. Check the **Ports** tab in the bottom panel
2. Ensure port 8080 is listed and public
3. Right-click the port and select **"Port Visibility" → "Public"** if needed

### Database connection errors

1. Verify PostgreSQL is running:
   ```bash
   sudo service postgresql status
   ```

2. Start it if needed:
   ```bash
   sudo service postgresql start
   ```

3. Check your `.env` file has the correct `DATABASE_URL`

### Dependencies not installed

Run:
```bash
npm install
```

## Tips for Using Codespaces

- **Use keyboard shortcuts**: Codespaces supports the same shortcuts as VS Code
- **Customize your environment**: Install your favorite VS Code extensions
- **Commit often**: Your changes are saved in the codespace but commit to preserve them
- **Free tier limits**: Free GitHub accounts get 60 hours/month of Codespaces usage
- **Save resources**: Stop your codespace when not in use to save free tier hours

## Getting Help

If you encounter issues:
1. Check the [Local Debugging Guide](./LOCAL_DEBUGGING.md) for common problems
2. Review the [README.md](../README.md) for project setup details
3. Open an issue in the GitHub repository with:
   - What you were trying to do
   - The error message you received
   - Steps to reproduce the issue

## Additional Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [VS Code in the Browser](https://code.visualstudio.com/docs/remote/codespaces)
- [Codespaces Pricing](https://github.com/features/codespaces#pricing)
