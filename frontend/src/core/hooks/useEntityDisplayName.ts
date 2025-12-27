import { useState, useEffect } from 'react';
import api from '@/core/lib/api';

/**
 * UUID validation regex pattern
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 */
export const isUUID = (str: string): boolean => {
  return UUID_REGEX.test(str);
};

/**
 * Get display name from entity data using priority: code -> name -> title -> id
 */
const getDisplayNameFromEntity = (entity: Record<string, unknown>): string | null => {
  if (!entity) return null;

  // Priority order: code -> name -> title -> id
  if (entity.code && typeof entity.code === 'string' && entity.code.trim()) {
    return entity.code.trim();
  }
  if (entity.name && typeof entity.name === 'string' && entity.name.trim()) {
    return entity.name.trim();
  }
  if (entity.title && typeof entity.title === 'string' && entity.title.trim()) {
    return entity.title.trim();
  }
  if (entity.id && typeof entity.id === 'string') {
    return entity.id.substring(0, 8) + '...';
  }

  return null;
};

/**
 * Build API endpoint from path segments
 * Handles URL to API endpoint mapping:
 * - Removes '/master' prefix
 * - Maps 'certificate-categories' -> 'certificates/categories'
 * Example: ['master', 'risk-categories', '123-uuid'] -> '/risk-categories/123-uuid'
 * Example: ['master', 'certificate-categories', '123-uuid'] -> '/certificates/categories/123-uuid'
 */
const buildEndpoint = (pathSegments: string[], index: number): string => {
  let segments = pathSegments.slice(0, index + 1);
  
  // Remove 'master' prefix if present
  if (segments[0] === 'master') {
    segments = segments.slice(1);
  }
  
  // Handle special mappings
  const pathMapping: Record<string, string> = {
    'certificate-categories': 'certificates/categories',
  };
  
  // Apply path mappings
  segments = segments.map(segment => pathMapping[segment] || segment);
  
  return '/' + segments.join('/');
};

/**
 * Cache for entity display names to avoid repeated API calls
 */
const entityCache = new Map<string, string>();

/**
 * Fetch entity display name from API
 */
const fetchEntityDisplayName = async (endpoint: string): Promise<string | null> => {
  // Check cache first
  if (entityCache.has(endpoint)) {
    return entityCache.get(endpoint) || null;
  }

  try {
    const response = await api.get(endpoint);
    // Handle both direct response and wrapped response.data
    const entity = response.data?.data || response.data;
    const displayName = getDisplayNameFromEntity(entity);

    if (displayName) {
      entityCache.set(endpoint, displayName);
      return displayName;
    }

    // Fallback to shortened ID
    const fallback = endpoint.split('/').pop()?.substring(0, 8) + '...' || '...';
    entityCache.set(endpoint, fallback);
    return fallback;
  } catch (error) {
    console.warn(`Failed to fetch entity display name for ${endpoint}:`, error);
    // Cache the fallback to avoid repeated failed requests
    const fallback = endpoint.split('/').pop()?.substring(0, 8) + '...' || '...';
    entityCache.set(endpoint, fallback);
    return fallback;
  }
};

/**
 * Hook to get entity display name
 * @param pathSegments - Array of URL path segments
 * @param index - Index of the segment to get display name for
 * @param locationState - Optional location state that might contain entity data
 */
export const useEntityDisplayName = (
  pathSegments: string[],
  index: number,
  locationState?: { entity?: Record<string, unknown> }
): string | null => {
  const [displayName, setDisplayName] = useState<string | null>(null);

  const segment = pathSegments[index];

  useEffect(() => {
    // If not a UUID, don't fetch
    if (!segment || !isUUID(segment)) {
      setDisplayName(null);
      return;
    }

    // Check location state first (if entity data was passed during navigation)
    if (locationState?.entity) {
      const name = getDisplayNameFromEntity(locationState.entity);
      if (name) {
        setDisplayName(name);
        return;
      }
    }

    // Build endpoint from path segments
    const endpoint = buildEndpoint(pathSegments, index);

    // Fetch from API
    fetchEntityDisplayName(endpoint)
      .then((name) => {
        setDisplayName(name);
      })
      .catch(() => {
        setDisplayName(segment.substring(0, 8) + '...');
      });
  }, [segment, pathSegments, index, locationState]);

  return displayName;
};

