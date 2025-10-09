import { Request, Response } from "express";
import { storage } from "../../storage-optimized";
import { z } from "zod";

const searchSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  interests: z.array(z.string()).optional(),
  radius: z.number().optional(),
});

/**
 * Handle searching for communities based on location and interests
 */
export const handleLocationSearch = async (req: Request, res: Response) => {
  try {
    const query = req.query;
    
    // Validate query parameters
    const validation = searchSchema.safeParse({
      city: query.city as string,
      state: query.state as string,
      zipCode: query.zipCode as string,
      interests: query.interests ? (query.interests as string).split(',') : undefined,
      radius: query.radius ? query.radius as string : undefined,
    });
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid search parameters", 
        errors: validation.error.errors 
      });
    }
    
    const { city, state, interests } = validation.data;
    
    // Get all communities
    const allCommunities = await storage.getAllCommunities();
    
    // Filter by location if provided
    let filteredCommunities = allCommunities;
    if (city || state) {
      filteredCommunities = allCommunities.filter(community => {
        // Match on city if provided
        if (city && !community.city?.toLowerCase().includes(city.toLowerCase())) {
          return false;
        }
        
        // Match on state if provided
        if (state && community.state !== state) {
          return false;
        }
        
        return true;
      });
    }
    
    // Filter by interests if provided
    if (interests && interests.length > 0) {
      filteredCommunities = filteredCommunities.filter(community => {
        // If community has no interest tags, skip it
        if (!community.interestTags || community.interestTags.length === 0) {
          return false;
        }
        
        // Check if any of the search interests match community tags
        return interests.some(interest => 
          community.interestTags?.includes(interest)
        );
      });
    }
    
    // Return the filtered communities
    res.json({
      results: filteredCommunities,
      count: filteredCommunities.length,
      filters: {
        city,
        state,
        interests
      }
    });
  } catch (error) {
    console.error("Error in location search:", error);
    res.status(500).json({ message: "Server error during location search" });
  }
};

/**
 * Register location search routes
 */
export default function registerLocationSearchRoutes(app: any) {
  app.get("/api/search/communities", handleLocationSearch);
}