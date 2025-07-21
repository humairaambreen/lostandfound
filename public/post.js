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
      <div class="meta"><b>${item.name}</b> (${item.number})</div>
      <div>${item.description}</div>
      ${item.photo ? `<img src="${item.photo}" alt="item photo" />` : ''}
      <div class="timestamp">${dateString ? `Uploaded: ${dateString}` : ''}</div>
      <div class="likes">Likes: ${item.likes || 0}</div>
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
    if (Array.isArray(comments) && comments.length > 0) {
      commentsList.innerHTML = comments.map(c => {
        const date = c.timestamp ? new Date(c.timestamp).toLocaleString() : '';
        return `<div class="comment"><b>${c.name}</b>: ${c.text} <span class="comment-date">${date}</span></div>`;
      }).join('');
    } else {
      commentsList.innerHTML = '<div style="color:#bbb;">No comments yet.</div>';
    }
  } catch {
    commentsList.innerHTML = '<div style="color:#f55;">Error loading comments.</div>';
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
