// Truncate descriptions and add 'Show more' button
document.addEventListener('DOMContentLoaded', function() {
  const MAX_CHARS = 175;
  document.querySelectorAll('.item-description').forEach(function(desc) {
    const fullText = desc.textContent.trim();
    if (fullText.length > MAX_CHARS) {
      const shortText = fullText.slice(0, MAX_CHARS) + '...';
      desc.textContent = shortText;
      const btn = document.createElement('button');
      btn.className = 'show-more-btn';
      btn.textContent = 'Show more';
      btn.onclick = function() {
        if (desc.textContent === shortText) {
          desc.textContent = fullText;
          btn.textContent = 'Show less';
        } else {
          desc.textContent = shortText;
          btn.textContent = 'Show more';
        }
        desc.appendChild(btn);
      };
      desc.appendChild(btn);
    }
  });
});
// Image preview for upload
const photoInput = document.getElementById('photo');
const photoPreview = document.getElementById('photoPreview');
const previewWrapper = document.querySelector('.preview-wrapper');
const closePreviewBtn = document.getElementById('closePreview');
if (photoInput && photoPreview && previewWrapper && closePreviewBtn) {
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        photoPreview.src = event.target.result;
        previewWrapper.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    } else {
      photoPreview.src = '';
      previewWrapper.style.display = 'none';
    }
  });
  closePreviewBtn.addEventListener('click', () => {
    photoInput.value = '';
    photoPreview.src = '';
    previewWrapper.style.display = 'none';
  });
}
const form = document.getElementById('itemForm');
const feed = document.getElementById('feed');
const submitBtn = form.querySelector('button[type="submit"]');

// PWA: Check if user is offline
function isOnline() {
  return navigator.onLine;
}

// PWA: Show offline notification
function showOfflineMessage() {
  const existing = document.getElementById('offline-indicator');
  if (!existing && !isOnline()) {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'offline-indicator';
    indicator.textContent = '📵 You are offline - Some features may be limited';
    document.body.appendChild(indicator);
  }
}

// PWA: Hide offline notification
function hideOfflineMessage() {
  const indicator = document.getElementById('offline-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// PWA: Monitor network status
window.addEventListener('online', hideOfflineMessage);
window.addEventListener('offline', showOfflineMessage);

// PWA: Check initial network status
if (!isOnline()) {
  showOfflineMessage();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (submitBtn.disabled) return;
  
  // PWA: Check if online before submitting
  if (!isOnline()) {
    alert('You are currently offline. Please check your internet connection and try again.');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading...';
  const name = document.getElementById('name').value;
  const number = document.getElementById('number').value;
  const description = document.getElementById('description').value;
  const photoInput = document.getElementById('photo');
  const file = photoInput.files[0];
  if (!file) {
    alert('Please select a photo.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Item';
    return;
  }
  const reader = new FileReader();
  reader.onload = async function(event) {
    const base64Photo = event.target.result;
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, number, description, photo: base64Photo })
      });
      if (!res.ok) throw new Error('Failed to upload');
      
      // Save user info to localStorage for recent uploads
      localStorage.setItem('uploaderName', name);
      localStorage.setItem('uploaderNumber', number);
      
      form.reset();
      loadFeed();
      
      // Load recent uploads after successful submission
      loadRecentUploads();
      
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading item. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Item';
    }
  };
  reader.readAsDataURL(file);
});

