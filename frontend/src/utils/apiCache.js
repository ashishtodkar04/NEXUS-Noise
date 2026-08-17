import useStore from '../store/useStore';

/**
 * API caching utility with debouncing and TTL support
 * Reduces redundant API calls and improves performance
 */

const pendingRequests = new Map();

export const fetchWithCache = async (key, fetchFn, options = {}) => {
  const {
    ttl = 300000, // 5 minutes default TTL
    forceRefresh = false,
    debounceMs = 300
  } = options;

  // Check cache first
  if (!forceRefresh) {
    const cached = useStore.getState().getCache(key);
    if (cached) {
      return cached;
    }
  }

  // Debounce concurrent requests
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Create new request
  const requestPromise = fetchFn()
    .then((data) => {
      useStore.getState().setCache(key, data, ttl);
      pendingRequests.delete(key);
      return data;
    })
    .catch((error) => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, requestPromise);

  return requestPromise;
};

/**
 * Debounce utility for API calls
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate cache key from request parameters
 */
export const generateCacheKey = (endpoint, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
};

/**
 * Clear cache for specific pattern
 */
export const clearCachePattern = (pattern) => {
  const store = useStore.getState();
  Object.keys(store.cache).forEach(key => {
    if (key.includes(pattern)) {
      store.clearCache(key);
    }
  });
};
