// A simple in-memory cache service for API responses
const cache = {
  lookups: new Map(),
  definitions: new Map(),
  quotes: new Map(),
  images: new Map(),
  disambiguations: new Map(),
  arena: new Map() // <-- cache for Are.na blocks
};

export function getCached(type, key) {
  if (!cache[type]) return null;
  return cache[type].get(key);
}

export function setCached(type, key, value, ttl = 1000 * 60 * 30) { // Default TTL: 30 minutes
  if (!cache[type]) return;
  
  // Store with expiration
  const item = {
    value,
    expiry: Date.now() + ttl
  };
  
  cache[type].set(key, item);
  
  // Optional: Return a function to clear this specific cache entry
  return () => cache[type].delete(key);
}

export function isValid(cachedItem) {
  if (!cachedItem) return false;
  return cachedItem.expiry > Date.now();
}

// Clean expired items every 5 minutes
setInterval(() => {
  Object.values(cache).forEach(typeCache => {
    typeCache.forEach((item, key) => {
      if (item.expiry <= Date.now()) {
        typeCache.delete(key);
      }
    });
  });
}, 1000 * 60 * 5);

export default {
  getCached,
  setCached,
  isValid
};
