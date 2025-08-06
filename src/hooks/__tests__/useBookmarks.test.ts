import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBookmarks } from '../useBookmarks';

describe('useBookmarks', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with empty bookmarks', () => {
    const { result } = renderHook(() => useBookmarks());
    
    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should add a new bookmark', () => {
    const { result } = renderHook(() => useBookmarks());
    
    act(() => {
      result.current.addBookmark(
        'Test Location',
        [36.6885, -80.2735],
        15,
        { category: 'work', description: 'Test bookmark' }
      );
    });

    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0]).toMatchObject({
      name: 'Test Location',
      coordinates: [36.6885, -80.2735],
      zoom: 15,
      category: 'work',
      description: 'Test bookmark',
    });
    expect(result.current.bookmarks[0].id).toBe('mock-uuid-123');
  });

  it('should update an existing bookmark', () => {
    const { result } = renderHook(() => useBookmarks());
    
    // Add a bookmark first
    act(() => {
      result.current.addBookmark('Test Location', [36.6885, -80.2735], 15);
    });

    const bookmarkId = result.current.bookmarks[0].id;

    // Update the bookmark
    act(() => {
      result.current.updateBookmark(bookmarkId, {
        name: 'Updated Location',
        description: 'Updated description',
      });
    });

    expect(result.current.bookmarks[0].name).toBe('Updated Location');
    expect(result.current.bookmarks[0].description).toBe('Updated description');
  });

  it('should delete a bookmark', () => {
    const { result } = renderHook(() => useBookmarks());
    
    // Add a bookmark first
    act(() => {
      result.current.addBookmark('Test Location', [36.6885, -80.2735], 15);
    });

    const bookmarkId = result.current.bookmarks[0].id;

    // Delete the bookmark
    act(() => {
      result.current.deleteBookmark(bookmarkId);
    });

    expect(result.current.bookmarks).toHaveLength(0);
  });

  it('should search bookmarks by name', () => {
    const { result } = renderHook(() => useBookmarks());
    
    // Add multiple bookmarks
    act(() => {
      result.current.addBookmark('Patrick County Office', [36.6885, -80.2735], 15);
      result.current.addBookmark('Stuart Library', [36.6875, -80.2745], 16);
      result.current.addBookmark('Floyd County Border', [36.6895, -80.2755], 14);
    });

    const searchResults = result.current.searchBookmarks('Patrick');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].name).toBe('Patrick County Office');
  });

  it('should get bookmarks by category', () => {
    const { result } = renderHook(() => useBookmarks());
    
    // Add bookmarks with different categories
    act(() => {
      result.current.addBookmark('Work Place', [36.6885, -80.2735], 15, { category: 'work' });
      result.current.addBookmark('Home', [36.6875, -80.2745], 16, { category: 'personal' });
      result.current.addBookmark('Project Site', [36.6895, -80.2755], 14, { category: 'project' });
    });

    const workBookmarks = result.current.getBookmarksByCategory('work');
    expect(workBookmarks).toHaveLength(1);
    expect(workBookmarks[0].name).toBe('Work Place');
  });

  it('should get recent bookmarks', () => {
    const { result } = renderHook(() => useBookmarks());
    
    // Add bookmarks
    act(() => {
      result.current.addBookmark('First', [36.6885, -80.2735], 15);
      result.current.addBookmark('Second', [36.6875, -80.2745], 16);
      result.current.addBookmark('Third', [36.6895, -80.2755], 14);
    });

    // Visit one of them
    act(() => {
      result.current.visitBookmark(result.current.bookmarks[0].id);
    });

    const recentBookmarks = result.current.getRecentBookmarks(2);
    expect(recentBookmarks).toHaveLength(2);
    expect(recentBookmarks[0].name).toBe('First'); // Most recently visited
  });

  it('should load bookmarks from localStorage', () => {
    const mockBookmarks = [
      {
        id: 'test-id',
        name: 'Saved Location',
        coordinates: [36.6885, -80.2735],
        zoom: 15,
        category: 'work',
        tags: [],
        createdAt: new Date().toISOString(),
      },
    ];

    localStorage.setItem('patrick-county-gis-bookmarks', JSON.stringify(mockBookmarks));

    const { result } = renderHook(() => useBookmarks());

    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0].name).toBe('Saved Location');
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.getItem to throw an error
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useBookmarks());

    // Should not crash and should have empty bookmarks
    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});