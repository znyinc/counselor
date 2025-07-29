/**
 * Service Worker for AI Career Counseling Tool
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'ai-career-counseling-v1';
const STATIC_CACHE_NAME = 'static-v1';
const API_CACHE_NAME = 'api-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const CACHEABLE_API_ENDPOINTS = [
  '/api/colleges',
  '/api/careers',
  '/api/scholarships'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE_NAME)
    ]).then(() => {
      console.log('Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: network first
  event.respondWith(fetch(request));
});

/**
 * Handle API requests with cache-first strategy for static data
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isStaticData = CACHEABLE_API_ENDPOINTS.some(endpoint => 
    url.pathname.startsWith(endpoint)
  );

  if (isStaticData && request.method === 'GET') {
    // Cache-first strategy for static data
    try {
      const cache = await caches.open(API_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('Serving from cache:', request.url);
        
        // Update cache in background
        fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        }).catch(() => {
          // Ignore network errors for background updates
        });
        
        return cachedResponse;
      }

      // Fetch from network and cache
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable',
          offline: true 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Network-first for dynamic data (profile submissions, etc.)
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.error('Network request failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable',
        offline: true 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle static asset requests with cache-first strategy
 */
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Static request failed:', error);
    
    // Return offline page for document requests
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return cache.match('/') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Handle background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'profile-submission') {
    event.waitUntil(syncProfileSubmissions());
  }
});

/**
 * Sync offline profile submissions when back online
 */
async function syncProfileSubmissions() {
  try {
    const db = await openIndexedDB();
    const submissions = await getOfflineSubmissions(db);
    
    for (const submission of submissions) {
      try {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submission.data)
        });
        
        if (response.ok) {
          await removeOfflineSubmission(db, submission.id);
          console.log('Synced offline submission:', submission.id);
        }
      } catch (error) {
        console.error('Failed to sync submission:', submission.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * IndexedDB helpers for offline storage
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CareerCounselingDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('submissions')) {
        db.createObjectStore('submissions', { keyPath: 'id' });
      }
    };
  });
}

function getOfflineSubmissions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['submissions'], 'readonly');
    const store = transaction.objectStore('submissions');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeOfflineSubmission(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['submissions'], 'readwrite');
    const store = transaction.objectStore('submissions');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Handle push notifications (if implemented in future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'career-counseling',
      requireInteraction: true
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});