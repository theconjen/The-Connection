import { storage } from "../../storage-optimized.js";
import { isAuthenticated } from "../../auth.js";
import { z } from "zod";
const onboardingSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  interests: z.array(z.string()).optional(),
  onboardingCompleted: z.boolean().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional()
});
const handleOnboarding = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const validation = onboardingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid data",
        errors: validation.error.errors
      });
    }
    const userId = typeof req.session.userId === "string" ? parseInt(req.session.userId) : req.session.userId;
    const {
      city,
      state,
      zipCode,
      interests,
      onboardingCompleted,
      latitude,
      longitude
    } = validation.data;
    await storage.updateUser(userId, {
      city,
      state,
      zipCode,
      onboardingCompleted,
      latitude,
      longitude
    });
    if (interests && interests.length > 0) {
      await storage.updateUserPreferences(userId, {
        interests
      });
    }
    res.status(200).json({
      message: "Onboarding completed successfully",
      success: true
    });
  } catch (error) {
    console.error("Error in onboarding:", error);
    res.status(500).json({ message: "Server error during onboarding" });
  }
};
function registerOnboardingRoutes(app) {
  app.post("/api/user/onboarding", isAuthenticated, handleOnboarding);
}
export {
  handleOnboarding,
  registerOnboardingRoutes
};
