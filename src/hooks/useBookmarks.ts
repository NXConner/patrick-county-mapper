import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface Bookmark {
  id: string;
  name: string;
  description?: string;
  coordinates: [number, number];
  zoom: number;
  category: 'work' | 'personal' | 'project' | 'favorite' | 'other';
  tags: string[];
  createdAt: Date;
  lastVisited?: Date;
  icon?: string;
  color?: string;
}

export interface BookmarkCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const DEFAULT_CATEGORIES: BookmarkCategory[] = [
  { id: 'work', name: 'Work', color: '#3b82f6', icon: '💼' },
  { id: 'personal', name: 'Personal', color: '#10b981', icon: '🏠' },
  { id: 'project', name: 'Project', color: '#f59e0b', icon: '🚧' },
  { id: 'favorite', name: 'Favorite', color: '#ef4444', icon: '⭐' },
  { id: 'other', name: 'Other', color: '#6b7280', icon: '📍' }
];

const STORAGE_KEY = 'patrick-county-gis-bookmarks';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories] = useState<BookmarkCategory[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<
          Omit<Bookmark, 'createdAt' | 'lastVisited'> & { createdAt: string; lastVisited?: string }
        >;
        // Convert date strings back to Date objects
        const bookmarksWithDates: Bookmark[] = parsed.map((bookmark) => ({
          ...bookmark,
          createdAt: new Date(bookmark.createdAt),
          lastVisited: bookmark.lastVisited ? new Date(bookmark.lastVisited) : undefined,
        }));
        setBookmarks(bookmarksWithDates);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      toast.error('Failed to load saved bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save bookmarks to localStorage
  const saveBookmarks = useCallback((newBookmarks: Bookmark[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
      toast.error('Failed to save bookmarks');
    }
  }, []);

  // Add new bookmark
  const addBookmark = useCallback((
    name: string,
    coordinates: [number, number],
    zoom: number,
    options?: Partial<Omit<Bookmark, 'id' | 'name' | 'coordinates' | 'zoom' | 'createdAt'>>
  ) => {
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      name,
      coordinates,
      zoom,
      category: options?.category || 'other',
      tags: options?.tags || [],
      description: options?.description,
      icon: options?.icon,
      color: options?.color,
      createdAt: new Date(),
      lastVisited: undefined
    };

    setBookmarks(prev => {
      const updated = [...prev, newBookmark];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save bookmarks:', error);
        toast.error('Failed to save bookmarks');
      }
      return updated;
    });

    toast.success(`Bookmark "${name}" added`);
    return newBookmark;
  }, []);

  // Update bookmark
  const updateBookmark = useCallback((id: string, updates: Partial<Bookmark>) => {
    setBookmarks(prev => {
      const updated = prev.map(bookmark =>
        bookmark.id === id ? { ...bookmark, ...updates } : bookmark
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save bookmarks:', error);
        toast.error('Failed to save bookmarks');
      }
      return updated;
    });
    toast.success('Bookmark updated');
  }, []);

  // Delete bookmark
  const deleteBookmark = useCallback((id: string) => {
    let deleted: Bookmark | undefined;
    setBookmarks(prev => {
      deleted = prev.find(b => b.id === id);
      const updated = prev.filter(b => b.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save bookmarks:', error);
        toast.error('Failed to save bookmarks');
      }
      return updated;
    });
    if (deleted) {
      toast.success(`Bookmark "${deleted.name}" deleted`);
    }
  }, []);

  // Visit bookmark (updates lastVisited)
  const visitBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const updated = prev.map(bookmark =>
        bookmark.id === id 
          ? { ...bookmark, lastVisited: new Date() }
          : bookmark
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save bookmarks:', error);
        toast.error('Failed to save bookmarks');
      }
      return updated;
    });
  }, []);

  // Search bookmarks
  const searchBookmarks = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return bookmarks.filter(bookmark =>
      bookmark.name.toLowerCase().includes(lowercaseQuery) ||
      ((bookmark.description?.toLowerCase() ?? '').includes(lowercaseQuery)) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [bookmarks]);

  // Get bookmarks by category
  const getBookmarksByCategory = useCallback((category: string) => {
    return bookmarks.filter(bookmark => bookmark.category === category);
  }, [bookmarks]);

  // Get recent bookmarks
  const getRecentBookmarks = useCallback((limit: number = 5) => {
    return [...bookmarks]
      .sort((a, b) => {
        const aDate = a.lastVisited || a.createdAt;
        const bDate = b.lastVisited || b.createdAt;
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, limit);
  }, [bookmarks]);

  // Export bookmarks
  const exportBookmarks = useCallback((format: 'json' | 'csv' = 'json') => {
    if (bookmarks.length === 0) {
      toast.error('No bookmarks to export');
      return;
    }

    try {
      let data: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        data = JSON.stringify(bookmarks, null, 2);
        filename = 'bookmarks.json';
        mimeType = 'application/json';
      } else {
        const headers = ['Name', 'Description', 'Latitude', 'Longitude', 'Zoom', 'Category', 'Tags', 'Created'];
        const csvRows = [
          headers.join(','),
          ...bookmarks.map(b => [
            `"${b.name}"`,
            `"${b.description || ''}"`,
            b.coordinates[0],
            b.coordinates[1],
            b.zoom,
            b.category,
            `"${b.tags.join('; ')}"`,
            b.createdAt.toISOString()
          ].join(','))
        ];
        data = csvRows.join('\n');
        filename = 'bookmarks.csv';
        mimeType = 'text/csv';
      }

      // Download file
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast.success(`Bookmarks exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export bookmarks');
    }
  }, [bookmarks]);

  // Import bookmarks
  const importBookmarks = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedBookmarks: Bookmark[];

        if (file.name.endsWith('.json')) {
          importedBookmarks = JSON.parse(content);
        } else {
          toast.error('Only JSON import is currently supported');
          return;
        }

        // Validate and process imported bookmarks
        const validBookmarks = importedBookmarks
          .filter(bookmark => 
            bookmark.name && 
            bookmark.coordinates && 
            Array.isArray(bookmark.coordinates) &&
            bookmark.coordinates.length === 2
          )
          .map(bookmark => ({
            ...bookmark,
            id: crypto.randomUUID(), // Generate new IDs to avoid conflicts
            createdAt: new Date(bookmark.createdAt),
            lastVisited: bookmark.lastVisited ? new Date(bookmark.lastVisited) : undefined
          }));

        setBookmarks(prev => {
          const updated = [...prev, ...validBookmarks];
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (error) {
            console.error('Failed to save bookmarks:', error);
            toast.error('Failed to save bookmarks');
          }
          return updated;
        });
        toast.success(`Imported ${validBookmarks.length} bookmarks`);
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import bookmarks');
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    bookmarks,
    categories,
    isLoading,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    visitBookmark,
    searchBookmarks,
    getBookmarksByCategory,
    getRecentBookmarks,
    exportBookmarks,
    importBookmarks
  };
};