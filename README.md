# 🚀 ConnectX Chat — Complete Full-Stack Messaging App

> WhatsApp + Telegram + Discord combined. Real-time chat with AI, voice/video calls, group chats, stories, and multi-language support.

![ConnectX](https://img.shields.io/badge/ConnectX-v1.0-7c3aed?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=for-the-badge)

---

## 📁 Project Structure

```
connectx/
├── server/                  # Node.js + Express Backend
│   ├── config/              # DB, Cloudinary config
│   ├── controllers/         # Business logic
│   ├── middleware/          # Auth, upload middleware
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── socket/              # Socket.IO event handlers
│   ├── utils/               # Logger, helpers
│   ├── .env.example         # Environment variables template
│   ├── index.js             # Server entry point
│   └── package.json
│
├── client/                  # React Web App
│   ├── src/
│   │   ├── context/         # Auth, Socket, Theme context
│   │   ├── pages/           # All page components
│   │   ├── services/        # Axios API service
│   │   ├── App.js           # Root with routing
│   │   └── index.css        # Global styles + glassmorphism
│   ├── tailwind.config.js
│   └── package.json
│
└── mobile/                  # React Native + Expo App
    ├── src/
    │   ├── context/         # Auth context with AsyncStorage
    │   ├── navigation/      # Stack + Tab navigator
    │   └── screens/         # All app screens
    ├── App.js
    └── package.json
```

---

## ✨ Features

### Core Messaging
- ✅ Real-time one-to-one chat (Socket.IO)
- ✅ Group chat with admin controls
- ✅ Message seen/delivered status (✓✓)
- ✅ Typing indicators
- ✅ Emoji reactions on messages
- ✅ Reply to specific messages
- ✅ Delete/Edit messages
- ✅ Image/File/Voice sharing (Cloudinary)
- ✅ Message search

### AI Features (OpenAI/Gemini)
- ✅ AI Chat Assistant (ConnectX AI)
- ✅ Smart Reply Suggestions
- ✅ Auto Translation (EN ↔ HI ↔ TE)
- ✅ Message Summarization

### Communication
- ✅ Voice Calls (WebRTC signaling ready)
- ✅ Video Calls (WebRTC signaling ready)
- ✅ Online/Offline status
- ✅ Last seen timestamps
- ✅ Push Notifications (FCM ready)

### User Features
- ✅ Email/Password + OTP Registration
- ✅ JWT + Refresh Token auth
- ✅ Profile customization
- ✅ Stories/Status (24hr auto-expire)
- ✅ Block/Unblock users
- ✅ Dark/Light theme
- ✅ Multi-language: English, हिंदी, తెలుగు

### Security
- ✅ JWT Authentication
- ✅ bcrypt password hashing
- ✅ Rate limiting (express-rate-limit)
- ✅ MongoDB sanitization (NoSQL injection prevention)
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Secure refresh token rotation

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Mobile | React Native, Expo, NativeWind |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO 4.7 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| File Storage | Cloudinary |
| AI | OpenAI GPT-3.5 Turbo |
| Notifications | Firebase Cloud Messaging |
| Deployment | Vercel (web) + Render (backend) + MongoDB Atlas |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier)
- OpenAI API key (optional, for AI features)

---

### Step 1: Clone & Setup

```bash
# Clone the project
git clone <your-repo-url>
cd connectx
```

---

### Step 2: Backend Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values (see Environment Variables section)
nano .env

# Start development server
npm run dev
```

Server runs at: `http://localhost:5000`

Test it: `http://localhost:5000/api/health`

---

### Step 3: Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit: REACT_APP_API_URL=http://localhost:5000/api
# Edit: REACT_APP_SOCKET_URL=http://localhost:5000

# Start React app
npm start
```

Web app runs at: `http://localhost:3000`

---

### Step 4: Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Update API URL in src/screens/LoginScreen.js
# Change: const API = "http://YOUR-SERVER-URL/api"

# Start Expo
npx expo start

# Scan QR code with Expo Go app on your phone
# OR press 'a' for Android emulator, 'i' for iOS simulator
```

---

## 🔧 Environment Variables

### Server `.env`

```env
# ─── Server ───────────────────────────────
PORT=5000
NODE_ENV=development

