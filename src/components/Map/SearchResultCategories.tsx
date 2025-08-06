import React from 'react';
import { MapPin, Building, Car, ShoppingBag, TreePine, Globe, Star } from 'lucide-react';

export type SearchCategory = 
  | 'all'
  | 'addresses' 
  | 'buildings' 
  | 'transportation'
  | 'amenities'
  | 'natural'
  | 'administrative'
  | 'commercial';

export interface SearchCategoryConfig {
  id: SearchCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  nominatimClasses?: string[];
}

export const SEARCH_CATEGORIES: SearchCategoryConfig[] = [
  {
    id: 'all',
    label: 'All Results',
    icon: Globe,
    color: 'text-primary',
    description: 'Show all search results',
    nominatimClasses: []
  },
  {
    id: 'addresses',
    label: 'Addresses',
    icon: MapPin,
    color: 'text-blue-500',
    description: 'Houses, buildings, and street addresses',
    nominatimClasses: ['place', 'building']
  },
  {
    id: 'transportation',
    label: 'Transportation',
    icon: Car,
    color: 'text-orange-500',
    description: 'Roads, highways, and transit stations',
    nominatimClasses: ['highway', 'railway', 'aeroway']
  },
  {
    id: 'amenities',
    label: 'Amenities',
    icon: Star,
    color: 'text-yellow-500',
    description: 'Restaurants, shops, schools, and services',
    nominatimClasses: ['amenity', 'shop', 'leisure', 'tourism']
  },
  {
    id: 'commercial',
    label: 'Commercial',
    icon: ShoppingBag,
    color: 'text-green-500',
    description: 'Businesses, offices, and commercial areas',
    nominatimClasses: ['shop', 'office', 'commercial']
  },
  {
    id: 'natural',
    label: 'Natural',
    icon: TreePine,
    color: 'text-emerald-600',
    description: 'Parks, forests, water bodies, and natural features',
    nominatimClasses: ['natural', 'waterway', 'landuse']
  },
  {
    id: 'administrative',
    label: 'Administrative',
    icon: Building,
    color: 'text-purple-500',
    description: 'Government buildings, boundaries, and administrative areas',
    nominatimClasses: ['boundary', 'administrative']
  }
];

export function getCategoryForResult(result: { class?: string; type?: string }): SearchCategory {
  const resultClass = result.class?.toLowerCase() || '';
  const resultType = result.type?.toLowerCase() || '';
  
  // Check each category's nominatim classes
  for (const category of SEARCH_CATEGORIES) {
    if (category.nominatimClasses?.some(cls => 
      resultClass.includes(cls) || resultType.includes(cls)
    )) {
      return category.id;
    }
  }
  
  // Default fallback logic
  if (resultClass === 'place' || resultClass === 'building') return 'addresses';
  if (resultClass === 'highway' || resultClass === 'railway') return 'transportation';
  if (resultClass === 'amenity' || resultClass === 'shop') return 'amenities';
  if (resultClass === 'natural' || resultClass === 'waterway') return 'natural';
  if (resultClass === 'boundary') return 'administrative';
  
  return 'addresses'; // Default category
}

export function getCategoryConfig(categoryId: SearchCategory): SearchCategoryConfig {
  return SEARCH_CATEGORIES.find(cat => cat.id === categoryId) || SEARCH_CATEGORIES[0];
}

export function filterResultsByCategory(
  results: any[], 
  category: SearchCategory
): any[] {
  if (category === 'all') return results;
  
  return results.filter(result => {
    const resultCategory = getCategoryForResult(result);
    return resultCategory === category;
  });
}

export default {
  SEARCH_CATEGORIES,
  getCategoryForResult,
  getCategoryConfig,
  filterResultsByCategory
};