// PWA Installation and Management
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.serviceWorkerRegistration = null;
    this.updateAvailable = false;
    this.init();
  }

  async init() {
    // Register service worker
    await this.registerServiceWorker();
    
    // Set up installation prompt
    this.setupInstallPrompt();
    
    // Check if app is already installed
    this.checkInstallStatus();
    
    // Handle online/offline status
    this.setupNetworkStatus();
    
    // Set up cache refresh on focus (important for cache busting!)
    this.setupCacheRefresh();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        this.serviceWorkerRegistration = registration;
        console.log('Service Worker registered successfully:', registration);
        
        // Force update check on page load
        registration.update();
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Only show update notification if this is a real update
                  // and not the initial installation
                  setTimeout(() => {
                    this.updateAvailable = true;
                    this.showUpdateNotification();
                  }, 1000); // Small delay to avoid false positives
                } else {
                  // First time installation
                  console.log('Service Worker installed for the first time');
                }
              }
            });
          }
        });
        
        // Handle controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New service worker took control, reloading...');
          window.location.reload();
        });
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // NEW: Set up automatic cache refresh
  setupCacheRefresh() {
    // Check for updates when the user returns to the tab (but not too frequently)
    let lastUpdateCheck = 0;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.serviceWorkerRegistration) {
        const now = Date.now();
        // Only check for updates if it's been more than 5 minutes since last check
        if (now - lastUpdateCheck > 300000) {
          console.log('Page became visible, checking for updates...');
          this.serviceWorkerRegistration.update();
          lastUpdateCheck = now;
        }
      }
    });

    // Check for updates when the user comes back online (but throttled)
    window.addEventListener('online', () => {
      if (this.serviceWorkerRegistration) {
        const now = Date.now();
        if (now - lastUpdateCheck > 60000) { // Only if it's been more than 1 minute
          console.log('Back online, checking for updates...');
          this.serviceWorkerRegistration.update();
          lastUpdateCheck = now;
        }
      }
    });

    // Periodic update checks (every 10 minutes when active, not 30 seconds)
    setInterval(() => {
      if (!document.hidden && this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration.update();
      }
    }, 600000); // 10 minutes instead of 30 seconds
  }

  setupInstallPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      
      // Stash the event so it can be triggered later
      this.deferredPrompt = event;
      
      // Show install button
      this.showInstallButton();
    });

    // Handle successful installation
    window.addEventListener('appinstalled', (event) => {
      console.log('PWA was installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showInstallSuccessMessage();
    });
  }

  showInstallButton() {
    // Create install button if it doesn't exist
    if (!document.getElementById('pwa-install-btn')) {
      const installButton = document.createElement('button');
      installButton.id = 'pwa-install-btn';
      installButton.innerHTML = 'Install App';
      installButton.className = 'pwa-install-button';
      installButton.onclick = () => this.promptInstall();
      
      // Add to bottom tabs area
      const bottomTabs = document.querySelector('.bottom-tabs');
      if (bottomTabs) {
        bottomTabs.appendChild(installButton);
      }
    }
  }

  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.remove();
    }
  }

  async promptInstall() {
    if (this.deferredPrompt) {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      this.deferredPrompt = null;
    }
  }

  checkInstallStatus() {
    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('App is running in installed mode');
      document.body.classList.add('pwa-installed');
    }
  }

  showUpdateNotification() {
    // Prevent duplicate notifications
    if (document.getElementById('pwa-update-notification')) {
      return;
    }
    
    // Remove existing update notification
    const existing = document.getElementById('pwa-update-notification');
    if (existing) existing.remove();
    
    // Create update notification
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <span>✨ New version available!</span>
        <button onclick="pwaManager.updateApp()" class="update-btn">Update</button>
        <button onclick="pwaManager.dismissUpdate()" class="dismiss-btn">Later</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 20 seconds (increased from 15)
    setTimeout(() => {
      this.dismissUpdate();
    }, 20000);
  }

  dismissUpdate() {
    const notification = document.getElementById('pwa-update-notification');
    if (notification) {
      notification.remove();
    }
  }

  async updateApp() {
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
      // Tell the waiting service worker to activate
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // The controllerchange event will trigger a reload
    } else {
      // Force reload if no waiting worker
      window.location.reload();
    }
  }

  // NEW: Clear all caches manually
  async clearAllCaches() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
      
      // Also tell service worker to clear its caches
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
        const messageChannel = new MessageChannel();
        this.serviceWorkerRegistration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      }
      
      // Force reload to get fresh content
      window.location.reload();
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  setupNetworkStatus() {
    // Show network status
    window.addEventListener('online', () => {
      this.showNetworkStatus('online', 'Back online!');
      // Check for updates when coming back online
      if (this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration.update();
      }
    });

    window.addEventListener('offline', () => {
      this.showNetworkStatus('offline', 'You are offline');
    });
  }

  showNetworkStatus(status, message) {
    // Remove existing notification
    const existing = document.getElementById('network-status');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.id = 'network-status';
    notification.className = `network-status ${status}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }

  showInstallSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'install-success-message';
    message.innerHTML = '✅ Lost and Found app installed successfully!';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentElement) {
        message.remove();
      }
    }, 4000);
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Make it globally available
window.pwaManager = pwaManager;

// Add some global functions for debugging cache issues
window.clearAppCache = () => pwaManager.clearAllCaches();
window.forceAppUpdate = () => pwaManager.updateApp();