# ─── MongoDB ──────────────────────────────
# Get from: https://cloud.mongodb.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/connectx

# ─── JWT Secrets ──────────────────────────
# Use any random string, min 32 characters
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=another_random_secret_for_refresh_tokens
JWT_REFRESH_EXPIRE=30d

# ─── Cloudinary ───────────────────────────
# Get from: https://cloudinary.com (free tier available)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Email (for OTP) ──────────────────────
# Use Gmail App Password, not your regular password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password

# ─── OpenAI (AI Features) ─────────────────
# Get from: https://platform.openai.com
# Optional — AI features show fallback without it
OPENAI_API_KEY=sk-proj-your-openai-api-key

# ─── Client ───────────────────────────────
CLIENT_URL=http://localhost:3000
```

### Client `.env.local`

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users/search?q=name` | Search users |
| GET | `/api/users/:userId` | Get user profile |
| POST | `/api/users/block/:userId` | Block/Unblock user |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:userId` | Get conversation |
| POST | `/api/messages/send` | Send message |
| DELETE | `/api/messages/:id` | Delete message |
| PUT | `/api/messages/:id/react` | Add reaction |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | AI chatbot |
| POST | `/api/ai/smart-reply` | Get smart replies |
| POST | `/api/ai/translate` | Translate text |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/file` | Upload file to Cloudinary |

---

## 🔌 Socket.IO Events

### Client → Server (emit)
```javascript
// Send message
socket.emit("send_message", {
  receiverId: "userId",
  content: "Hello!",
  type: "text",      // text | image | voice | file
  replyTo: "msgId",  // optional
  tempId: "localId"  // for optimistic UI
});

// Typing
socket.emit("typing", { receiverId: "userId" });
socket.emit("stop_typing", { receiverId: "userId" });

// Join group
socket.emit("join_group", "groupId");

// Mark seen
socket.emit("seen", { messageId: "msgId", senderId: "userId" });

// Voice/Video Call
socket.emit("call_user", {
  receiverId: "userId",
  callType: "video",  // video | voice
  signalData: webRTCOffer
});
```

### Server → Client (on)
```javascript
socket.on("receive_message", (message) => { /* new message */ });
socket.on("message_sent", (message) => { /* delivery confirmation */ });
socket.on("typing", ({ userId, name }) => { /* show typing */ });
socket.on("stop_typing", ({ userId }) => { /* hide typing */ });
socket.on("user_online", ({ userId }) => { /* update online status */ });
socket.on("user_offline", ({ userId, lastSeen }) => { /* update offline status */ });
socket.on("message_seen", ({ messageId, seenBy }) => { /* update tick */ });
socket.on("incoming_call", ({ callerId, callType, signalData }) => { /* show call UI */ });
socket.on("call_accepted", ({ signalData }) => { /* start call */ });
socket.on("call_rejected", () => { /* show rejected */ });
socket.on("call_ended", () => { /* end call UI */ });
```

---

## 🗄️ Database Schema

### Users Collection
```javascript
{
  name, username, email, phone,
  password (hashed), avatar, bio,
  isOnline, lastSeen, isVerified,
  language: "en|hi|te",
  theme: "dark|light",
  blockedUsers: [userId],
  contacts: [userId],
  role: "user|admin",
  pushToken, refreshToken
}
```

### Messages Collection
```javascript
{
  sender, receiver, group,
  content, type: "text|image|audio|video|file|voice",
  mediaUrl, mediaName, mediaSize,
  replyTo: messageId,
  reactions: [{ user, emoji }],
  seenBy: [userId], deliveredTo: [userId],
  isEdited, isDeleted, isEncrypted,
  scheduledAt
}
```

### Groups Collection
```javascript
{
  name, description, avatar,
  creator, admins: [userId],
  members: [{ user, role: "member|admin|owner", joinedAt }],
  isPublic, inviteLink, maxMembers,
  lastMessage, lastActivity
}
```

### Stories Collection
```javascript
{
  user, content, mediaUrl,
  mediaType: "text|image|video",
  backgroundColor, textColor,
  viewers: [{ user, viewedAt }],
  expiresAt  // auto-deleted after 24hrs
}
```

---

