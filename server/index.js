const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { initSocket } = require('./socket/socketHandler');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const messageRoutes = require('./routes/message.routes');
const groupRoutes = require('./routes/group.routes');
const uploadRoutes = require('./routes/upload.routes');
const aiRoutes = require('./routes/ai.routes');
const notificationRoutes = require('./routes/notification.routes');
const storyRoutes = require('./routes/story.routes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

initSocket(io);

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(mongoSanitize());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts. Please wait 15 minutes.' },
});
app.use('/api/auth/', authLimiter);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ConnectX Server Running 🚀', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('✅ MongoDB Connected Successfully');
    server.listen(PORT, () => {
      logger.info(`🚀 ConnectX Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    logger.error(`❌ MongoDB Connection Failed: ${err.message}`);
    process.exit(1);
  });

module.exports = { app, io };