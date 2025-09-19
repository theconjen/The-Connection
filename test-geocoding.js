import { geocodeAddress } from './server/geocoding.js';

async function testGeocoding() {
  console.log('Testing geocoding functionality...');

  // Test 1: Geocode with city and state only
  const result1 = await geocodeAddress('', 'New York', 'NY');
  console.log('Test 1 - City/State only:', result1);

  // Test 2: Geocode with address, city, and state
  const result2 = await geocodeAddress('123 Main St', 'Los Angeles', 'CA');
  console.log('Test 2 - Full address:', result2);

  // Test 3: Geocode with no parameters
  const result3 = await geocodeAddress('', '', '');
  console.log('Test 3 - No parameters:', result3);
}

testGeocoding().catch(console.error);