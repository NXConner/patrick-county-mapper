import { useState, useEffect, useCallback } from 'react';

export interface SearchHistoryItem {
  query: string;
  address: string;
  timestamp: number;
  lat: number;
  lng: number;
}

const STORAGE_KEY = 'address_search_history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, [history]);

  const addToHistory = useCallback((item: Omit<SearchHistoryItem, 'timestamp'>) => {
    setHistory(prev => {
      // Remove existing entry if it exists
      const filtered = prev.filter(h => h.address !== item.address);
      
      // Add new entry at the beginning
      const newHistory = [
        { ...item, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_HISTORY_ITEMS);
      
      return newHistory;
    });
  }, []);

  const removeFromHistory = useCallback((address: string) => {
    setHistory(prev => prev.filter(item => item.address !== address));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getRecentSearches = useCallback((limit: number = 5) => {
    return history.slice(0, limit);
  }, [history]);

  const searchInHistory = useCallback((query: string) => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return history.filter(item => 
      item.query.toLowerCase().includes(lowerQuery) ||
      item.address.toLowerCase().includes(lowerQuery)
    );
  }, [history]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches,
    searchInHistory
  };
}

export default useSearchHistory;