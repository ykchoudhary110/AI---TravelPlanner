// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// import routes
const authRoutes = require('./routes/auth');
const plannerRoutes = require('./routes/planner');

const app = express();

// ======= BASIC MIDDLEWARE =======
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======= CORS =======
// allow both 127.0.0.1 and localhost (helps avoid mixed host issues)
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (e.g., curl, mobile)
      if (!origin) return cb(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return cb(null, true);
      return cb(new Error('CORS not allowed'), false);
    },
    credentials: true,
  })
);

// ======= ROUTES =======
app.use('/api/auth', authRoutes);
app.use('/api/plan', plannerRoutes);

app.get('/', (req, res) => {
  res.send('AI Trip Planner Server is running 🚀');
});

// ======= DB CONNECT =======
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error('❌ Missing MONGO_URI in .env file — please add it and restart the server.');
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ Mongo connection error:', err.message);
    process.exit(1);
  });

// ======= ERROR HANDLER =======
app.use((err, req, res, next) => {
  console.error('Server error middleware:', err && err.message ? err.message : err);
  res.status(500).json({ error: 'Server internal error' });
});

// ======= START SERVER =======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`DEBUG: Loaded env keys: MONGO_URI ${!!process.env.MONGO_URI}, JWT_SECRET ${!!process.env.JWT_SECRET}, GEMINI_ENDPOINT ${!!process.env.GEMINI_ENDPOINT}`);
});
