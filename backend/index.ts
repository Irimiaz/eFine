// src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import requestHandler from "./handlers/requestHandler";
import { connectToDatabase } from "./db";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Your existing routes
app.post("/api", requestHandler);
app.get("/api", requestHandler);

async function startServer() {
  try {
    // Connect to MongoDB before accepting requests
    await connectToDatabase();
    console.log("🗄️  MongoDB connected, starting server…");

    app.listen(port, () => {
      console.log(`🚀  Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("❌  Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
