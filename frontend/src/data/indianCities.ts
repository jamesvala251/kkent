/** Major Indian cities for challan Dispatched From autocomplete */
export const INDIAN_CITIES: string[] = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Coimbatore', 'Kochi',
  'Guwahati', 'Chandigarh', 'Amritsar', 'Varanasi', 'Nashik', 'Faridabad', 'Rajkot',
  'Meerut', 'Jabalpur', 'Jamshedpur', 'Asansol', 'Dhanbad', 'Allahabad', 'Vijayawada',
  'Madurai', 'Ranchi', 'Gwalior', 'Jodhpur', 'Raipur', 'Kota', 'Mangalore',
  'Thiruvananthapuram', 'Gurgaon', 'Noida', 'Bhubaneswar', 'Salem', 'Warangal', 'Mysore',
  'Tiruchirappalli', 'Bareilly', 'Moradabad', 'Aligarh', 'Jalandhar', 'Kalyanpur',
  'Dwarka', 'Jamnagar', 'Bhuj', 'Gandhidham', 'Rewa', 'Satna', 'Katni', 'Dhar', 'Dewas',
  'Ujjain', 'Rewari', 'Bhilai', 'Bailadila',
].sort((a, b) => a.localeCompare(b));

export function withCustomCity(cities: string[], value?: string): string[] {
  if (value && !cities.includes(value)) {
    return [value, ...cities];
  }
  return cities;
}
