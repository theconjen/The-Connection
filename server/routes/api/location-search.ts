import { Request, Response } from "express";
import { storage } from "../../storage-optimized";
import { z } from "zod/v4";
import { buildErrorResponse } from "../../utils/errors";

const searchSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  interests: z.array(z.string()).optional(),
  radius: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const toNumberOrUndefined = (value?: string | string[]) => {
  if (value === undefined) return undefined;
  const numeric = Array.isArray(value) ? value[0] : value;
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const milesBetween = (pointA: { latitude: number; longitude: number }, pointB: { latitude: number; longitude: number }) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;

  const dLat = toRad(pointB.latitude - pointA.latitude);
  const dLon = toRad(pointB.longitude - pointA.longitude);

  const lat1 = toRad(pointA.latitude);
  const lat2 = toRad(pointB.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
};

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
      radius: toNumberOrUndefined(query.radius as string),
      latitude: toNumberOrUndefined(query.latitude as string),
      longitude: toNumberOrUndefined(query.longitude as string),
    });
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid search parameters", 
        errors: validation.error.issues 
      });
    }
    
    const { city, state, interests, latitude, longitude } = validation.data;
    
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

    // Geolocation-based filtering when coordinates are provided
    if (latitude !== undefined && longitude !== undefined) {
      const radius = validation.data.radius ?? 50; // miles
      filteredCommunities = filteredCommunities
        .map((community) => {
          if (!community.latitude || !community.longitude) return { community, distance: Number.POSITIVE_INFINITY };

          const communityLatitude = Number(community.latitude);
          const communityLongitude = Number(community.longitude);

          if (!Number.isFinite(communityLatitude) || !Number.isFinite(communityLongitude)) {
            return { community, distance: Number.POSITIVE_INFINITY };
          }

          const distance = milesBetween(
            { latitude, longitude },
            { latitude: communityLatitude, longitude: communityLongitude }
          );

          return { community, distance };
        })
        .filter((entry) => entry.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .map((entry) => ({ ...entry.community, distance: entry.distance } as any));
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
        interests,
        latitude,
        longitude
      }
    });
  } catch (error) {
    console.error("Error in location search:", error);
    res.status(500).json(buildErrorResponse("Server error during location search", error));
  }
};

/**
 * Register location search routes
 */
export default function registerLocationSearchRoutes(app: any) {
  app.get("/api/search/communities", handleLocationSearch);
}
