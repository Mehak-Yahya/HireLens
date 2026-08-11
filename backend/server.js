import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import jobRoutes from "./routes/jobRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB
connectDB();

// Routes
app.use("/api/jobs", jobRoutes);
app.use("/api/search", searchRoutes);

// Home
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HireLens API is running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`HireLens server running on port ${PORT}`);
});