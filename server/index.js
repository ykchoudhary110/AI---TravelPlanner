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
  process.env.FRONTEND_URL, // from Render environment variables
].filter(Boolean); // remove undefined entries

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow mobile, curl

      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      console.log("❌ CORS BLOCKED:", origin);
      return cb(new Error("CORS not allowed"), false);
    },
    credentials: true,
  })
);

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
