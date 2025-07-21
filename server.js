require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
