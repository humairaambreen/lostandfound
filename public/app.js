



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



function getLikeKey(postId) {
  return `like_${postId}`;
}

function isLiked(postId) {
  return localStorage.getItem(getLikeKey(postId)) === '1';
}

function setLiked(postId, liked) {
  if (liked) localStorage.setItem(getLikeKey(postId), '1');
  else localStorage.removeItem(getLikeKey(postId));
}

function updateLike(postId, liked) {
  const likeRef = db.ref('items/' + postId + '/likes');
  likeRef.transaction(current => {
    if (liked) return (current || 0) + 1;
    else return Math.max((current || 1) - 1, 0);
  });
}

async function loadFeed() {
  try {
    const res = await fetch('/api/items');
    const items = await res.json();
    feed.innerHTML = items.map(item => {
      const date = item.timestamp ? new Date(item.timestamp) : null;
      const dateString = date ? date.toLocaleString() : '';
      return `
        <div class="item" data-id="${item._id}">
          <div class="meta"><b>${item.name}</b> (${item.number})</div>
          <div>${item.description}</div>
          ${item.photo ? `<img src="${item.photo}" alt="item photo" />` : ''}
          <div class="timestamp">${dateString ? `Uploaded: ${dateString}` : ''}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    feed.innerHTML = '<div>Error loading feed.</div>';
  }
}

window.onload = loadFeed;
