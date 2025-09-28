async function geocodeAddress(address, city, state) {
  const mockCoordinates = {
    "New York, NY": { lat: 40.7128, lng: -74.006 },
    "Los Angeles, CA": { lat: 34.0522, lng: -118.2437 },
    "Chicago, IL": { lat: 41.8781, lng: -87.6298 },
    "Houston, TX": { lat: 29.7604, lng: -95.3698 },
    "Phoenix, AZ": { lat: 33.4484, lng: -112.074 },
    "Philadelphia, PA": { lat: 39.9526, lng: -75.1652 },
    "San Antonio, TX": { lat: 29.4241, lng: -98.4936 },
    "San Diego, CA": { lat: 32.7157, lng: -117.1611 },
    "Dallas, TX": { lat: 32.7767, lng: -96.797 },
    "San Jose, CA": { lat: 37.3382, lng: -121.8863 }
  };
  const locationKey = `${city}, ${state}`.toLowerCase();
  for (const [key, coords] of Object.entries(mockCoordinates)) {
    if (key.toLowerCase() === locationKey) {
      return {
        latitude: coords.lat,
        longitude: coords.lng
      };
    }
  }
  for (const [key, coords] of Object.entries(mockCoordinates)) {
    if (key.toLowerCase().includes(city.toLowerCase()) || key.toLowerCase().includes(state.toLowerCase())) {
      return {
        latitude: coords.lat,
        longitude: coords.lng
      };
    }
  }
  return {
    error: `Could not geocode location: ${city}, ${state}`
  };
}
export {
  geocodeAddress
};
