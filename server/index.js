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

// ======= CORS CONFIG =======
// Allowed origins (local + Vercel)
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL, // your Vercel URL from Render env
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile/curl/postman

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ CORS BLOCKED:", origin);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};

app.use(cors(corsOptions));

// ======= FIXED PREFLIGHT HANDLER =======
// Must start with "/" to avoid path-to-regexp crash
app.options("/*", cors(corsOptions), (req, res) => {
  res.sendStatus(204);
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
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes("CORS")) {
    console.warn("CORS error:", err.message);
    return res.status(403).json({ error: "CORS error: Request blocked" });
  }

  console.error("Server error:", err.message || err);
  res.status(500).json({ error: "Server internal error" });
});

// ======= SERVER START =======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("DEBUG ENV:", {
    MONGO: !!process.env.MONGO_URI,
    FRONTEND: process.env.FRONTEND_URL,
  });
});
