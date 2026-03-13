require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());

const port = process.env.PORT || 5000;

async function dbConnect() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection error:", err);
  }
}
dbConnect();

// Require Routes
const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRoutes");

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
