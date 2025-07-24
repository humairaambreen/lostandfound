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
  // Show skeleton while loading
  postDetails.innerHTML = `
    <div class="skeleton-item">
      <div class="skeleton skeleton-meta" style="height:1.2em;width:60%;margin-bottom:0.7em;"></div>
      <div class="skeleton skeleton-img" style="width:100%;max-width:340px;aspect-ratio:1/1;margin:0.75rem auto;"></div>
      <div class="skeleton skeleton-text" style="height:1.1em;width:80%;margin-bottom:0.3em;"></div>
      <div class="skeleton skeleton-timestamp" style="height:0.8em;width:40%;margin-bottom:0.2em;"></div>
    </div>
  `;
  // Show skeleton UI
  postDetails.innerHTML = `
    <div class="skeleton skeleton-img" style="width:100%;max-width:340px;aspect-ratio:1/1;margin:0.75rem auto;border-radius:1em;"></div>
    <div class="skeleton skeleton-meta" style="height:1.2em;width:60%;margin-bottom:0.7em;border-radius:0.5em;"></div>
    <div class="skeleton skeleton-text" style="height:1.1em;width:90%;margin-bottom:0.5em;border-radius:0.5em;"></div>
    <div class="skeleton skeleton-timestamp" style="height:0.9em;width:40%;margin-bottom:0.2em;border-radius:0.5em;"></div>
  `;
  // Wait for 3 seconds before loading actual post
  await new Promise(resolve => setTimeout(resolve, 3000));
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
      <div class="meta"><b>${item.name}</b><br><a href="tel:${item.number}" style="font-weight:400;color:#888;text-decoration:none;">${item.number}</a></div>
      <div class="post-description">${item.description}</div>
      <div class="timestamp">${dateString ? `Uploaded: ${dateString}` : ''}</div>
    `;
  } catch {
    postDetails.innerHTML = '<div style="color:#f55;">Error loading post.</div>';
  }
}

async function loadComments() {
  // Show skeleton for comment input and comments list
  commentForm.style.display = 'none';
  const commentsSection = commentsList.parentElement;
  // Insert skeletons for input and comments
  let skeletonInput = document.createElement('div');
  skeletonInput.innerHTML = `
    <div class="skeleton" style="height:2.7em;width:100%;max-width:460px;margin:0.2em auto 0.5em auto;border-radius:0.3em;"></div>
    <div class="skeleton" style="height:4.5em;width:100%;max-width:460px;margin:0.2em auto 0.5em auto;border-radius:0.3em;"></div>
    <div class="skeleton" style="height:2.7em;width:100%;max-width:460px;margin:0.2em auto 0.5em auto;border-radius:0.3em;"></div>
  `;
  commentForm.parentElement.insertBefore(skeletonInput, commentForm);
  commentsList.innerHTML = `
    <div class="skeleton" style="height:1.5em;width:80%;margin:0.4em auto;border-radius:0.3em;"></div>
    <div class="skeleton" style="height:1.5em;width:90%;margin:0.4em auto;border-radius:0.3em;"></div>
    <div class="skeleton" style="height:1.5em;width:70%;margin:0.4em auto;border-radius:0.3em;"></div>
  `;
  // Wait for 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));
  // Remove skeletons and show real form/comments
  if (skeletonInput && skeletonInput.parentElement) skeletonInput.parentElement.removeChild(skeletonInput);
  commentForm.style.display = '';
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
  if (!name || !text) {
    if (!name) commentName.focus();
    else commentText.focus();
    return;
  }
  commentForm.querySelector('button[type="submit"]').disabled = true;
  try {
    const res = await fetch(`/api/items/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, text })
    });
    if (!res.ok) throw new Error('Failed to post comment');
    commentForm.reset();
    commentName.blur();
    commentText.blur();
    await loadComments();
  } catch {
    alert('Error posting comment.');
  } finally {
    commentForm.querySelector('button[type="submit"]').disabled = false;
  }
});

