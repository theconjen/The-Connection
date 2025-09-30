# Devcontainer Configuration

This directory contains the configuration for GitHub Codespaces and VS Code dev containers.

## What's Included

The `devcontainer.json` file configures:

- **Base Image**: Node.js 18 development container
- **Features**:
  - Node.js 18 runtime
  - PostgreSQL database server
- **Forwarded Ports**:
  - 8080: Application server
  - 5432: PostgreSQL database
- **VS Code Extensions**:
  - ESLint for code linting
  - Prettier for code formatting
  - Tailwind CSS IntelliSense
  - TypeScript language support
- **Post-create Command**: Automatically runs `npm install` after container creation

## Using This Configuration

### With GitHub Codespaces

1. Go to the repository on GitHub
2. Click the "Code" button
3. Select "Codespaces" tab
4. Click "Create codespace on main"

GitHub will automatically use this configuration to set up your development environment.

### With VS Code Dev Containers (Local)

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the repository in VS Code
3. Press `F1` and select "Dev Containers: Reopen in Container"

VS Code will build and start the container using this configuration.

## Customization

You can customize the devcontainer by editing `devcontainer.json`:

- Add VS Code extensions to `customizations.vscode.extensions`
- Change Node.js version in the `features` section
- Add additional ports to `forwardPorts`
- Modify the `postCreateCommand` to run different setup scripts

## Database Setup

After the container starts, you'll need to:

1. Start PostgreSQL: `sudo service postgresql start`
2. Create database: `sudo -u postgres psql -c "CREATE DATABASE the_connection;"`
3. Set password: `sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"`
4. Run migrations: `npm run db:push`

See [CODESPACES.md](../docs/CODESPACES.md) for complete setup instructions.
