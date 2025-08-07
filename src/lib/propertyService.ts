// Mock property service for demonstration
// In a real implementation, this would connect to Patrick County GIS API

interface PropertyInfo {
  parcelId: string;
  owner: string;
  address: string;
  acreage: number;
  taxValue: number;
  zoning: string;
  lastSale?: {
    date: string;
    price: number;
  };
  utilities?: string[];
}

class PropertyService {
  
  // Get property information by coordinates
  async getPropertyByCoordinates(lat: number, lng: number): Promise<PropertyInfo | null> {
    try {
      // Mock data for demonstration
      // In real implementation, this would query the actual GIS database
      const mockProperty: PropertyInfo = {
        parcelId: `PC-${Math.floor(Math.random() * 10000)}`,
        owner: "John Doe",
        address: `${Math.floor(Math.random() * 9999)} Main St, Stuart, VA 24171`,
        acreage: Math.round((Math.random() * 10 + 0.5) * 100) / 100,
        taxValue: Math.floor(Math.random() * 300000 + 50000),
        zoning: this.getRandomZoning(),
        lastSale: {
          date: "2022-03-15",
          price: Math.floor(Math.random() * 250000 + 100000)
        },
        utilities: ["Electric", "Water", "Sewer"]
      };

      return mockProperty;
    } catch (error) {
      console.error('Error fetching property data:', error);
      return null;
    }
  }

  // Get properties within a radius
  async getPropertiesInRadius(
    centerLat: number, 
    centerLng: number, 
    radiusMeters: number
  ): Promise<PropertyInfo[]> {
    try {
      // Mock multiple properties
      const properties: PropertyInfo[] = [];
      const propertyCount = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < propertyCount; i++) {
        properties.push({
          parcelId: `PC-${Math.floor(Math.random() * 10000)}`,
          owner: this.getRandomOwner(),
          address: `${Math.floor(Math.random() * 9999)} ${this.getRandomStreet()}, Stuart, VA 24171`,
          acreage: Math.round((Math.random() * 15 + 0.3) * 100) / 100,
          taxValue: Math.floor(Math.random() * 400000 + 40000),
          zoning: this.getRandomZoning(),
          utilities: this.getRandomUtilities()
        });
      }

      return properties;
    } catch (error) {
      console.error('Error fetching properties in radius:', error);
      return [];
    }
  }

  // Search properties by address or parcel ID
  async searchProperties(query: string): Promise<PropertyInfo[]> {
    try {
      // Mock search results
      if (query.length < 3) return [];

      const results: PropertyInfo[] = [];
      const resultCount = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < resultCount; i++) {
        results.push({
          parcelId: `PC-${query.toUpperCase()}-${i + 1}`,
          owner: this.getRandomOwner(),
          address: `${query} ${this.getRandomStreet()}, Stuart, VA 24171`,
          acreage: Math.round((Math.random() * 8 + 0.5) * 100) / 100,
          taxValue: Math.floor(Math.random() * 350000 + 60000),
          zoning: this.getRandomZoning(),
          utilities: this.getRandomUtilities()
        });
      }

      return results;
    } catch (error) {
      console.error('Error searching properties:', error);
      return [];
    }
  }

  // Helper methods for generating mock data
  private getRandomOwner(): string {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Mary'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  private getRandomStreet(): string {
    const streets = [
      'Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 
      'Elm St', 'Park Ave', 'Church St', 'Hill Rd', 'Valley Dr'
    ];
    
    return streets[Math.floor(Math.random() * streets.length)];
  }

  private getRandomZoning(): string {
    const zones = ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'];
    return zones[Math.floor(Math.random() * zones.length)];
  }

  private getRandomUtilities(): string[] {
    const allUtilities = ['Electric', 'Water', 'Sewer', 'Gas', 'Cable', 'Internet'];
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 utilities
    
    const utilities = [];
    for (let i = 0; i < count; i++) {
      const utility = allUtilities[Math.floor(Math.random() * allUtilities.length)];
      if (!utilities.includes(utility)) {
        utilities.push(utility);
      }
    }
    
    return utilities;
  }
}

// Export individual methods and singleton instance
const propertyService = new PropertyService();

export const fetchPropertyByParcelId = propertyService.getPropertyByCoordinates.bind(propertyService);
export const fetchPropertiesByLocation = propertyService.getPropertiesInRadius.bind(propertyService);
export const searchProperties = propertyService.searchProperties.bind(propertyService);
export const getPropertyAnalytics = async () => ({ totalProperties: 1000, avgValue: 150000 });

export default propertyService;