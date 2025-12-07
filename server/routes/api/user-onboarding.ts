import { Request, Response } from "express";
import { storage } from "../../storage-optimized";
import { requireAuth } from "../../middleware/auth";
import { z } from "zod/v4";
import { buildErrorResponse } from "../../utils/errors";
import { requireSessionUserId } from "../../utils/session";

// Schema for validating onboarding data
const onboardingSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  interests: z.array(z.string()).optional(),
  onboardingCompleted: z.boolean().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

/**
 * Handle user onboarding data including location and interests
 */
export const handleOnboarding = async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    // Validate the request body
    const validation = onboardingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid data", 
        errors: validation.error.issues 
      });
    }

    const { 
      city, 
      state, 
      zipCode, 
      interests, 
      onboardingCompleted,
      latitude,
      longitude
    } = validation.data;

    // Update user with onboarding data
    await storage.updateUser(userId, {
      city,
      state,
      zipCode,
      onboardingCompleted,
      latitude,
      longitude
    });

    // If interests are provided, update user preferences
    if (interests && interests.length > 0) {
      await storage.updateUserPreferences(userId, {
        interests: interests
      });
    }

    res.status(200).json({ 
      message: "Onboarding completed successfully",
      success: true 
    });
  } catch (error) {
    console.error("Error in onboarding:", error);
    res.status(500).json(buildErrorResponse("Server error during onboarding", error));
  }
};

/**
 * Register onboarding routes
 */
export function registerOnboardingRoutes(app: any) {
  app.post("/api/user/onboarding", requireAuth, handleOnboarding);
}
