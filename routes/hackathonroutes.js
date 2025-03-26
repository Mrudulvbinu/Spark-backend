const express = require("express");
const cors = require("cors");
const router = express.Router();
const Hackathon = require("../modules/hackathon");
const mongoose = require("mongoose");
const verifyToken = require("../middleware/authmiddleware");


router.use(
  cors({
    origin: ["https://spark25.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

router.get("/", async (req, res) => {
  try {
    const hackathons = await Hackathon.find();
    res.status(200).json(hackathons);
  } catch (error) {
    console.error("❌ Error fetching hackathons:", error);
    res.status(500).json({ message: "Failed to fetch hackathons.", error: error.message });
  }
});


router.post("/add", verifyToken, async (req, res) => {
  try {
    console.log("📢 Received request to add hackathon");
    console.log("🔹 Request Body:", req.body);
    console.log("🔹 Decoded Token:", req.user);

    if (!req.user || req.user.userType !== "organizer") {
      return res.status(403).json({ message: "Forbidden: Only organizers can create hackathons." });
    }

    const organizerId = req.user.id;

    const { typeofhk, ename, venue, date, regstart, regend, details, durofhk, prize, isTeamHackathon} = req.body;
    if (!typeofhk || !ename || !venue || !date || !regstart || !regend || !details || !durofhk || !prize) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newHackathon = new Hackathon({
      organizerId: new mongoose.Types.ObjectId(organizerId),
      typeofhk,
      ename,
      venue,
      date,
      regstart,
      regend,
      details,
      durofhk,
      prize,
      isTeamHackathon,
    });

    await newHackathon.save();
    console.log("✅ Hackathon added successfully:", newHackathon);
    res.status(201).json({ message: "Hackathon added successfully!", hackathon: newHackathon });
  } catch (error) {
    console.error("❌ Error adding hackathon:", error);
    res.status(500).json({ message: "Failed to add hackathon.", error: error.message });
  }
});

module.exports = router;
