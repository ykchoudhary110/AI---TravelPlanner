// server/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/auth");
const plannerRoutes = require("./routes/planner");

const app = express();

// ======= BASIC MIDDLEWARE =======
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======= CORS FIX (LOCAL + VERCEL + RENDER) =======
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL, // from Render / Vercel environment variables
].filter(Boolean); // remove undefined entries

const corsOptionsDelegate = (reqOrigin, callback) => {
  // Note: `reqOrigin` can be undefined for non-browser clients (curl, mobile apps)
  if (!reqOrigin) return callback(null, true);

  if (allowedOrigins.includes(reqOrigin)) {
    return callback(null, true);
  }

  console.warn("❌ CORS BLOCKED:", reqOrigin);
  return callback(new Error("Not allowed by CORS"), false);
};

app.use(
  cors({
    origin: (origin, cb) => corsOptionsDelegate(origin, cb),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

// Explicitly respond to preflight requests
app.options("*", (req, res) => {
  // mirror the allowed origin for the preflight reply (safe because we validated origin above)
  const origin = req.header("Origin");
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,Accept"
    );
    return res.sendStatus(204);
  }

  return res.sendStatus(403);
});

// ======= ROUTES =======
app.use("/api/auth", authRoutes);
app.use("/api/plan", plannerRoutes);

app.get("/", (req, res) => {
  res.send("AI Trip Planner Server is running 🚀");
});

// ======= DATABASE CONNECTION =======
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ Missing MONGO_URI in environment variables");
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ Mongo connection error:", err.message);
    process.exit(1);
  });

// ======= ERROR HANDLER =======
// Handle CORS-specific errors more explicitly to avoid confusing 500s
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes("CORS")) {
    console.warn("CORS error:", err.message);
    return res.status(403).json({ error: "CORS error: request blocked" });
  }

  console.error("Server error middleware:", err.message || err);
  res.status(500).json({ error: "Server internal error" });
});

// ======= SERVER START =======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("DEBUG ENV:", {
    MONGO: !!process.env.MONGO_URI,
    JWT: !!process.env.JWT_SECRET,
    GEMINI: !!process.env.GEMINI_ENDPOINT,
    FRONTEND: process.env.FRONTEND_URL,
  });
});
