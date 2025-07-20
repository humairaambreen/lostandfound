# Lost and Found

A web application for posting and browsing lost and found items, built with Node.js, Express, Firebase Realtime Database, and a modern HTML/CSS/JS frontend.

---

## Features
- **Post lost/found items** with name, contact number, description, and photo
- **Browse feed** of recent items
- **Like** items (client-side only, not persisted)
- **Mobile-friendly** UI
- **Secure backend**: All Firebase credentials and logic are private, handled by the server

---

## Project Structure

```
lostandfound/
├── public/
│   ├── app.js           # Frontend JS (no Firebase keys here!)
│   ├── index.html       # Main HTML UI
│   └── style.css        # Styles
├── server.js            # Node.js backend (Express + Firebase Admin)
├── .env                 # Your private environment variables (not committed)
├── .env.example         # Example env file for setup
├── .gitignore           # Ignores node_modules, .env, serviceAccountKey.json, etc.
├── package.json         # NPM dependencies and scripts
└── serviceAccountKey.json # Firebase Admin private key (not committed)
```

---

## How it Works

### Backend (Node.js + Express + Firebase Admin)
- All sensitive Firebase logic and credentials are handled in `server.js`.
- Uses `firebase-admin` with a service account key for secure access.
- Exposes REST API endpoints:
  - `POST /api/items` — Add a new item (expects JSON: name, number, description, photo as base64)
  - `GET /api/items` — Get the latest 50 items (JSON array)
- No Firebase config is ever exposed to the frontend.

### Frontend (public/app.js)
- Handles form submission and feed rendering.
- Submits new items via `fetch('/api/items', { method: 'POST', ... })`.
- Loads feed via `fetch('/api/items')`.
- All Firebase logic is removed from the frontend for security.

---

## Setup Instructions

1. **Clone the repo**
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Create your Firebase project** (if you don't have one)
4. **Generate a service account key**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in your project root
5. **Create your `.env` file** (copy from `.env.example` and fill in your values)
   ```sh
   cp .env.example .env
   # Edit .env as needed
   ```
6. **Start the server**
   ```sh
   npm start
   ```
7. **Open** [http://localhost:3000](http://localhost:3000) in your browser

---

## Environment Variables (`.env`)
- `FIREBASE_DATABASE_URL` — Your Firebase Realtime Database URL
- `FIREBASE_SERVICE_ACCOUNT_PATH` — Path to your service account key (default: `./serviceAccountKey.json`)
- (Other Firebase keys are not used on the backend, but included for reference)

---

## Security Notes
- **Never commit** `.env` or `serviceAccountKey.json` to public repos!
- All Firebase credentials are kept server-side and never exposed to the client.

---

## Customization
- You can style the UI by editing `public/style.css`.
- To add more fields or features, update both the backend API and frontend JS as needed.

