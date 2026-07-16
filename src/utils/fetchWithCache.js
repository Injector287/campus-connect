export async function fetchWithCache(url) {
  // Try memory cache first
  const cached = sessionStorage.getItem(`erp_cache_${url}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const res = await fetch(url);
  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  
  const json = await res.json();
  // Cache successful responses
  if (json && !json.error) {
     try {
         sessionStorage.setItem(`erp_cache_${url}`, JSON.stringify(json));
     } catch (e) {
         // ignore quota errors etc
     }
  }
  
  return json;
}

export function clearCache() {
  const keys = Object.keys(sessionStorage);
  for (let key of keys) {
    if (key.startsWith('erp_cache_')) {
      sessionStorage.removeItem(key);
    }
  }
}
