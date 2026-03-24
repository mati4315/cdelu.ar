/**
 * app-config.js
 * 
 * Loads module configuration from the backend at startup.
 * Include this <script> BEFORE any other feature scripts on your pages.
 * 
 * After loading, use window.SiteModules to check if a module is enabled:
 *   if (window.SiteModules.ads) { // initialize ads }
 *   if (window.SiteModules.lotteries) { // initialize lottery widget }
 */

(async function () {
  const CACHE_KEY = 'site_modules_config';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Default: all modules enabled (fail-open behavior)
  const defaults = {
    ads: true,
    lotteries: true,
    surveys: true,
    facebook: true,
    community: true
  };

  function loadFromCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    } catch (e) {}
    return null;
  }

  function saveToCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {}
  }

  // Try cache first for instant load
  const cached = loadFromCache();
  if (cached) {
    window.SiteModules = cached;
    return;
  }

  try {
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001/api/v1'
      : '/api/v1';

    const res = await fetch(`${API_BASE}/modules/config`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.modules) {
        window.SiteModules = json.modules;
        saveToCache(json.modules);
        return;
      }
    }
  } catch (e) {
    console.warn('[SiteModules] Could not fetch module config, using defaults.', e);
  }

  // Fallback to defaults
  window.SiteModules = { ...defaults };
})();
