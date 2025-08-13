// Chat functionality
class ChatManager {
  constructor() {
    this.currentUser = null;
    this.messagesContainer = document.getElementById('chatMessages');
    this.messageInput = document.getElementById('chatMessageInput');
    this.sendButton = document.getElementById('sendMessageBtn');
    this.imageUploadBtn = document.getElementById('imageUploadBtn');
    this.chatImageInput = document.getElementById('chatImageInput');
    this.nameInput = document.getElementById('chatName');
    this.joinButton = document.getElementById('joinChatBtn');
    this.chatHeaderTitle = document.getElementById('chatHeaderTitle');
    this.chatHeaderMenu = document.getElementById('chatHeaderMenu');
    this.leaveChatMenuItem = document.getElementById('leaveChatMenuItem');
    this.clearChatMenuItem = document.getElementById('clearChatMenuItem');
    this.toggleNavMenuItem = document.getElementById('toggleNavMenuItem');
    this.navToggleText = document.getElementById('navToggleText');
    this.leaveChatModal = document.getElementById('leaveChatModal');
    this.cancelLeaveBtn = document.getElementById('cancelLeaveBtn');
    this.confirmLeaveBtn = document.getElementById('confirmLeaveBtn');
    this.namePrompt = document.getElementById('namePrompt');
    this.chatInterface = document.getElementById('chatInterface');
    this.imageOverlay = document.getElementById('imageOverlay');
    this.overlayImage = document.getElementById('overlayImage');
    this.closeImageOverlay = document.getElementById('closeImageOverlay');
    this.messages = []; // Store messages locally to track changes
    this.replyingTo = null; // Store the message being replied to
    this.longPressTimer = null;
    this.isLongPressing = false;
    this.isNavHidden = false; // Track navigation visibility state
    
    this.init();
  }

