// backend/routes/userroutes.js
const express = require("express");
const cors = require("cors");
const router = express.Router();
const verifyToken = require("../middleware/authmiddleware");
const { registerStudent, registerOrganizer, login, adminLogin } = require("../controllers/authcontroller");
const { getStudentHackathons } = require("../controllers/registrationcontroller");
const { getUserCounts, getEventCounts, getAllHackathons } = require("../controllers/admincontroller");
const studentusers = require("../modules/studentuser");
const organizerusers = require("../modules/organizerusers");

router.use(
  cors({
    origin: ["https://spark2.netlify.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Authentication Routes
router.post("/register/student", registerStudent);
router.post("/register/organizer", registerOrganizer);
router.post("/login", login);
router.post("/admin/login", adminLogin);

// Fetch Registered & Participated Hackathons
router.get("/registered-events", verifyToken, getStudentHackathons);
router.get("/participated-events", verifyToken, getStudentHackathons);

// Admin routes
router.get("/user-counts", verifyToken, getUserCounts);
router.get("/event-counts", verifyToken, getEventCounts);
router.get("/hackathons", verifyToken, getAllHackathons);

// Existing routes for fetching students and organizers
router.get("/students", async (req, res) => {
  try {
    const students = await studentusers.find({}, "name username email");
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.get("/organizers", async (req, res) => {
  try {
    const organizers = await organizerusers.find({}, "name username email ");
    res.json(organizers);
  } catch (error) {
    console.error("Error fetching organizers:", error);
    res.status(500).json({ error: "Failed to fetch organizers" });
  }
});

module.exports = router;