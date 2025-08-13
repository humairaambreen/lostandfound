// Chat functionality
class ChatManager {
  constructor() {
    this.currentUser = null;
    this.messagesContainer = document.getElementById('chatMessages');
    this.messageInput = document.getElementById('chatMessageInput');
    this.sendButton = document.getElementById('sendMessageBtn');
    this.nameInput = document.getElementById('chatName');
    this.joinButton = document.getElementById('joinChatBtn');
    this.leaveButton = document.getElementById('leaveChatBtn');
    this.namePrompt = document.getElementById('namePrompt');
    this.chatInterface = document.getElementById('chatInterface');
    this.messages = []; // Store messages locally to track changes
    
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
    this.leaveButton.addEventListener('click', () => this.handleLeaveChat());
    this.sendButton.addEventListener('click', () => this.handleSendMessage());
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
    if (confirm('Are you sure you want to leave the chat?')) {
      this.leaveChat();
    }
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
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: this.currentUser,
          message: message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      this.messageInput.value = '';
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

    const messagesHTML = sortedMessages.map(msg => {
      const isOwn = msg.name === this.currentUser;
      const timestamp = new Date(msg.timestamp);
      const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="chat-message ${isOwn ? 'own' : 'other'}">
          <div class="message-header">
            <span class="message-sender">${this.escapeHtml(msg.name)}</span>
            <span class="message-time">${timeString}</span>
          </div>
          <div class="message-content">
            ${this.escapeHtml(msg.message)}
          </div>
        </div>
      `;
    }).join('');

    this.messagesContainer.innerHTML = messagesHTML;
  }

  appendNewMessages(newMessages) {
    if (newMessages.length === 0) return;
    
    // If container only has empty message, clear it first
    if (this.messagesContainer.querySelector('.chat-empty')) {
      this.messagesContainer.innerHTML = '';
    }
    
    // Sort new messages by timestamp to ensure proper order (oldest first)
    const sortedMessages = [...newMessages].sort((a, b) => a.timestamp - b.timestamp);
    
    const messagesHTML = sortedMessages.map(msg => {
      const isOwn = msg.name === this.currentUser;
      const timestamp = new Date(msg.timestamp);
      const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="chat-message ${isOwn ? 'own' : 'other'}">
          <div class="message-header">
            <span class="message-sender">${this.escapeHtml(msg.name)}</span>
            <span class="message-time">${timeString}</span>
          </div>
          <div class="message-content">
            ${this.escapeHtml(msg.message)}
          </div>
        </div>
      `;
    }).join('');
    
    this.messagesContainer.insertAdjacentHTML('beforeend', messagesHTML);
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
}

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.chatManager === 'undefined') {
    window.chatManager = new ChatManager();
  }
});