  init() {
    // Check if user already has a name stored
    const savedName = localStorage.getItem('chatUserName');
    if (savedName) {
      this.joinChat(savedName);
    }

    // Event listeners
    this.joinButton.addEventListener('click', () => this.handleJoinChat());
    this.setupHeaderLongPress();
    this.leaveChatMenuItem.addEventListener('click', () => this.handleLeaveChat());
    this.clearChatMenuItem.addEventListener('click', () => this.handleClearMessages());
    this.toggleNavMenuItem.addEventListener('click', () => this.handleToggleNavigation());
    this.cancelLeaveBtn.addEventListener('click', () => this.hideLeaveChatModal());
    this.confirmLeaveBtn.addEventListener('click', () => this.confirmLeaveChat());
    
    // Close modal when clicking outside
    this.leaveChatModal.addEventListener('click', (e) => {
      if (e.target === this.leaveChatModal) {
        this.hideLeaveChatModal();
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.chatHeaderTitle.contains(e.target) && !this.chatHeaderMenu.contains(e.target)) {
        this.hideHeaderMenu();
      }
    });
    
    this.sendButton.addEventListener('click', () => this.handleSendMessage());
    this.imageUploadBtn.addEventListener('click', () => this.chatImageInput.click());
    this.chatImageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSendMessage();
      }
    });
    this.nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleJoinChat();
      }
    });

    // Load messages when chat tab becomes visible
    document.getElementById('chatTabBtn').addEventListener('click', () => {
      if (this.currentUser) {
        this.loadMessages();
        this.scrollToBottom();
      }
    });

    // Image overlay event listeners
    this.closeImageOverlay.addEventListener('click', () => this.hideImageOverlay());
    this.imageOverlay.addEventListener('click', (e) => {
      if (e.target === this.imageOverlay) {
        this.hideImageOverlay();
      }
    });
  }

  setupHeaderLongPress() {
    // Touch events for mobile
    this.chatHeaderTitle.addEventListener('touchstart', (e) => {
      if (!this.currentUser) return;
      
      this.isLongPressing = false;
      this.longPressTimer = setTimeout(() => {
        this.isLongPressing = true;
        this.showHeaderMenu();
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, 500); // 500ms long press
    });

    this.chatHeaderTitle.addEventListener('touchend', (e) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
      }
      
      // If it wasn't a long press, hide menu if it's showing
      if (!this.isLongPressing && this.chatHeaderMenu.style.display === 'block') {
        this.hideHeaderMenu();
      }
    });

    this.chatHeaderTitle.addEventListener('touchmove', (e) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
      }
    });

    // Mouse events for desktop
    this.chatHeaderTitle.addEventListener('mousedown', (e) => {
      if (!this.currentUser) return;
      
      this.isLongPressing = false;
      this.longPressTimer = setTimeout(() => {
        this.isLongPressing = true;
        this.showHeaderMenu();
      }, 500);
    });

    this.chatHeaderTitle.addEventListener('mouseup', (e) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
      }
      
      if (!this.isLongPressing && this.chatHeaderMenu.style.display === 'block') {
        this.hideHeaderMenu();
      }
    });

    this.chatHeaderTitle.addEventListener('mouseleave', (e) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
      }
    });
  }

  showHeaderMenu() {
    this.chatHeaderMenu.style.display = 'block';
  }

  hideHeaderMenu() {
    this.chatHeaderMenu.style.display = 'none';
  }

  handleClearMessages() {
    this.hideHeaderMenu();
    
    if (confirm('Are you sure you want to clear all messages from your view? This will only clear them locally.')) {
      this.messagesContainer.innerHTML = '<div class="chat-empty">Messages cleared locally. New messages will appear here.</div>';
      this.messages = [];
    }
  }

  handleJoinChat() {
    const name = this.nameInput.value.trim();
    if (!name) {
      alert('Please enter your name');
      return;
    }
    if (name.length > 30) {
      alert('Name must be 30 characters or less');
      return;
    }
    this.joinChat(name);
  }

  joinChat(name) {
    this.currentUser = name;
    localStorage.setItem('chatUserName', name);
    this.namePrompt.style.display = 'none';
    this.chatInterface.style.display = 'flex';
    this.loadMessages();
    this.scrollToBottom();
    this.messageInput.focus();
    
    // Start polling for new messages
    this.startPolling();
  }

  handleLeaveChat() {
    this.hideHeaderMenu();
    this.showLeaveChatModal();
  }
  
  handleToggleNavigation() {
    this.hideHeaderMenu();
    const bottomTabs = document.querySelector('.bottom-tabs');
    const chatTab = document.getElementById('chatTab');
    
    if (this.isNavHidden) {
      // Show navigation
      bottomTabs.style.display = 'flex';
      chatTab.classList.remove('nav-hidden');
      this.navToggleText.textContent = 'Hide Navigation';
      this.isNavHidden = false;
      // Store preference for chat tab only
      localStorage.setItem('chatNavHidden', 'false');
    } else {
      // Hide navigation
      bottomTabs.style.display = 'none';
      chatTab.classList.add('nav-hidden');
      this.navToggleText.textContent = 'Show Navigation';
      this.isNavHidden = true;
      // Store preference for chat tab only
      localStorage.setItem('chatNavHidden', 'true');
    }
  }
  
  // Method to restore navigation when leaving chat tab
  restoreNavigation() {
    const bottomTabs = document.querySelector('.bottom-tabs');
    const chatTab = document.getElementById('chatTab');
    
    // Always show navigation when leaving chat
    bottomTabs.style.display = 'flex';
    chatTab.classList.remove('nav-hidden');
    
    // Reset the toggle state
    this.isNavHidden = false;
    this.navToggleText.textContent = 'Hide Navigation';
  }
  
  showLeaveChatModal() {
    this.leaveChatModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
  
  hideLeaveChatModal() {
    this.leaveChatModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
  }
  
  confirmLeaveChat() {
    this.hideLeaveChatModal();
    this.leaveChat();
  }

  leaveChat() {
    this.currentUser = null;
    localStorage.removeItem('chatUserName');
    this.namePrompt.style.display = 'flex';
    this.chatInterface.style.display = 'none';
    this.nameInput.value = '';
    this.messageInput.value = '';
    this.messagesContainer.innerHTML = '';
    
    // Stop polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async handleSendMessage() {
    if (!this.currentUser) return;
    
    const message = this.messageInput.value.trim();
    if (!message) return;

    if (message.length > 500) {
      alert('Message must be 500 characters or less');
      return;
    }

    this.sendButton.disabled = true;
    this.sendButton.textContent = 'Sending...';

    try {
      const messageData = {
        name: this.currentUser,
        message: message
      };

      // Add reply information if replying to a message
      if (this.replyingTo) {
        messageData.replyTo = {
          name: this.replyingTo.name,
          message: this.replyingTo.message,
          timestamp: this.replyingTo.timestamp
        };
      }

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      this.messageInput.value = '';
      this.cancelReply(); // Clear reply state
      this.loadMessages();
      this.scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      this.sendButton.disabled = false;
      this.sendButton.textContent = 'Send';
    }
  }

  async handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    this.imageUploadBtn.disabled = true;
    
    try {
      // Convert image to base64
      const base64 = await this.convertToBase64(file);
      
      const messageData = {
        name: this.currentUser,
        message: '', // Empty message for image-only messages
        image: base64,
        imageType: file.type
      };

      // Add reply information if replying to a message
      if (this.replyingTo) {
        messageData.replyTo = {
          name: this.replyingTo.name,
          message: this.replyingTo.message,
          timestamp: this.replyingTo.timestamp
        };
      }

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error('Failed to send image');
      }

      this.cancelReply(); // Clear reply state
      this.loadMessages();
      this.scrollToBottom();
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Failed to send image. Please try again.');
    } finally {
      this.imageUploadBtn.disabled = false;
      // Clear the file input
      this.chatImageInput.value = '';
    }
  }

  convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  async loadMessages() {
    try {
      const response = await fetch('/api/chat/messages');
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const newMessages = await response.json();
      
      // Check if we have new messages to avoid unnecessary re-renders
      if (newMessages.length === this.messages.length && 
          newMessages.length > 0 && 
          this.messages.length > 0 &&
          newMessages[newMessages.length - 1]._id === this.messages[this.messages.length - 1]._id) {
        return; // No new messages, don't re-render
      }

      const wasScrolledToBottom = this.isScrolledToBottom();
      
      // Only append new messages if we already have messages displayed
      if (this.messages.length > 0 && newMessages.length > this.messages.length) {
        const newMessagesToAdd = newMessages.slice(this.messages.length);
        this.appendNewMessages(newMessagesToAdd);
      } else {
        // Initial load or complete refresh needed
        this.displayMessages(newMessages);
      }
      
      this.messages = newMessages;
      
      // Auto-scroll to bottom if user was at bottom or if it's their own message
      if (wasScrolledToBottom || (newMessages.length > 0 && 
          newMessages[newMessages.length - 1].name === this.currentUser)) {
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (this.messages.length === 0) {
        this.messagesContainer.innerHTML = '<div class="chat-empty">Failed to load messages. Please try again later.</div>';
      }
    }
  }

  displayMessages(messages) {
    if (messages.length === 0) {
      this.messagesContainer.innerHTML = '<div class="chat-empty">No messages yet. Be the first to say hello! 👋</div>';
      return;
    }

    // Sort messages by timestamp to ensure proper order (oldest first)
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    // Clear container and rebuild
    this.messagesContainer.innerHTML = '';

    sortedMessages.forEach((msg, index) => {
      const isOwn = msg.name === this.currentUser;
      const timestamp = new Date(msg.timestamp);
      const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Check if this message is from the same sender as the previous one
      const prevMsg = index > 0 ? sortedMessages[index - 1] : null;
      const showHeader = !prevMsg || prevMsg.name !== msg.name;
      
      const messageElement = document.createElement('div');
      messageElement.className = `chat-message ${isOwn ? 'own' : 'other'} ${showHeader ? 'first-in-group' : 'continuation'}${msg.replyTo ? ' replied-message' : ''}`;
      
      // Check if this message is a reply
      const isReply = msg.replyTo;
      const hasImage = msg.image;
      
      messageElement.innerHTML = `
        ${showHeader ? `
          <div class="message-header">
            <span class="message-sender">${this.escapeHtml(msg.name)}</span>
            <span class="message-time">${timeString}</span>
          </div>
        ` : ''}
        ${isReply ? `
          <div class="reply-reference">
            <div class="reply-to-name">${this.escapeHtml(msg.replyTo.name)}</div>
            <div class="reply-to-message">${msg.replyTo.image ? '📷 Image' : this.escapeHtml(msg.replyTo.message.substring(0, 50))}${!msg.replyTo.image && msg.replyTo.message.length > 50 ? '...' : ''}</div>
          </div>
        ` : ''}
        <div class="message-content${hasImage ? ' has-image' : ''}">
          ${hasImage ? `
            <div class="message-image-container">
              <img src="${msg.image}" alt="Shared image" class="message-image" onclick="window.chatManager.showImageOverlay('${msg.image}')" />
            </div>
          ` : ''}
          ${msg.message ? this.escapeHtml(msg.message) : ''}
        </div>
        <div class="swipe-indicator">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18m-9-9l9 9-9 9"/>
          </svg>
        </div>
      `;
      
      this.messagesContainer.appendChild(messageElement);
      this.setupSwipeHandlers(messageElement, msg);
    });
  }

  appendNewMessages(newMessages) {
    if (newMessages.length === 0) return;
    
    // If container only has empty message, clear it first
    if (this.messagesContainer.querySelector('.chat-empty')) {
      this.messagesContainer.innerHTML = '';
    }
    
    // Sort new messages by timestamp to ensure proper order (oldest first)
    const sortedMessages = [...newMessages].sort((a, b) => a.timestamp - b.timestamp);
    
    // Get the last message currently displayed to check for grouping
    const lastDisplayedMessage = this.messages.length > newMessages.length ? 
      this.messages[this.messages.length - newMessages.length - 1] : null;
    
    sortedMessages.forEach((msg, index) => {
      const isOwn = msg.name === this.currentUser;
      const timestamp = new Date(msg.timestamp);
      const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Check if this message is from the same sender as the previous one
      let prevMsg;
      if (index === 0) {
        // First new message - check against last displayed message
        prevMsg = lastDisplayedMessage;
      } else {
        // Check against previous new message
        prevMsg = sortedMessages[index - 1];
      }
      
      const showHeader = !prevMsg || prevMsg.name !== msg.name;
      
      const messageElement = document.createElement('div');
      messageElement.className = `chat-message ${isOwn ? 'own' : 'other'} ${showHeader ? 'first-in-group' : 'continuation'}${msg.replyTo ? ' replied-message' : ''}`;
      
      // Check if this message is a reply
      const isReply = msg.replyTo;
      const hasImage = msg.image;
      
      messageElement.innerHTML = `
        ${showHeader ? `
          <div class="message-header">
            <span class="message-sender">${this.escapeHtml(msg.name)}</span>
            <span class="message-time">${timeString}</span>
          </div>
        ` : ''}
        ${isReply ? `
          <div class="reply-reference">
            <div class="reply-to-name">${this.escapeHtml(msg.replyTo.name)}</div>
            <div class="reply-to-message">${msg.replyTo.image ? '📷 Image' : this.escapeHtml(msg.replyTo.message.substring(0, 50))}${!msg.replyTo.image && msg.replyTo.message.length > 50 ? '...' : ''}</div>
          </div>
        ` : ''}
        <div class="message-content${hasImage ? ' has-image' : ''}">
          ${hasImage ? `
            <div class="message-image-container">
              <img src="${msg.image}" alt="Shared image" class="message-image" onclick="window.chatManager.showImageOverlay('${msg.image}')" />
            </div>
          ` : ''}
          ${msg.message ? this.escapeHtml(msg.message) : ''}
        </div>
        <div class="swipe-indicator">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18m-9-9l9 9-9 9"/>
          </svg>
        </div>
      `;
      
      this.messagesContainer.appendChild(messageElement);
      this.setupSwipeHandlers(messageElement, msg);
    });
  }

  startPolling() {
    // Poll for new messages every 5 seconds (increased from 3 to reduce server load)
    this.pollInterval = setInterval(() => {
      if (this.currentUser && document.getElementById('chatTab').style.display !== 'none') {
        this.loadMessages();
      }
    }, 5000);
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }

  isScrolledToBottom() {
    const threshold = 50; // pixels from bottom
    return this.messagesContainer.scrollTop + this.messagesContainer.clientHeight + threshold >= this.messagesContainer.scrollHeight;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  showImageOverlay(imageSrc) {
    this.overlayImage.src = imageSrc;
    this.imageOverlay.style.display = 'block';
    // Prevent body scroll when overlay is open
    document.body.style.overflow = 'hidden';
  }

  hideImageOverlay() {
    this.imageOverlay.style.display = 'none';
    this.overlayImage.src = '';
    // Restore body scroll
    document.body.style.overflow = '';
  }

  // Swipe to reply functionality
  setupSwipeHandlers(messageElement, messageData) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let hasMoved = false; // Track if user actually moved during drag
    let threshold = 80; // Minimum swipe distance to trigger reply
    let currentElement = null; // Track which element is being dragged

    // Touch events for mobile
    messageElement.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      currentX = startX;
      currentY = startY;
      isDragging = true;
      hasMoved = false;
      currentElement = messageElement;
      messageElement.style.transition = 'none';
    });

    messageElement.addEventListener('touchmove', (e) => {
      if (!isDragging || currentElement !== messageElement) return;
      
      const touch = e.touches[0];
      currentX = touch.clientX;
      currentY = touch.clientY;
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      // Mark that user has moved if they moved more than 5 pixels
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasMoved = true;
      }
      
      // Only allow horizontal swipe if it's more horizontal than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        e.preventDefault();
        
        // Only allow swipe in the correct direction based on message position
        const isOwnMessage = messageData.name === this.currentUser;
        const maxSwipe = isOwnMessage ? (deltaX < 0 ? Math.max(deltaX, -threshold) : 0) : 
                                        (deltaX > 0 ? Math.min(deltaX, threshold) : 0);
        
        messageElement.style.transform = `translateX(${maxSwipe}px)`;
        
        // Add visual feedback when threshold is reached
        if (Math.abs(maxSwipe) >= threshold * 0.8) {
          messageElement.classList.add('swipe-ready');
        } else {
          messageElement.classList.remove('swipe-ready');
        }
      }
    });

    messageElement.addEventListener('touchend', (e) => {
      if (!isDragging || currentElement !== messageElement) return;
      
      const deltaX = currentX - startX;
      const isOwnMessage = messageData.name === this.currentUser;
      const validSwipe = hasMoved && (isOwnMessage ? deltaX < -threshold : deltaX > threshold);
      
      messageElement.style.transition = 'transform 0.3s ease';
      
      if (validSwipe) {
        this.startReply(messageData);
      }
      
      messageElement.style.transform = '';
      messageElement.classList.remove('swipe-ready');
      isDragging = false;
      hasMoved = false;
      currentElement = null;
    });

    // Mouse events for desktop
    let mouseEventHandlers = {
      mousemove: null,
      mouseup: null
    };

    messageElement.addEventListener('mousedown', (e) => {
      // Only handle left mouse button
      if (e.button !== 0) return;
      
      startX = e.clientX;
      startY = e.clientY;
      currentX = startX;
      currentY = startY;
      isDragging = true;
      hasMoved = false;
      currentElement = messageElement;
      messageElement.style.transition = 'none';
      e.preventDefault();

      // Create mouse event handlers for this specific drag session
      mouseEventHandlers.mousemove = (e) => {
        if (!isDragging || currentElement !== messageElement) return;
        
        currentX = e.clientX;
        currentY = e.clientY;
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        // Mark that user has moved if they moved more than 5 pixels
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          hasMoved = true;
        }
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          const isOwnMessage = messageData.name === this.currentUser;
          const maxSwipe = isOwnMessage ? (deltaX < 0 ? Math.max(deltaX, -threshold) : 0) : 
                                          (deltaX > 0 ? Math.min(deltaX, threshold) : 0);
          
          messageElement.style.transform = `translateX(${maxSwipe}px)`;
          
          if (Math.abs(maxSwipe) >= threshold * 0.8) {
            messageElement.classList.add('swipe-ready');
          } else {
            messageElement.classList.remove('swipe-ready');
          }
        }
      };

      mouseEventHandlers.mouseup = (e) => {
        if (!isDragging || currentElement !== messageElement) return;
        
        const deltaX = currentX - startX;
        const isOwnMessage = messageData.name === this.currentUser;
        const validSwipe = hasMoved && (isOwnMessage ? deltaX < -threshold : deltaX > threshold);
        
        messageElement.style.transition = 'transform 0.3s ease';
        
        if (validSwipe) {
          this.startReply(messageData);
        }
        
        messageElement.style.transform = '';
        messageElement.classList.remove('swipe-ready');
        isDragging = false;
        hasMoved = false;
        currentElement = null;
        
        // Clean up event listeners
        document.removeEventListener('mousemove', mouseEventHandlers.mousemove);
        document.removeEventListener('mouseup', mouseEventHandlers.mouseup);
      };

      // Add temporary event listeners
      document.addEventListener('mousemove', mouseEventHandlers.mousemove);
      document.addEventListener('mouseup', mouseEventHandlers.mouseup);
    });
  }

  startReply(messageData) {
    this.replyingTo = messageData;
    this.showReplyBar(messageData);
    this.messageInput.focus();
  }

  showReplyBar(messageData) {
    // Remove existing reply bar if any
    const existingReplyBar = document.querySelector('.reply-bar');
    if (existingReplyBar) {
      existingReplyBar.remove();
    }

    const replyBar = document.createElement('div');
    replyBar.className = 'reply-bar';
    replyBar.innerHTML = `
      <div class="reply-info">
        <div class="reply-label">Replying to ${this.escapeHtml(messageData.name)}</div>
        <div class="reply-message">${this.escapeHtml(messageData.message.substring(0, 50))}${messageData.message.length > 50 ? '...' : ''}</div>
      </div>
      <button class="reply-close" onclick="window.chatManager.cancelReply()">&times;</button>
    `;

    const inputContainer = document.querySelector('.chat-input-container');
    inputContainer.insertBefore(replyBar, inputContainer.firstChild);
  }

  cancelReply() {
    this.replyingTo = null;
    const replyBar = document.querySelector('.reply-bar');
    if (replyBar) {
      replyBar.remove();
    }
  }
}

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.chatManager === 'undefined') {
    window.chatManager = new ChatManager();
  }
});