window.onload = async () => {
  // Show both skeletons immediately
  const postPromise = (async () => {
    if (!postId) {
      postDetails.innerHTML = '<div style="color:#f55;">Invalid post.</div>';
      return null;
    }
    // Show skeleton UI
    postDetails.innerHTML = `
      <div class="skeleton skeleton-img" style="width:100%;max-width:340px;aspect-ratio:1/1;margin:0.75rem auto;border-radius:1em;"></div>
      <div class="skeleton skeleton-meta" style="height:1.2em;width:60%;margin-bottom:0.7em;border-radius:0.5em;"></div>
      <div class="skeleton skeleton-text" style="height:1.1em;width:90%;margin-bottom:0.5em;border-radius:0.5em;"></div>
      <div class="skeleton skeleton-timestamp" style="height:0.9em;width:40%;margin-bottom:0.2em;border-radius:0.5em;"></div>
    `;
    try {
      const res = await fetch(`/api/items`);
      const items = await res.json();
      const item = items.find(i => i._id === postId);
      return item;
    } catch {
      return 'error';
    }
  })();

  // Show skeleton for comment input and comments list
  commentForm.style.display = 'none';
  let skeletonInput = document.createElement('div');
  skeletonInput.innerHTML = `
    <div style="background:#fff;border-radius:1em;box-shadow:0 2px 12px #eaeaea33;padding:1.2em 1em 1em 1em;max-width:460px;margin:0.5em auto 1.2em auto;">
      <div class="skeleton" style="height:2.2em;width:70%;margin:0.2em 0 1em 0;border-radius:0.4em;"></div>
      <div class="skeleton" style="height:3.7em;width:100%;margin:0.2em 0 1em 0;border-radius:0.7em;"></div>
      <div class="skeleton" style="height:2.2em;width:100%;margin:0.2em 0 0 0;border-radius:0.7em;"></div>
    </div>
  `;
  commentForm.parentElement.insertBefore(skeletonInput, commentForm);
  // Generate 5 rectangles with random widths between 30% and 92%
  const skeletonWidths = [
    Math.floor(Math.random() * 30) + 30, // 30-59
    Math.floor(Math.random() * 20) + 60, // 60-79
    Math.floor(Math.random() * 20) + 40, // 40-59
    Math.floor(Math.random() * 30) + 62, // 62-91
    Math.floor(Math.random() * 20) + 50  // 50-69
  ];
  // Add skeleton for comments count (number) next to the text
  const commentsCountSpan = document.getElementById('comments-count');
  if (commentsCountSpan) {
    commentsCountSpan.innerHTML = `<span class=\"skeleton\" style=\"display:inline-block;height:0.9em;width:2.5em;vertical-align:middle;border-radius:0.5em;\"></span>`;
  }
  commentsList.innerHTML = skeletonWidths.map(w =>
    `<div class="skeleton" style="height:1.1em;width:${w}%;margin:0.7em 0 1.1em 1.2em;border-radius:0.8em;"></div>`
  ).join('');

  // Wait for 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Load post details and comments in parallel
  const [item, commentsRes] = await Promise.all([
    postPromise,
    (async () => {
      try {
        const res = await fetch(`/api/items/${postId}/comments`);
        const comments = await res.json();
        return comments;
      } catch {
        return 'error';
      }
    })()
  ]);

  // Remove skeletons
  if (skeletonInput && skeletonInput.parentElement) skeletonInput.parentElement.removeChild(skeletonInput);
  commentForm.style.display = '';

  // Render post details
  if (!item) {
    postDetails.innerHTML = '<div style="color:#f55;">Post not found.</div>';
  } else if (item === 'error') {
    postDetails.innerHTML = '<div style="color:#f55;">Error loading post.</div>';
  } else {
    const dateString = item.timestamp ? new Date(item.timestamp).toLocaleString() : '';
    postDetails.innerHTML = `
      <div class="post-image-wrapper">
        ${item.photo ? `<img class="post-image" src="${item.photo}" alt="item photo" />` : ''}
      </div>
      <div class="meta"><b>${item.name}</b><br><a href="tel:${item.number}" style="font-weight:400;color:#888;text-decoration:none;">${item.number}</a></div>
      <div class="post-description">${item.description}</div>
      <div class="timestamp">${dateString ? `Uploaded: ${dateString}` : ''}</div>
    `;
  }

  // Render comments
  if (commentsRes === 'error') {
    commentsList.innerHTML = '<div style="color:#f55;">Error loading comments.</div>';
    if (commentsCountSpan) commentsCountSpan.textContent = '';
  } else {
    const comments = commentsRes;
    const commentsCount = Array.isArray(comments) ? comments.length : 0;
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
  }
};
