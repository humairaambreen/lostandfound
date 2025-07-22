// post.js
// Handles post details and comments for the single post page

// Get post ID from URL (e.g., ?id=POST_ID)
function getPostId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

const postId = getPostId();
const postDetails = document.getElementById('post-details');
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('commentForm');
const commentName = document.getElementById('commentName');
const commentText = document.getElementById('commentText');

async function loadPost() {
  if (!postId) {
    postDetails.innerHTML = '<div style="color:#f55;">Invalid post.</div>';
    return;
  }
  // Fetch post details
  try {
    const res = await fetch(`/api/items`);
    const items = await res.json();
    const item = items.find(i => i._id === postId);
    if (!item) {
      postDetails.innerHTML = '<div style="color:#f55;">Post not found.</div>';
      return;
    }
    const dateString = item.timestamp ? new Date(item.timestamp).toLocaleString() : '';
    postDetails.innerHTML = `
      <div class="post-image-wrapper">
        ${item.photo ? `<img class="post-image" src="${item.photo}" alt="item photo" />` : ''}
      </div>
      <div class="meta"><b>${item.name}</b> (${item.number})</div>
      <div class="post-description">${item.description}</div>
      <div class="timestamp">${dateString ? `Uploaded: ${dateString}` : ''}</div>
      <div class="post-meta-bar">
        <div class="like-btn-meta">
          <span class="heart-svg" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-6.5-5.2-8.5-8C1.5 9.5 3.5 5.5 7.5 5.5c1.7 0 3.2 1 4.1 2.3C12.8 6.5 14.3 5.5 16 5.5c4 0 6 4 4 7.5-2 2.8-8 8-8 8z" fill="#bbb"/></svg>
          </span>
          <span class="like-count-meta">${item.likes || 0}</span>
          <span class="like-label">likes</span>
        </div>
      </div>
    `;
  } catch {
    postDetails.innerHTML = '<div style="color:#f55;">Error loading post.</div>';
  }
}

async function loadComments() {
  commentsList.innerHTML = '<div style="color:#bbb;">Loading comments...</div>';
  try {
    const res = await fetch(`/api/items/${postId}/comments`);
    const comments = await res.json();
    const commentsCount = Array.isArray(comments) ? comments.length : 0;
    const commentsCountSpan = document.getElementById('comments-count');
    if (commentsCountSpan) {
      commentsCountSpan.textContent = commentsCount + ' comment' + (commentsCount !== 1 ? 's' : '');
    }
    if (commentsCount > 0) {
      commentsList.innerHTML = comments.map(c => {
        const date = c.timestamp ? new Date(c.timestamp).toLocaleString() : '';
        return `<div class="comment"><b>${c.name}</b>: ${c.text} <span class="comment-date">${date}</span></div>`;
      }).join('');
    } else {
      commentsList.innerHTML = '<div class="comment comment-empty">No comments yet.</div>';
    }
  } catch {
    commentsList.innerHTML = '<div style="color:#f55;">Error loading comments.</div>';
    const commentsCountSpan = document.getElementById('comments-count');
    if (commentsCountSpan) commentsCountSpan.textContent = '';
  }
}

commentForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = commentName.value.trim();
  const text = commentText.value.trim();
  if (!name || !text) return;
  commentForm.querySelector('button[type="submit"]').disabled = true;
  try {
    const res = await fetch(`/api/items/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, text })
    });
    if (!res.ok) throw new Error('Failed to post comment');
    commentForm.reset();
    await loadComments();
  } catch {
    alert('Error posting comment.');
  } finally {
    commentForm.querySelector('button[type="submit"]').disabled = false;
  }
});

window.onload = async () => {
  await loadPost();
  await loadComments();
};
