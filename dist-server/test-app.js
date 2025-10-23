import express from "express";
import session from "express-session";
import { createServer } from "http";
import feedRoutes from "./routes/feed.js";
const app = express();
app.use(express.json());
app.use(session({ secret: "test", resave: false, saveUninitialized: true }));
let ready = false;
const httpServer = createServer(app);
try {
  app.use("/api", feedRoutes);
  ready = true;
} catch (e) {
  console.error("Failed to register minimal routes in test-app:", e);
}
app.use((req, res, next) => {
  if (ready) return next();
  const start = Date.now();
  const check = () => {
    if (ready) return next();
    if (Date.now() - start > 5e3) {
      return res.status(503).json({ message: "Test app not ready" });
    }
    setTimeout(check, 10);
  };
  check();
});
var test_app_default = app;
export {
  test_app_default as default
};
