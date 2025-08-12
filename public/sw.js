const CACHE_NAME = 'lost-and-found-v1.0.0';
const API_CACHE_NAME = 'lost-and-found-api-v1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/post.html',
  '/style.css',
  '/post-custom.css',
  '/app.js',
  '/post.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Dancing+Script:wght@700&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/items'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('Error during service worker installation:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated successfully');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);
  
  // Handle API requests
  if (requestURL.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }
  
  // Handle static file requests
  event.respondWith(handleStaticRequest(event.request));
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, trying cache...', error);
    
    // Fallback to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline page for failed API requests
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          error: 'You are currently offline. Please check your internet connection.',
          offline: true 
        }),
        {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For POST requests, return error
    return new Response(
      JSON.stringify({ error: 'Unable to complete request while offline' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network and cache miss for:', request.url);
    
    // Return offline fallback for HTML pages
    if (request.destination === 'document') {
      const offlineResponse = await cache.match('/index.html');
      return offlineResponse || new Response('Offline', { status: 200 });
    }
    
    throw error;
  }
}

// Handle background sync for posting items when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-post') {
    console.log('Background sync: posting queued items...');
    event.waitUntil(syncPendingPosts());
  }
});

// Sync pending posts when back online
async function syncPendingPosts() {
  try {
    // Get pending posts from IndexedDB (you'd implement this storage)
    // For now, we'll just log that sync would happen
    console.log('Would sync pending posts if any were stored');
  } catch (error) {
    console.error('Error syncing pending posts:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New item posted on Lost and Found',
      icon: '/icons/icon-192x192.jpeg',
      badge: '/icons/icon-72x72.jpeg',
      vibrate: [100, 50, 100],
      data: data.url || '/',
      actions: [
        {
          action: 'view',
          title: 'View Item'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Lost and Found', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data || '/')
    );
  }
});

console.log('Service Worker script loaded');
