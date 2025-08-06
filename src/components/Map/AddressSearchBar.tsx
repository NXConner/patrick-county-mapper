import React, { useState, useCallback } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

interface AddressSearchBarProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  className?: string;
}

const AddressSearchBar: React.FC<AddressSearchBarProps> = ({
  onLocationSelect,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search function
  const searchAddress = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) geocoding service - completely free
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=us&` +
        `bounded=1&` +
        `viewbox=-82,35,-78,38` // Bounding box for Virginia/North Carolina region
      );
      
      if (!response.ok) {
        throw new Error('Search service unavailable');
      }
      
      const data: SearchResult[] = await response.json();
      setResults(data);
      setShowResults(data.length > 0);
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Address search temporarily unavailable');
      setResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Simple debouncing
    const timeoutId = setTimeout(() => {
      searchAddress(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const handleResultSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    onLocationSelect(lat, lng, result.display_name);
    setQuery(result.display_name);
    setShowResults(false);
    
    toast.success(`Located: ${result.display_name}`);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const formatAddress = (result: SearchResult) => {
    const addr = result.address;
    if (!addr) return result.display_name;
    
    const parts = [];
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      parts.push(addr.road);
    }
    if (addr.city) parts.push(addr.city);
    if (addr.county) parts.push(addr.county);
    if (addr.state) parts.push(addr.state);
    
    return parts.join(', ') || result.display_name;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search addresses in Patrick County + surrounding areas..."
          value={query}
          onChange={handleInputChange}
          className="pl-10 pr-10 bg-background/95 backdrop-blur-sm border-border/50 text-sm"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-background/98 backdrop-blur-sm border-border/50 shadow-lg max-h-60 overflow-y-auto">
          <div className="p-1">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleResultSelect(result)}
                className="w-full text-left p-3 hover:bg-muted/50 rounded-md transition-colors border-0 bg-transparent"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {formatAddress(result)}
                    </div>
                    {result.address?.county && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.address.county}, {result.address.state || 'VA'}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {showResults && results.length === 0 && !isLoading && query.length >= 3 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-background/98 backdrop-blur-sm border-border/50 shadow-lg">
          <div className="p-4 text-center text-sm text-muted-foreground">
            No addresses found. Try searching for a different location.
          </div>
        </Card>
      )}
    </div>
  );
};

export default AddressSearchBar;