## 🚢 Deployment Guide

### Option A: Render (Backend) + Vercel (Frontend) — RECOMMENDED FREE

#### 1. Deploy Backend to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo → select `server` folder as root
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add all environment variables from `.env`
6. Deploy! Render gives you a URL like `https://connectx-api.onrender.com`

#### 2. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect GitHub repo → select `client` folder as root
3. Add environment variables:
   ```
   REACT_APP_API_URL=https://connectx-api.onrender.com/api
   REACT_APP_SOCKET_URL=https://connectx-api.onrender.com
   ```
4. Deploy! Get URL like `https://connectx.vercel.app`
5. Update `CLIENT_URL` in Render env vars to your Vercel URL

#### 3. MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create free M0 cluster
3. Create database user with password
4. Whitelist IP: `0.0.0.0/0` (allow all, or specific Render IPs)
5. Copy connection string → add to `MONGODB_URI` in Render

---

### Option B: Railway (Backend)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from server directory
cd server
railway init
railway up

# Add environment variables via Railway dashboard
```

---

### Option C: VPS/DigitalOcean (Self-hosted)

```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Clone your project
git clone <your-repo>
cd connectx/server

# Install dependencies
npm install

# Create .env
nano .env  # Add all variables

# Start with PM2
pm2 start index.js --name connectx-server
pm2 startup
pm2 save

# Install nginx for reverse proxy
sudo apt install nginx
# Configure nginx to proxy to port 5000
```

---

## 📱 Mobile APK Build

### Using EAS Build (Expo Application Services)

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS
eas build:configure

# Build Android APK (free tier available)
eas build --platform android --profile preview

# Build Android App Bundle (for Play Store)
eas build --platform android --profile production

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

### eas.json configuration
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": {}
    }
  }
}
```

After build completes, EAS provides a download link for your APK.

---

## 🔒 Security Checklist

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT with short expiry (7 days)
- ✅ Refresh token rotation
- ✅ Rate limiting on all API routes
- ✅ Strict rate limiting on auth routes (10 req/15min)
- ✅ MongoDB sanitization (prevents NoSQL injection)
- ✅ Helmet.js security headers
- ✅ CORS configured for specific origin
- ✅ Input validation with express-validator
- ✅ File type validation on uploads
- ✅ 50MB file size limit
- ⬜ End-to-End Encryption (add with libsodium)
- ⬜ Certificate pinning (mobile)

---

## 🌍 Multi-language Support

The app supports 3 languages:
- 🇬🇧 **English** (en) — Default
- 🇮🇳 **Hindi** (hi) — हिंदी
- 🏳️ **Telugu** (te) — తెలుగు

To add translations:
1. Create `src/i18n/translations.js`
2. Add translation keys for each language
3. Use `useTranslation()` hook in components

The AI assistant also responds in all 3 languages automatically.

---

## 🧪 Testing

```bash
# Backend API testing
cd server

# Test health endpoint
curl http://localhost:5000/api/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

---

## 📦 Adding More Features

### End-to-End Encryption
```bash
npm install tweetnacl tweetnacl-util
```
Generate keypairs client-side, exchange public keys, encrypt with recipient's public key.

### Voice Messages
Use `MediaRecorder` API in browser or `expo-av` in React Native to record audio, upload to Cloudinary, send as `type: "voice"` message.

### WebRTC Video Calls
```bash
npm install simple-peer  # for React web
npm install react-native-webrtc  # for React Native
```
Socket.IO is already set up for WebRTC signaling (offer/answer/ICE candidates).

### Push Notifications
1. Set up Firebase project → get FCM server key
2. Add `FIREBASE_SERVER_KEY` to `.env`
3. Send push via FCM API when message is received and user is offline

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m "Add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License — Free to use for personal and commercial projects.

---

## 🙏 Credits

Built with ❤️ using:
- [React](https://reactjs.org/) · [Node.js](https://nodejs.org/) · [Socket.IO](https://socket.io/)
- [MongoDB](https://mongodb.com/) · [Cloudinary](https://cloudinary.com/)
- [OpenAI](https://openai.com/) · [Expo](https://expo.dev/)

---

*ConnectX — Chat. Connect. Evolve.* 🚀
