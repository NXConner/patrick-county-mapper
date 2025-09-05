import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, X, Clock, Navigation, Star, Trash2, RotateCcw, Filter, Globe, Building2, Home, Map } from 'lucide-react';
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
  onGetDirections?: (lat: number, lng: number, address: string) => void;
  className?: string;
}

const AddressSearchBar: React.FC<AddressSearchBarProps> = ({
  onLocationSelect,
  onGetDirections,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchMode, setSearchMode] = useState<'search' | 'history'>('search');
  const [retryCount, setRetryCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  
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
    
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

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

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        signal: abortRef.current.signal,
        referrerPolicy: 'strict-origin-when-cross-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
      setRetryCount(0);
      setShowResults(true);
    } catch (error) {
      const err = error as unknown;
      const isAbort = (err as { name?: string })?.name === 'AbortError' || (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError');
      if (isAbort) {
        // request was canceled
      } else {
        console.error('Search error:', err);
        if (retryAttempt < 2) {
          setRetryCount(retryAttempt + 1);
          setTimeout(() => {
            searchAddress(searchQuery, retryAttempt + 1);
          }, 1000 * (retryAttempt + 1));
        } else {
          toast.error('Search failed. Please try again.', {
            description: "Unable to connect to search service"
          });
          setResults([]);
          setShowResults(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounced(searchAddress, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.length >= 2) {
      debouncedSearch(value);
    } else {
      setResults([]);
      setShowResults(false);
      setSearchMode('history');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentResults = searchMode === 'search' ? results : getHistoryResults();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < currentResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
          if (searchMode === 'history') {
            handleHistorySelect(currentResults[selectedIndex] as SearchHistoryItem);
          } else {
            handleResultSelect(currentResults[selectedIndex] as SearchResult);
          }
        }
        break;
      case 'Escape':
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getHistoryResults = () => {
    return query ? searchInHistory(query) : getRecentSearches(5);
  };

  const handleResultSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = formatAddress(result);
    
    addToHistory({ query: address, address, lat, lng });
    onLocationSelect(lat, lng, address);
    
    setQuery(address);
    setShowResults(false);
    setSelectedIndex(-1);
    
    toast.success('Location selected', {
      description: address,
      action: {
        label: "View on Map",
        onClick: () => console.log("View on map")
      }
    });
  };

  const handleResultDirections = (result: SearchResult) => {
    if (!onGetDirections) return;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = formatAddress(result);
    onGetDirections(lat, lng, address);
    setShowResults(false);
  };

  const handleHistorySelect = (item: SearchHistoryItem) => {
    onLocationSelect(item.lat, item.lng, item.address);
    setQuery(item.address);
    setShowResults(false);
    setSelectedIndex(-1);
    
    toast.success('Location from history', {
      description: item.address
    });
  };

  const handleCurrentLocation = async () => {
    try {
      const position = await getCurrentLocation();
      if (position) {
        const { lat: latitude, lng: longitude } = position;
        
        // Reverse geocode to get address
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          { referrerPolicy: 'strict-origin-when-cross-origin' }
        );
        
        if (response.ok) {
          const data = await response.json();
          const address = data.display_name;
          
          addToHistory({ query: address, address, lat: latitude, lng: longitude });
          onLocationSelect(latitude, longitude, address);
          setQuery(address);
          setShowResults(false);
          
          toast.success('Current location found', {
            description: address
          });
        }
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      toast.error('Unable to get current location', {
        description: "Please check your location permissions"
      });
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const formatAddress = (result: SearchResult) => {
    const address = result.address;
    if (!address) return result.display_name;
    
    const parts = [] as string[];
    
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }
    
    if (address.city) {
      parts.push(address.city);
    } else if (address.suburb) {
      parts.push(address.suburb);
    }
    
    if (address.county) {
      parts.push(address.county);
    }
    
    if (address.state) {
      parts.push(address.state);
    }
    
    if (address.postcode) {
      parts.push(address.postcode);
    }
    
    return parts.length > 0 ? parts.join(', ') : result.display_name;
  };

  const getResultIcon = (result: SearchResult) => {
    const type = result.type || result.class || '';
    
    switch (type) {
      case 'house':
      case 'residential':
        return <Home className="w-4 h-4 text-blue-600" />;
      case 'building':
      case 'commercial':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'road':
      case 'highway':
        return <Map className="w-4 h-4 text-green-600" />;
      case 'place':
      case 'city':
      case 'town':
        return <Globe className="w-4 h-4 text-orange-600" />;
      default:
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleFocus = () => {
    if (query.length < 2) {
      setSearchMode('history');
      setShowResults(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (abortRef.current) {
        abortRef.current.abort();
      }
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
          className="input-enhanced pl-10 pr-20 h-12 text-base touch-manipulation"
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
              className="h-8 w-8 p-0 hover:bg-primary/10 transition-all duration-200 hover:scale-110"
              title="Use current location"
            >
              {geoLoading ? (
                <div className="spinner-enhanced w-3 h-3" />
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
              className="h-8 w-8 p-0 hover:bg-destructive/10 transition-all duration-200 hover:scale-110"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 px-2">
              {retryCount > 0 && (
                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                  Retry {retryCount}
                </Badge>
              )}
              <div className="spinner-enhanced w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Search Results */}
      {showResults && (
        <Card 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 card-enhanced max-h-80 overflow-hidden shadow-floating"
        >
          <div className="max-h-80 overflow-y-auto scrollbar-enhanced">
            {/* History Header */}
            {searchMode === 'history' && recentSearches.length > 0 && (
              <div className="flex items-center justify-between p-3 border-b border-border/30 bg-muted/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Recent Searches</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-6 px-2 text-xs hover:bg-destructive/10 transition-all duration-200"
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
                          className={`flex-1 text-left p-3 rounded-lg transition-all duration-200 border-0 bg-transparent touch-manipulation ${
                            isSelected 
                              ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                              : 'hover:bg-muted/50 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-blue-500/20">
                              <Clock className="w-4 h-4 text-blue-600" />
                            </div>
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
                          className="h-8 w-8 p-0 mr-2 hover:bg-destructive/10 transition-all duration-200"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  } else {
                    const result = item as SearchResult;
                    return (
                      <div key={`result-${index}`} className={`w-full p-2 rounded-lg ${isSelected ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-muted/50 hover:shadow-sm'} transition-all duration-200`}>
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-muted/20">
                            {getResultIcon(result)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => handleResultSelect(result)}
                              className="text-left block w-full"
                            >
                              <div className="text-sm font-medium text-foreground truncate">
                                {formatAddress(result)}
                              </div>
                              {result.address?.county && (
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                  <span>{result.address.county}, {result.address.state || 'VA'}</span>
                                  {result.type && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-muted/50">
                                      {result.type.replace('_', ' ')}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </button>
                            {onGetDirections && (
                              <div className="mt-2">
                                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleResultDirections(result)}>
                                  <Navigation className="w-3 h-3 mr-1" />
                                  Get Directions
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                })
              ) : (
                <div className="p-6 text-center">
                  {searchMode === 'search' && query.length >= 2 ? (
                    <div className="text-sm text-muted-foreground">
                      <MapPin className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p className="font-medium mb-1">No addresses found</p>
                      <p className="text-xs">Try searching for a different location</p>
                      {retryCount > 0 && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-yellow-600">
                          <RotateCcw className="w-3 h-3" />
                          <span>Retried {retryCount} time(s)</span>
                        </div>
                      )}
                    </div>
                  ) : searchMode === 'history' && query.length > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p className="font-medium mb-1">No matching searches</p>
                      <p className="text-xs">No matching searches in history</p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p className="font-medium mb-1">Start searching</p>
                      <p className="text-xs">Type to search for addresses, places, or coordinates</p>
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