const express = require('express');
const router = express.Router();
const multer = require('multer');
const { cloudinary, storage } = require('../cloudinaryConfig');
const upload = multer({ storage });
const Hackathon = require('../modules/hackathon');
const RegisteredHackathon = require('../modules/registeredhackathon');
const mongoose = require("mongoose");
const { getHackathonRegistrations } = require('../controllers/registrationcontroller');

// Unified Registration Endpoint for Solo and Team Hackathons
router.post('/register', upload.single('file'), async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    // Validate PDF file
    if (req.file && req.file.mimetype !== 'application/pdf') {
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename, {
          resource_type: 'raw'
        });
      }
      return res.status(400).json({ 
        success: false,
        message: 'Only PDF files are allowed' 
      });
    }

    // Parse form data
    const {
      hackathonId,
      studentId,
      isTeam,
      name, // For solo registration
      leaderName, // For team registration
      datebirth,
      email, // For solo registration
      leaderEmail, // For team registration
      phone,
      education,
      hasParticipated,
      teamName,
      members
    } = req.body;

    // Validate required fields
    if (!hackathonId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Determine if this is a team or solo registration
    const isTeamRegistration = isTeam === 'true';
    
    // Parse members from JSON string (only for team registration)
    let parsedMembers = [];
    if (isTeamRegistration) {
      try {
        parsedMembers = JSON.parse(members || '[]');
      } catch (e) {
        console.error("Error parsing members:", e);
        parsedMembers = [];
      }
    }

    // Check if hackathon exists
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    if (!hackathon.organizerId) {
      return res.status(400).json({ 
        success: false,
        message: 'Organizer ID is missing in the Hackathon data.' 
      });
    }

    if (!studentId || studentId === 'null') {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is missing or invalid.' 
      });
    }
  
    // Check for existing registration
    const existingRegistration = await RegisteredHackathon.findOne({ 
      hackathonId, 
      studentId 
    });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this hackathon.'
      });
    }

    // Prepare registration data based on registration type
    const registrationData = {
      hackathonId,
      organizerId: hackathon.organizerId,
      studentId: new mongoose.Types.ObjectId(studentId),
      isTeam: isTeamRegistration,
      datebirth,
      phone,
      education,
      hasParticipated,
      registrationDate: new Date()
    };

    // Set name and email based on registration type
    if (isTeamRegistration) {
      registrationData.leaderName = leaderName;
      registrationData.leaderEmail = leaderEmail;
      registrationData.teamName = teamName;
      registrationData.members = parsedMembers;
    } else {
      registrationData.name = name;
      registrationData.email = email;
      registrationData.members = []; // Empty array for solo registration
    }

    // Handle file upload
    if (req.file) {
      // Generate thumbnail URL
      const thumbnailUrl = cloudinary.url(req.file.filename, {
        resource_type: 'image',
        format: 'jpg',
        page: 1, // First page of PDF
        width: 300,
        crop: 'scale'
      });

      registrationData.proposal = {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        thumbnailUrl: thumbnailUrl
      };
    }

    console.log("Final registration data:", registrationData);

    // Save registration
    const newRegistration = await RegisteredHackathon.create(registrationData);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration: newRegistration
    });

  } catch (error) {
    console.error("Registration Error:", error);
    
    // Clean up uploaded file if error occurred
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename, {
          resource_type: 'raw'
        });
      } catch (cleanupError) {
        console.error("File cleanup failed:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// [Keep all your other existing routes exactly as they were]
// Add this temporary route to debug Cloudinary uploads
router.post('/test-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    return res.json({
      success: true,
      file: {
        path: req.file.path,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Upload failed',
      error: error.message 
    });
  }
});

// Fetch all registrations for a specific hackathon
router.get('/hackathon/:hackathonId', getHackathonRegistrations);

// Fetch hackathons registered by a specific student
router.get('/registeredhackathons/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type } = req.query; // Expect type="upcoming" or "participated"
    const today = new Date();
    // Fetch all hackathon registrations for the student
    const registrations = await RegisteredHackathon.find({ studentId })
      .populate('hackathonId');
    // Filter based on upcoming or participated events
    let filteredEvents = [];
    if (type === 'upcoming') {
      filteredEvents = registrations.filter(reg => new Date(reg.hackathonId.date) >= today);
    } else if (type === 'participated') {
      filteredEvents = registrations.filter(reg => new Date(reg.hackathonId.date) < today);
    } else {
      return res.status(400).json({ message: 'Invalid event type specified.' });
    }
      res.status(200).json(filteredEvents);
  } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Fetch upcoming events hosted by a specific organizer
router.get("/organizer/:organizerId", async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { type } = req.query;
    const today = new Date();

    const events = await Hackathon.find({ organizerId })
    .populate('organizerId');
     // Filter based on upcoming or conducted events
     let filteredEvent = [];
     if (type === 'upcomin') {
       filteredEvent = events.filter(reg => new Date(reg.date) >= today); 
     } else if (type === 'conducted') {
       filteredEvent = events.filter(reg => new Date(reg.date) < today);
     } else {
       return res.status(400).json({ message: 'Invalid event type specified.' });
     }

    res.status(200).json(filteredEvent);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// Route for Fetching Registered Students by Hackathon ID
router.get("/registeredhackathon/hackathon/:hackathonId", async (req, res) => {
  try {
    const { hackathonId } = req.params;
    console.log("📌 Fetching students for Hackathon ID:", hackathonId);

    if (!hackathonId || hackathonId === "undefined") {
      return res.status(400).json({ message: "Invalid Hackathon ID." });
    }

    const registeredStudents = await RegisteredHackathon.find({ hackathonId });

    if (!registeredStudents.length) {
      return res.status(404).json({ message: "No students registered for this hackathon." });
    }

    res.json(registeredStudents);
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/check/:hackathonId', async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const studentId = req.user?.id; 

    if (!studentId) {
      return res.status(401).json({ isRegistered: false });
    }

    const registration = await RegisteredHackathon.findOne({
      hackathonId,
      studentId
    });

    res.json({ isRegistered: !!registration });
  } catch (error) {
    console.error('Registration check error:', error);
    res.status(500).json({ 
      message: 'Error checking registration status',
      error: error.message 
    });
  }
});

module.exports = router;