# The Connection – Platform Architecture & Features

## 1. Overview  
**The Connection** is a full-stack web & mobile social platform built with a React/Vite front end, a TypeScript/Express back end, a PostgreSQL database (hosted on Neon), and Drizzle ORM for type-safe data access. Capacitor wraps the web build into native iOS/Android apps.

---

## 2. Tech Stack
- **Frontend**  
  - React + TypeScript  
  - Vite for bundling  
  - Tailwind CSS for utility-first styling  
  - TanStack Query for server state  
  - Wouter for client-side routing  

- **Backend**  
  - Node.js + TypeScript  
  - Express.js server  
  - Drizzle ORM for migrations & queries  
  - express-session + connect-pg-simple for session storage  
  - Passport.js for authentication  

- **Database**  
  - PostgreSQL (Neon-hosted)  
  - Drizzle ORM (schema, migrations, seeding)  

- **Mobile Packaging**  
  - Capacitor for iOS/Android shells  

---

## 3. Key Components & Data Flow

1. **Client** (React)  
   - Renders pages & components  
   - Fetches data via TanStack Query from `/api/*` endpoints  
   - Applies Tailwind utility classes  

2. **Server** (Express)  
   - Defines REST API under `/server` (e.g. `/api/user`, `/api/prayers`)  
   - Validates sessions via cookies + Passport strategies  
   - Uses Drizzle to run SQL queries & migrations  

3. **Database**  
   - Drizzle schema in `shared`  
   - Migrations in `server/run-migrations.ts`  
   - Seeding scripts for sample data

4. **Session Store**  
   - Sessions saved in PostgreSQL via `connect-pg-simple`  
   - Protects routes and persists login

---

## 4. Deployment & Local Setup

- **Local**  
  1. `git clone … && cd The-Connection`  
  2. `npm install`  
  3. Create a `.env` with `DATABASE_URL`, `SESSION_SECRET`, etc.  
  4. `npm run db:push && npm run dev`  

- **Production**  
  - Build: `npm run build`  
  - Capacitor sync: `npx cap sync ios|android`  
  - Submit via Xcode or Android Studio  

---

## 5. Further Reading

- [Vite + React Docs](https://vitejs.dev/guide/)  
- [Express.js Guide](https://expressjs.com/)  
- [Drizzle ORM](https://orm.drizzle.team/)  
- [Capacitor](https://capacitorjs.com/docs)  