// Show skeletons in feed while loading
window.showFeedSkeletons = function() {
  const feed = document.getElementById('feed');
  const isDesktop = window.innerWidth >= 900;
  
  if (isDesktop) {
    // Desktop masonry skeleton with varied heights
    feed.innerHTML = Array(9).fill().map((_, index) => {
      const heights = ['short', 'medium', 'tall'];
      const height = heights[index % 3];
      return `
        <div class="skeleton-item desktop-skeleton ${height}">
          <div class="skeleton skeleton-meta-desktop"></div>
          <div class="skeleton skeleton-text-desktop"></div>
          <div class="skeleton skeleton-img-desktop"></div>
          <div class="skeleton skeleton-timestamp-desktop"></div>
          <div class="skeleton-meta-bar-desktop">
            <div class="skeleton skeleton-like-desktop"></div>
            <div class="skeleton skeleton-comments-desktop"></div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    // Mobile skeleton (keep existing)
    feed.innerHTML = Array(4).fill().map(() => `
      <div class="skeleton-item">
        <div class="skeleton skeleton-meta"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-timestamp"></div>
        <div class="skeleton skeleton-text" style="width:40%;"></div>
      </div>
    `).join('');
  }
};

async function loadFeed(showSkeleton = true) {
  // ...existing code...
  if (showSkeleton) showFeedSkeletons();
  // Wait for 3 seconds before loading actual feed
  await new Promise(resolve => setTimeout(resolve, showSkeleton ? 3000 : 0));
  try {
    const res = await fetch('/api/items');
    
    // PWA: Handle offline response
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const items = await res.json();
    
    // PWA: Handle offline data structure
    if (items.offline) {
      feed.innerHTML = `
        <div class="offline-message" style="text-align: center; padding: 2em; color: #666;">
          <h3>📵 You are currently offline</h3>
          <p>Please check your internet connection to view the latest items.</p>
        </div>
      `;
      return;
    }
    
    feed.innerHTML = items.map(item => {
      const date = item.timestamp ? new Date(item.timestamp) : null;
      const dateString = date ? date.toLocaleString() : '';
      const likeCount = item.likes || 0;
      const liked = localStorage.getItem('liked_' + item._id) === '1';
      // Use two different SVGs for liked/unliked, with correct color
      const heartSVG = liked
        ? `<svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-6.5-5.2-8.5-8C1.5 9.5 3.5 5.5 7.5 5.5c1.7 0 3.2 1 4.1 2.3C12.8 6.5 14.3 5.5 16 5.5c4 0 6 4 4 7.5-2 2.8-8 8-8 8z" fill="#FF8DAA"/></svg>`
        : `<svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-6.5-5.2-8.5-8C1.5 9.5 3.5 5.5 7.5 5.5c1.7 0 3.2 1 4.1 2.3C12.8 6.5 14.3 5.5 16 5.5c4 0 6 4 4 7.5-2 2.8-8 8-8 8z" fill="#bbb"/></svg>`;
      return `
        <div class="item${liked ? ' liked' : ''}" data-id="${item._id}" style="cursor:pointer;-webkit-tap-highlight-color:transparent;">
          <div class="meta"><b>${item.name}</b><br><a href="tel:${item.number}" style="font-weight:400;color:#888;text-decoration:none;">${item.number}</a></div>
          <div>${item.description}</div>
          ${item.photo ? `<img src="${item.photo}" alt="item photo" />` : ''}
          <div class="timestamp">${dateString ? `Uploaded: ${dateString}` : ''}</div>
          <div class="post-meta-bar" style="display:flex;align-items:center;justify-content:space-between;background:#f7f7f7;border-radius:0.7em;margin-top:10px;padding:7px 14px 7px 14px;">
            <button class="like-btn-meta${liked ? ' liked' : ''}" aria-label="Like post" type="button" style="background:none;border:none;display:flex;align-items:center;gap:6px;cursor:pointer;">
              <span class="heart-svg" aria-hidden="true" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;vertical-align:middle;">
                ${heartSVG}
              </span>
              <span class="like-count-meta" id="like-count-meta-${item._id}" style="color:#888;font-size:1.1em;font-family:'Poppins',sans-serif;margin-left:0.12em;display:flex;align-items:flex-end;margin-top:2px;">${likeCount}</span>
              <span style="color:#888;font-size:1.1em;font-family:'Poppins',sans-serif;margin-left:0.05em;display:flex;align-items:flex-end;margin-top:2px;">likes</span>
            </button>
            <div class="comments-count-meta" id="comments-count-${item._id}" style="color:#888;font-size:0.92em;">Loading...</div>
          </div>
        </div>
      `;
    }).join('');
    // No need to manually update SVG fill; CSS will handle color via .liked class

    // Add event listeners for meta bar like buttons (after feed.innerHTML is set)
    document.querySelectorAll('.like-btn-meta').forEach((btn) => {
      const postId = btn.closest('.item').getAttribute('data-id');
      const likeCountSpan = btn.querySelector('.like-count-meta');
      const getLiked = () => localStorage.getItem('liked_' + postId) === '1';
      const setLiked = (val) => {
        if (val) localStorage.setItem('liked_' + postId, '1');
        else localStorage.removeItem('liked_' + postId);
      };
      btn.onclick = async (e) => {
        e.stopPropagation();
        let liked = getLiked();
        let count = parseInt(likeCountSpan.textContent, 10) || 0;
        // Optimistically update UI
        if (!liked) {
          btn.classList.add('liked');
          likeCountSpan.textContent = count + 1;
          setLiked(true);
        } else {
          btn.classList.remove('liked');
          likeCountSpan.textContent = Math.max(0, count - 1);
          setLiked(false);
        }
        // Replace heart SVG with correct color
        const heartSpan = btn.querySelector('.heart-svg');
        if (heartSpan) {
          heartSpan.innerHTML = getLiked()
            ? `<svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-6.5-5.2-8.5-8C1.5 9.5 3.5 5.5 7.5 5.5c1.7 0 3.2 1 4.1 2.3C12.8 6.5 14.3 5.5 16 5.5c4 0 6 4 4 7.5-2 2.8-8 8-8 8z" fill="#FF8DAA"/></svg>`
            : `<svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-6.5-5.2-8.5-8C1.5 9.5 3.5 5.5 7.5 5.5c1.7 0 3.2 1 4.1 2.3C12.8 6.5 14.3 5.5 16 5.5c4 0 6 4 4 7.5-2 2.8-8 8-8 8z" fill="#bbb"/></svg>`;
        }
        // Animate heart
        if (heartSpan) {
          heartSpan.classList.remove('pop');
          void heartSpan.offsetWidth;
          heartSpan.classList.add('pop');
        }
        // Sync with backend
        try {
          if (!liked) {
            await fetch(`/api/items/${postId}/like`, {
              method: 'POST',
              headers: { 'x-liked': '0' }
            });
          } else {
            await fetch(`/api/items/${postId}/unlike`, {
              method: 'POST',
              headers: { 'x-liked': '1' }
            });
          }
        } catch (err) {
          // Revert UI if failed
          if (!liked) {
            btn.classList.remove('liked');
            likeCountSpan.textContent = Math.max(0, count);
            setLiked(false);
            if (heartSpan) heartSpan.innerHTML = `<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 21s-6.5-5.2-8.5-8C1.5 9.5 3.5 5.5 7.5 5.5c1.7 0 3.2 1 4.1 2.3C12.8 6.5 14.3 5.5 16 5.5c4 0 6 4 4 7.5-2 2.8-8 8-8 8z\" fill=\"#bbb\"/></svg>`;
          } else {
            btn.classList.add('liked');
            likeCountSpan.textContent = count;
            setLiked(true);
            if (heartSpan) heartSpan.innerHTML = `<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M12 21s-6.5-5.2-8.5-8C1.5 9.5 3.5 5.5 7.5 5.5c1.7 0 3.2 1 4.1 2.3C12.8 6.5 14.3 5.5 16 5.5c4 0 6 4 4 7.5-2 2.8-8 8-8 8z\" fill=\"#FF8DAA\"/></svg>`;
          }
          alert('Error updating like.');
        }
      };
    });
    // Add click handler to each item to open post.html?id=POST_ID
    document.querySelectorAll('.item').forEach(itemDiv => {
      const postId = itemDiv.getAttribute('data-id');
      itemDiv.addEventListener('click', function(e) {
        // Prevent click on like button, meta like button, or comment form from triggering navigation
        if (e.target.closest('.like-btn') || e.target.closest('.like-btn-meta') || e.target.closest('.comment-form')) return;
        window.location.href = `post.html?id=${postId}`;
      });
    });

    // Add event listeners for like buttons (main like button)
    document.querySelectorAll('.like-btn').forEach((btn, idx) => {
      const postId = items[idx]._id;
      const likeCountSpan = btn.querySelector('.like-count');
      const getLiked = () => localStorage.getItem('liked_' + postId) === '1';
      const setLiked = (val) => {
        if (val) localStorage.setItem('liked_' + postId, '1');
        else localStorage.removeItem('liked_' + postId);
      };
      // Initial state
      const heartPath = btn.querySelector('.heart-shape');
      if (getLiked()) {
        btn.classList.add('liked');
        if (heartPath) heartPath.setAttribute('fill', '#ff69b4'); // pink
      } else {
        btn.classList.remove('liked');
        if (heartPath) heartPath.setAttribute('fill', '#bbb'); // default gray
      }
      btn.onclick = async () => {
        let liked = getLiked();
        let count = parseInt(likeCountSpan.textContent, 10) || 0;
        // Optimistically update UI
        if (!liked) {
          btn.classList.add('liked');
          likeCountSpan.textContent = count + 1;
          setLiked(true);
          if (heartPath) heartPath.setAttribute('fill', '#ff69b4'); // pink
        } else {
          btn.classList.remove('liked');
          likeCountSpan.textContent = Math.max(0, count - 1);
          setLiked(false);
          if (heartPath) heartPath.setAttribute('fill', '#bbb'); // default gray
        }
        // Animate heart
        const heart = btn.querySelector('.heart-svg');
        if (heart) {
          heart.classList.remove('pop');
          void heart.offsetWidth;
          heart.classList.add('pop');
        }
        // Sync with backend
        try {
          if (!liked) {
            await fetch(`/api/items/${postId}/like`, {
              method: 'POST',
              headers: { 'x-liked': '0' }
            });
          } else {
            await fetch(`/api/items/${postId}/unlike`, {
              method: 'POST',
              headers: { 'x-liked': '1' }
            });
          }
        } catch (err) {
          // Revert UI if failed
          if (!liked) {
            btn.classList.remove('liked');
            likeCountSpan.textContent = Math.max(0, count);
            setLiked(false);
            if (heartPath) heartPath.setAttribute('fill', '#bbb');
          } else {
            btn.classList.add('liked');
            likeCountSpan.textContent = count;
            setLiked(true);
            if (heartPath) heartPath.setAttribute('fill', '#ff69b4');
          }
          alert('Error updating like.');
        }
      };
    });

    // Load comment count for each item and set up real-time like listeners
    items.forEach(async item => {
      const commentsCountDiv = document.getElementById('comments-count-' + item._id);
      if (commentsCountDiv) {
        commentsCountDiv.textContent = 'Loading...';
        try {
          const res = await fetch(`/api/items/${item._id}/comments`);
          const comments = await res.json();
          if (Array.isArray(comments)) {
            commentsCountDiv.textContent = comments.length + ' comment' + (comments.length !== 1 ? 's' : '');
          } else {
            commentsCountDiv.textContent = '0 comments';
          }
        } catch {
          commentsCountDiv.textContent = 'Error';
        }
      }
      // Real-time like count update using Firebase (only if initialized)
      try {
        if (
          window.firebase &&
          window.firebase.apps &&
          window.firebase.apps.length > 0 &&
          window.firebase.database
        ) {
          const likeCountMeta = document.getElementById('like-count-meta-' + item._id);
          const likeBtnMeta = likeCountMeta ? likeCountMeta.closest('.like-btn-meta') : null;
          const heartPath = likeBtnMeta ? likeBtnMeta.querySelector('.heart-shape') : null;
          if (likeCountMeta) {
            const likeRef = window.firebase.database().ref('items/' + item._id + '/likes');
            likeRef.on('value', (snapshot) => {
              const val = snapshot.val() || 0;
              likeCountMeta.textContent = val;
              // Update heart color based on local liked state
              if (heartPath) {
                const liked = localStorage.getItem('liked_' + item._id) === '1';
                heartPath.setAttribute('fill', liked ? '#ff69b4' : '#bbb');
              }
            });
          }
        } else {
          // Fallback: just set static like count
          const likeCountMeta = document.getElementById('like-count-meta-' + item._id);
          if (likeCountMeta) {
            likeCountMeta.textContent = item.likes || 0;
          }
        }
      } catch (e) {
        // Suppress Firebase errors if not initialized
        const likeCountMeta = document.getElementById('like-count-meta-' + item._id);
        if (likeCountMeta) {
          likeCountMeta.textContent = item.likes || 0;
        }
      }
    });
    // Add click handler for 'View all comments' buttons
    document.querySelectorAll('.view-comments-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const postId = btn.getAttribute('data-id');
        window.location.href = `post.html?id=${postId}`;
      });
    });

    // Handle comment form submission
    document.querySelectorAll('.comment-form').forEach(form => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const postId = form.getAttribute('data-id');
        const name = form.elements['name'].value.trim();
        const text = form.elements['text'].value.trim();
        if (!name || !text) return;
        form.querySelector('button[type="submit"]').disabled = true;
        try {
          const res = await fetch(`/api/items/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, text })
          });
          if (!res.ok) throw new Error('Failed to post comment');
          form.reset();
          // Reload comments
          const commentsList = document.getElementById('comments-' + postId);
          if (commentsList) {
            commentsList.innerHTML = '<div style="color:#bbb;font-size:0.95em;">Loading comments...</div>';
            const res2 = await fetch(`/api/items/${postId}/comments`);
            const comments = await res2.json();
            if (Array.isArray(comments) && comments.length > 0) {
              commentsList.innerHTML = comments.map(c => {
                const date = c.timestamp ? new Date(c.timestamp).toLocaleString() : '';
                return `<div class="comment"><b>${c.name}</b>: ${c.text} <span class="comment-date">${date}</span></div>`;
              }).join('');
            } else {
              commentsList.innerHTML = '<div style="color:#bbb;font-size:0.95em;">No comments yet.</div>';
            }
          }
        } catch {
          alert('Error posting comment.');
        } finally {
          form.querySelector('button[type="submit"]').disabled = false;
        }
      });

    }); // End of comment form submission handler
  } catch (err) {
    console.error('Feed loading error:', err);
    // PWA: Better error handling for offline mode
    if (!isOnline()) {
      feed.innerHTML = `
        <div class="offline-message" style="text-align: center; padding: 2em; color: #666;">
          <h3>📵 You are currently offline</h3>
          <p>Please check your internet connection to view the latest items.</p>
          <button onclick="location.reload()" style="margin-top: 1em; padding: 0.5em 1em; background: var(--color-primary); color: white; border: none; border-radius: 0.5em; cursor: pointer;">
            Try Again
          </button>
        </div>
      `;
    } else {
      feed.innerHTML = `
        <div style="text-align: center; padding: 2em; color: #666;">
          <h3>Error loading feed</h3>
          <p>Please try again later.</p>
          <button onclick="loadFeed(false)" style="margin-top: 1em; padding: 0.5em 1em; background: var(--color-primary); color: white; border: none; border-radius: 0.5em; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
  }
} // End of loadFeed

window.onload = loadFeed;

// Truncate descriptions and add 'Show more' button after feed loads
function applyDescriptionTruncation() {
  const MAX_CHARS = 175;
  document.querySelectorAll('.item-description').forEach(function(desc) {
    const fullText = desc.textContent.trim();
    if (fullText.length > MAX_CHARS) {
      const shortText = fullText.slice(0, MAX_CHARS) + '...';
      desc.textContent = shortText;
      const btn = document.createElement('button');
      btn.className = 'show-more-btn';
      btn.textContent = 'Show more';
      btn.onclick = function(e) {
        e.stopPropagation();
        if (desc.textContent === shortText) {
          desc.textContent = fullText;
          btn.textContent = 'Show less';
        } else {
          desc.textContent = shortText;
          btn.textContent = 'Show more';
        }
        desc.appendChild(btn);
      };
      desc.appendChild(btn);
    }
  });
}

// Recent Uploads Functionality
async function loadRecentUploads() {
  const uploaderName = localStorage.getItem('uploaderName');
  const uploaderNumber = localStorage.getItem('uploaderNumber');
  const recentUploadsSection = document.getElementById('recentUploadsSection');
  const recentUploadsList = document.getElementById('recentUploadsList');
  
  if (!uploaderName || !uploaderNumber) {
    recentUploadsSection.style.display = 'none';
    return;
  }
  
  try {
    const res = await fetch(`/api/items/user/${encodeURIComponent(uploaderName)}/${encodeURIComponent(uploaderNumber)}`);
    if (!res.ok) throw new Error('Failed to fetch user items');
    
    const userItems = await res.json();
    
    if (userItems.length === 0) {
      recentUploadsSection.style.display = 'none';
      return;
    }
    
    recentUploadsSection.style.display = 'block';
    
    recentUploadsList.innerHTML = userItems.map(item => {
      const date = item.timestamp ? new Date(item.timestamp).toLocaleString() : '';
      const likeCount = item.likes || 0;
      
      return `
        <div class="recent-upload-item" data-id="${item.id}">
          <img src="${item.photo}" alt="Upload preview" class="recent-upload-image" />
          <div class="recent-upload-details">
            <div class="recent-upload-description">${item.description}</div>
            <div class="recent-upload-timestamp">Uploaded: ${date}</div>
            <div class="recent-upload-stats">
              <span>${likeCount} likes</span>
              <span>•</span>
              <span onclick="viewPost('${item.id}')">View post</span>
            </div>
          </div>
          <button class="delete-post-btn" onclick="deletePost('${item.id}')" title="Delete Post">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;
    }).join('');
    
    // No longer need click handlers for the whole item since we have specific buttons
    
  } catch (err) {
    console.error('Error loading recent uploads:', err);
    recentUploadsSection.style.display = 'none';
  }
}

// Delete a specific post
async function deletePost(itemId) {
  if (!confirm('Are you sure you want to delete this post?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      // Reload recent uploads to reflect the deletion
      loadRecentUploads();
      alert('Post deleted successfully!');
    } else {
      alert('Failed to delete post. Please try again.');
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('Failed to delete post. Please try again.');
  }
}

// View a specific post (switch to feeds tab)
function viewPost(itemId) {
  // Switch to feeds tab
  document.querySelectorAll('.tab-section').forEach(tab => tab.style.display = 'none');
  document.getElementById('feedTab').style.display = '';
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('feedsTabBtn').classList.add('active');
}

// Auto-fill name and number if previously used
function autoFillUserInfo() {
  const uploaderName = localStorage.getItem('uploaderName');
  const uploaderNumber = localStorage.getItem('uploaderNumber');
  
  if (uploaderName) {
    document.getElementById('name').value = uploaderName;
  }
  
  if (uploaderNumber) {
    document.getElementById('number').value = uploaderNumber;
  }
}

// Clear recent uploads history
function clearRecentUploads() {
  localStorage.removeItem('uploaderName');
  localStorage.removeItem('uploaderNumber');
  document.getElementById('recentUploadsSection').style.display = 'none';
}

// Initialize recent uploads functionality when page loads
window.addEventListener('DOMContentLoaded', function() {
  autoFillUserInfo();
  loadRecentUploads();
});
