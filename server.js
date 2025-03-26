const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["https://spark25.onrender.com", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");  
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
  });

const authRoutes = require("./routes/authroutes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/userroutes");
app.use("/api/user", userRoutes);

const hackathonroutes = require("./routes/hackathonroutes");
app.use("/api/hackathons", hackathonroutes);

const registeredhackathonRoutes = require("./routes/hackathonregistrationroutes");
app.use("/api/registeredhackathon", registeredhackathonRoutes);


app.use(express.static(path.join(__dirname, "../dist"))); 

app.get("*", (res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});



app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
