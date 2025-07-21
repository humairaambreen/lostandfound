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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (submitBtn.disabled) return;
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
      form.reset();
      loadFeed();
    } catch (err) {
      alert('Error uploading item.');
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
  feed.innerHTML = Array(4).fill().map(() => `
    <div class="skeleton-item">
      <div class="skeleton skeleton-meta"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-timestamp"></div>
      <div class="skeleton skeleton-text" style="width:40%;"></div>
    </div>
  `).join('');
};

async function loadFeed(showSkeleton = true) {
  if (showSkeleton) showFeedSkeletons();
  // Wait for 3 seconds before loading actual feed
  await new Promise(resolve => setTimeout(resolve, showSkeleton ? 3000 : 0));
  try {
    const res = await fetch('/api/items');
    const items = await res.json();
    feed.innerHTML = items.map(item => {
      const date = item.timestamp ? new Date(item.timestamp) : null;
      const dateString = date ? date.toLocaleString() : '';
      const likeCount = item.likes || 0;
      // Comment section placeholder
      return `
                <div class="item" data-id="${item._id}" style="cursor:pointer;-webkit-tap-highlight-color:transparent;">
          <div class="meta"><b>${item.name}</b> (${item.number})</div>
          <div>${item.description}</div>
          ${item.photo ? `<img src="${item.photo}" alt="item photo" />` : ''}
          <div class="timestamp">${dateString ? `Uploaded: ${dateString}` : ''}</div>
          <button class="like-btn" aria-label="Like post" type="button">
            <span class="heart-svg" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path class="heart-shape" d="M12 21s-6.5-5.2-8.5-8C1.5 9.5 3.5 5.5 7.5 5.5c1.7 0 3.2 1 4.1 2.3C12.8 6.5 14.3 5.5 16 5.5c4 0 6 4 4 7.5-2 2.8-8 8-8 8z"/>
              </svg>
            </span>
            <span class="like-count">${likeCount}</span>
          </button>
          <div class="comments-section" style="margin-top:6px;">
            <div class="comments-count" id="comments-count-${item._id}" style="color:#888;font-size:0.92em;text-align:right;"></div>
          </div>
        </div>
      `;
    }).join('');
    // Add click handler to each item to open post.html?id=POST_ID
    document.querySelectorAll('.item').forEach(itemDiv => {
      const postId = itemDiv.getAttribute('data-id');
      itemDiv.addEventListener('click', function(e) {
        // Prevent click on like button or comment form from triggering navigation
        if (e.target.closest('.like-btn') || e.target.closest('.comment-form')) return;
        window.location.href = `post.html?id=${postId}`;
      });
    });

    // Add event listeners for like buttons
    document.querySelectorAll('.like-btn').forEach((btn, idx) => {
      const postId = items[idx]._id;
      const likeCountSpan = btn.querySelector('.like-count');
      const getLiked = () => localStorage.getItem('liked_' + postId) === '1';
      const setLiked = (val) => {
        if (val) localStorage.setItem('liked_' + postId, '1');
        else localStorage.removeItem('liked_' + postId);
      };
      // Initial state
      if (getLiked()) btn.classList.add('liked');
      else btn.classList.remove('liked');
      btn.onclick = async () => {
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
          } else {
            btn.classList.add('liked');
            likeCountSpan.textContent = count;
            setLiked(true);
          }
          alert('Error updating like.');
        }
      };
    });

    // Load comment count for each item
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
    feed.innerHTML = '<div>Error loading feed.</div>';
  }
} // End of loadFeed

window.onload = loadFeed;
