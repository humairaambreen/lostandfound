// PWA Installation and Management
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.serviceWorkerRegistration = null;
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
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        this.serviceWorkerRegistration = registration;
        console.log('Service Worker registered successfully:', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          }
        });
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
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
      installButton.innerHTML = '📱 Install App';
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
    // Create update notification
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <span>🚀 New version available!</span>
        <button onclick="pwaManager.updateApp()" class="update-btn">Update</button>
        <button onclick="this.parentElement.parentElement.remove()" class="dismiss-btn">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  async updateApp() {
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
      // Tell the waiting service worker to activate
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to load the new version
      window.location.reload();
    }
  }

  setupNetworkStatus() {
    // Show network status
    window.addEventListener('online', () => {
      this.showNetworkStatus('online', '🟢 Back online!');
    });

    window.addEventListener('offline', () => {
      this.showNetworkStatus('offline', '🔴 You are offline');
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
