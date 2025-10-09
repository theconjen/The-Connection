import { storage } from "../../storage-optimized.js";
import { z } from "zod";
const searchSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  interests: z.array(z.string()).optional(),
  radius: z.number().optional()
});
const handleLocationSearch = async (req, res) => {
  try {
    const query = req.query;
    const validation = searchSchema.safeParse({
      city: query.city,
      state: query.state,
      zipCode: query.zipCode,
      interests: query.interests ? query.interests.split(",") : void 0,
      radius: query.radius ? query.radius : void 0
    });
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid search parameters",
        errors: validation.error.errors
      });
    }
    const { city, state, interests } = validation.data;
    const allCommunities = await storage.getAllCommunities();
    let filteredCommunities = allCommunities;
    if (city || state) {
      filteredCommunities = allCommunities.filter((community) => {
        if (city && !community.city?.toLowerCase().includes(city.toLowerCase())) {
          return false;
        }
        if (state && community.state !== state) {
          return false;
        }
        return true;
      });
    }
    if (interests && interests.length > 0) {
      filteredCommunities = filteredCommunities.filter((community) => {
        if (!community.interestTags || community.interestTags.length === 0) {
          return false;
        }
        return interests.some(
          (interest) => community.interestTags?.includes(interest)
        );
      });
    }
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
function registerLocationSearchRoutes(app) {
  app.get("/api/search/communities", handleLocationSearch);
}
export {
  registerLocationSearchRoutes as default,
  handleLocationSearch
};
