import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, X, Clock, Navigation, Star, Trash2, RotateCcw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useDebounced } from '@/hooks/useDebounced';
import { useSearchHistory, SearchHistoryItem } from '@/hooks/useSearchHistory';
import { useGeolocation } from '@/hooks/useGeolocation';
import { 
  SearchCategory, 
  SEARCH_CATEGORIES, 
  getCategoryForResult, 
  getCategoryConfig, 
  filterResultsByCategory 
} from './SearchResultCategories';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  importance?: number;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchMode, setSearchMode] = useState<'search' | 'history'>('search');
  const [retryCount, setRetryCount] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const { 
    addToHistory, 
    removeFromHistory, 
    clearHistory, 
    getRecentSearches, 
    searchInHistory 
  } = useSearchHistory();
  
  const { 
    getCurrentLocation, 
    loading: geoLoading, 
    error: geoError, 
    supported: geoSupported 
  } = useGeolocation();

  // Enhanced search function with retry logic
  const searchAddress = useCallback(async (searchQuery: string, retryAttempt = 0) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      setSearchMode('history');
      return;
    }

    setIsLoading(true);
    setSearchMode('search');
    
    try {
      // Enhanced search parameters for better results
      const params = new URLSearchParams({
        q: searchQuery,
        format: 'json',
        addressdetails: '1',
        limit: '8',
        countrycodes: 'us',
        bounded: '1',
        viewbox: '-82,35,-78,38', // Virginia/North Carolina region
        'accept-language': 'en',
        extratags: '1',
        namedetails: '1'
      });
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            'User-Agent': 'Patrick County GIS Pro/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: SearchResult[] = await response.json();
      
      // Sort results by importance and relevance
      const sortedResults = data.sort((a, b) => {
        const importanceA = a.importance || 0;
        const importanceB = b.importance || 0;
        return importanceB - importanceA;
      });
      
      setResults(sortedResults);
      setShowResults(sortedResults.length > 0);
      setSelectedIndex(-1);
      setRetryCount(0);
      
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // Retry logic for network errors
      if (retryAttempt < 2) {
        setTimeout(() => {
          searchAddress(searchQuery, retryAttempt + 1);
        }, 1000 * (retryAttempt + 1));
        setRetryCount(retryAttempt + 1);
        return;
      }
      
      toast.error(
        retryAttempt > 0 
          ? 'Address search failed after retries. Please try again.' 
          : 'Address search temporarily unavailable. Retrying...'
      );
      setResults([]);
      setShowResults(false);
      setRetryCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search with 400ms delay for better UX
  const debouncedSearch = useDebounced(searchAddress, 400);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length === 0) {
      setResults([]);
      setShowResults(false);
      setSearchMode('history');
      setSelectedIndex(-1);
    } else if (value.length >= 2) {
      debouncedSearch(value);
    }
  };

  // Enhanced keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    const currentResults = searchMode === 'search' ? results : getHistoryResults();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < currentResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : currentResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
          if (searchMode === 'search') {
            handleResultSelect(currentResults[selectedIndex]);
          } else {
            handleHistorySelect(getRecentSearches()[selectedIndex]);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        // Allow tab to work normally but close results
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Get history results for display
  const getHistoryResults = () => {
    if (query.length === 0) {
      return getRecentSearches(5);
    }
    return searchInHistory(query);
  };

  // Handle search result selection
  const handleResultSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const displayName = formatAddress(result);
    
    onLocationSelect(lat, lng, displayName);
    setQuery(displayName);
    setShowResults(false);
    setSelectedIndex(-1);
    
    // Add to search history
    addToHistory({
      query: query,
      address: displayName,
      lat,
      lng
    });
    
    toast.success(`Located: ${displayName}`, {
      description: 'Click on the map to see more details'
    });
  };

  // Handle history item selection
  const handleHistorySelect = (item: SearchHistoryItem) => {
    onLocationSelect(item.lat, item.lng, item.address);
    setQuery(item.address);
    setShowResults(false);
    setSelectedIndex(-1);
    
    // Update timestamp in history
    addToHistory({
      query: item.query,
      address: item.address,
      lat: item.lat,
      lng: item.lng
    });
    
    toast.success(`Located: ${item.address}`);
  };

  // Handle current location
  const handleCurrentLocation = async () => {
    const coords = await getCurrentLocation();
    if (coords) {
      try {
        // Reverse geocode to get address
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Patrick County GIS Pro/1.0'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const address = data.display_name || 'Current Location';
          
          onLocationSelect(coords.lat, coords.lng, address);
          setQuery(address);
          setShowResults(false);
          
          addToHistory({
            query: 'Current Location',
            address,
            lat: coords.lat,
            lng: coords.lng
          });
          
          toast.success('Located your current position');
        } else {
          onLocationSelect(coords.lat, coords.lng, 'Current Location');
          toast.success('Located your current position');
        }
      } catch (error) {
        // Still use coordinates even if reverse geocoding fails
        onLocationSelect(coords.lat, coords.lng, 'Current Location');
        toast.success('Located your current position');
      }
    } else if (geoError) {
      toast.error(geoError);
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    setSearchMode('history');
    inputRef.current?.focus();
  };

  // Enhanced address formatting
  const formatAddress = (result: SearchResult) => {
    const addr = result.address;
    if (!addr) return result.display_name;
    
    const parts = [];
    
    // Street address
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      parts.push(addr.road);
    }
    
    // Area/Neighborhood
    if (addr.neighbourhood || addr.suburb) {
      parts.push(addr.neighbourhood || addr.suburb);
    }
    
    // City
    if (addr.city) {
      parts.push(addr.city);
    }
    
    // County/State
    const locationParts = [];
    if (addr.county) locationParts.push(addr.county);
    if (addr.state) locationParts.push(addr.state);
    if (locationParts.length > 0) {
      parts.push(locationParts.join(', '));
    }
    
    return parts.join(', ') || result.display_name;
  };

  // Get result type icon
  const getResultIcon = (result: SearchResult) => {
    const type = result.type?.toLowerCase() || '';
    const resultClass = result.class?.toLowerCase() || '';
    
    if (type.includes('house') || resultClass === 'building') {
      return <MapPin className="w-4 h-4 text-blue-500" />;
    }
    if (type.includes('road') || resultClass === 'highway') {
      return <MapPin className="w-4 h-4 text-gray-500" />;
    }
    if (resultClass === 'amenity') {
      return <Star className="w-4 h-4 text-yellow-500" />;
    }
    return <MapPin className="w-4 h-4 text-primary" />;
  };

  // Handle focus - show history if no query
  const handleFocus = () => {
    if (query.length === 0) {
      const recentSearches = getRecentSearches(5);
      if (recentSearches.length > 0) {
        setSearchMode('history');
        setShowResults(true);
      }
    }
  };

  // Handle blur - delay hiding results to allow clicking
  const handleBlur = () => {
    setTimeout(() => {
      setShowResults(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const recentSearches = getRecentSearches(5);
  const currentResults = searchMode === 'search' ? results : getHistoryResults();

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search addresses, places, or coordinates..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10 pr-20 bg-background/95 backdrop-blur-sm border-border/50 text-base h-12 touch-manipulation focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Current Location Button */}
          {geoSupported && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCurrentLocation}
              disabled={geoLoading}
              className="h-8 w-8 p-0 hover:bg-primary/10"
              title="Use current location"
            >
              {geoLoading ? (
                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <Navigation className="w-3 h-3" />
              )}
            </Button>
          )}
          
          {/* Clear Button */}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-1 px-2">
              {retryCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  Retry {retryCount}
                </Badge>
              )}
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <Card 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 bg-background/98 backdrop-blur-sm border-border/50 shadow-xl max-h-80 overflow-hidden"
        >
          <div className="max-h-80 overflow-y-auto">
            {/* History Header */}
            {searchMode === 'history' && recentSearches.length > 0 && (
              <div className="flex items-center justify-between p-3 border-b border-border/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Recent Searches</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-6 px-2 text-xs hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}
            
            {/* Results */}
            <div className="p-1">
              {currentResults.length > 0 ? (
                currentResults.map((item, index) => {
                  const isSelected = selectedIndex === index;
                  
                  if (searchMode === 'history') {
                    const historyItem = item as SearchHistoryItem;
                    return (
                      <div key={`history-${index}`} className="flex items-center">
                        <button
                          onClick={() => handleHistorySelect(historyItem)}
                          className={`flex-1 text-left p-3 rounded-md transition-all duration-150 border-0 bg-transparent touch-manipulation ${
                            isSelected 
                              ? 'bg-primary/10 border-primary/20' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {historyItem.address}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(historyItem.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromHistory(historyItem.address)}
                          className="h-8 w-8 p-0 mr-2 hover:bg-destructive/10"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  } else {
                    const result = item as SearchResult;
                    return (
                      <button
                        key={`result-${index}`}
                        onClick={() => handleResultSelect(result)}
                        className={`w-full text-left p-3 rounded-md transition-all duration-150 border-0 bg-transparent touch-manipulation ${
                          isSelected 
                            ? 'bg-primary/10 border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {getResultIcon(result)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {formatAddress(result)}
                            </div>
                            {result.address?.county && (
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <span>{result.address.county}, {result.address.state || 'VA'}</span>
                                {result.type && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    {result.type.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                })
              ) : (
                <div className="p-4 text-center">
                  {searchMode === 'search' && query.length >= 2 ? (
                    <div className="text-sm text-muted-foreground">
                      <MapPin className="w-5 h-5 mx-auto mb-2 opacity-50" />
                      No addresses found. Try searching for a different location.
                      {retryCount > 0 && (
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          <span className="text-xs">Retried {retryCount} time(s)</span>
                        </div>
                      )}
                    </div>
                  ) : searchMode === 'history' && query.length > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      <Clock className="w-5 h-5 mx-auto mb-2 opacity-50" />
                      No matching searches in history.
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <Search className="w-5 h-5 mx-auto mb-2 opacity-50" />
                      Start typing to search for addresses...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AddressSearchBar;