import { Router } from "express";
import { insertEventSchema } from "./shared/schema.js";
import { isAuthenticated } from "../auth.js";
import { storage as storageReal } from "../storage.js";
const storage = storageReal;
const router = Router();
function getSessionUserId(req) {
  const raw = req.session?.userId;
  if (raw === void 0 || raw === null) return void 0;
  if (typeof raw === "number") return raw;
  const n = parseInt(String(raw));
  return Number.isFinite(n) ? n : void 0;
}
router.get("/api/events", async (req, res) => {
  try {
    const filter = req.query.filter;
    const userId = getSessionUserId(req);
    let events = await storage.getAllEvents();
    if (userId) {
      const blockedIds = await storage.getBlockedUserIdsFor(userId);
      if (blockedIds && blockedIds.length > 0) {
        events = events.filter((e) => !blockedIds.includes(e.creatorId));
      }
    }
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Error fetching events" });
  }
});
router.get("/api/events/public", async (req, res) => {
  try {
    const allEvents = await storage.getAllEvents();
    const events = allEvents.filter((event) => event.isPublic);
    res.json(events);
  } catch (error) {
    console.error("Error fetching public events:", error);
    res.status(500).json({ message: "Error fetching public events" });
  }
});
router.get("/api/events/:id", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await storage.getEvent(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Error fetching event" });
  }
});
router.post("/api/events", isAuthenticated, async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const validatedData = insertEventSchema.parse({ ...req.body, organizerId: userId });
    const event = await storage.createEvent(validatedData);
    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Error creating event" });
  }
});
var events_default = router;
export {
  events_default as default
};
