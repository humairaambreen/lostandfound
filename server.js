require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// PWA specific routes
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;

// Firebase Admin SDK setup
const admin = require('firebase-admin');
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
const db = admin.database();

// API endpoint to submit a new item
app.post('/api/items', async (req, res) => {
  try {
    const { name, number, description, photo } = req.body;
    if (!name || !number || !description || !photo) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const newItem = { name, number, description, photo, timestamp: Date.now() };
    const ref = await db.ref('items').push(newItem);
    res.json({ success: true, id: ref.key });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// API endpoint to get items feed
app.get('/api/items', async (req, res) => {
  try {
    const snapshot = await db.ref('items').orderByChild('timestamp').limitToLast(50).once('value');
    const items = [];
    snapshot.forEach(child => {
      const val = child.val();
      val._id = child.key;
      items.push(val);
    });
    items.reverse();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Like endpoint for items
app.post('/api/items/:id/like', async (req, res) => {
  try {
    const postId = req.params.id;
    const likeRef = db.ref('items/' + postId + '/likes');
    await likeRef.transaction(current => (current || 0) + 1);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating like:', err);
    res.status(500).json({ error: 'Failed to update like' });
  }
});

// Unlike endpoint for items
app.post('/api/items/:id/unlike', async (req, res) => {
  try {
    const postId = req.params.id;
    const likeRef = db.ref('items/' + postId + '/likes');
    await likeRef.transaction(current => Math.max((current || 1) - 1, 0));
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating unlike:', err);
    res.status(500).json({ error: 'Failed to update unlike' });
  }
});

// Add a comment to an item
app.post('/api/items/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const { name, text } = req.body;
    if (!name || !text) {
      return res.status(400).json({ error: 'Missing name or text' });
    }
    const comment = { name, text, timestamp: Date.now() };
    const ref = await db.ref('items/' + postId + '/comments').push(comment);
    res.json({ success: true, id: ref.key });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get comments for an item
// Get recent comments for an item (last 3)
app.get('/api/items/:id/recent-comments', async (req, res) => {
  try {
    const postId = req.params.id;
    // Check if item exists
    const itemSnapshot = await db.ref('items/' + postId).once('value');
    if (!itemSnapshot.exists()) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const snapshot = await db.ref('items/' + postId + '/comments').orderByChild('timestamp').limitToLast(3).once('value');
    const comments = [];
    snapshot.forEach(child => {
      const val = child.val();
      val._id = child.key;
      comments.push(val);
    });
    comments.reverse();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent comments' });
  }
});
app.get('/api/items/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    // Check if item exists
    const itemSnapshot = await db.ref('items/' + postId).once('value');
    if (!itemSnapshot.exists()) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const snapshot = await db.ref('items/' + postId + '/comments').orderByChild('timestamp').limitToLast(50).once('value');
    const comments = [];
    snapshot.forEach(child => {
      const val = child.val();
      val._id = child.key;
      comments.push(val);
    });
    comments.reverse();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
