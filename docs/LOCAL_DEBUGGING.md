Local debugging guide for The-Connection

This guide helps a novice get the project running on your machine and troubleshoot the most common "localhost won't load" problems.

Prerequisites
- Node.js 18+ installed (check with `node -v`).
- Git installed (optional if you already have the repo).

1) Install dependencies
Open a terminal at the project root (where `package.json` is) and run:

```bash
npm install
```

Why: installs packages the project needs.

2) Run TypeScript diagnostics
This project uses TypeScript. We'll run a helper to surface common errors.

```bash
npm run check:ts
```

What you should see:
- "✅ TypeScript found no errors." → good.
- "❌ TypeScript reported errors." → read the first errors shown. They usually tell you which files or imports are missing.

Common fixes for errors reported
- "Cannot find module '@shared/schema'": ensure `shared/schema.ts` exists. If it does, make sure you're running commands from the project root so `tsconfig.json` path aliases work.
- "Cannot find module './db'": ensure `server/db.ts` exists and the import path matches the file name.
- Syntax errors: open the indicated file in your editor and look at the reported line.

3) Start the dev server (frontend + backend)
This repo provides a `dev` script that starts the server. Run:

```bash
npm run dev
```

This uses `tsx` to run `server/index.ts` in development mode and also starts Vite for the frontend.

4) Open the app in your browser
The project launch config expects `http://localhost:8080`. Open that URL.

If nothing appears or you see a connection refused error:
- Check the terminal where `npm run dev` is running for errors.
- Confirm the dev server port in logs. The frontend may run on a different port (Vite often uses 5173).
- If the server crashed on startup, look for the first error in the terminal and fix it.

5) VS Code TypeScript/intellisense issues
- If imports look unresolved in the editor but `npm run check:ts` passes, reload the TypeScript server or the VS Code window: Ctrl+Shift+P → "Reload Window" or "TypeScript: Restart TS server".

6) Getting help
- Copy the error text and paste it into a new issue or a chat with (me). Include the command you ran and the first 10-20 lines of output.

Extra tools (optional)
- `npm run check` runs `tsc` directly and prints all errors.


