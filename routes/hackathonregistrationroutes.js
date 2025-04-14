const express = require('express');
const router = express.Router();
const Hackathon = require('../modules/hackathon');
const RegisteredHackathon = require('../modules/registeredhackathon');
const mongoose = require("mongoose");

const {
  getHackathonRegistrations,
} = require('../controllers/registrationcontroller');


// Unified Registration Endpoint for Solo and Team Hackathons
router.post('/register', async (req, res) => {
  try {
    console.log("Incoming Registration Data:", req.body);

    const {
      hackathonId,
      studentId,
      isTeam,
      leaderName,
      datebirth,
      leaderEmail,
      name,
      email,
      phone,
      education,
      hasParticipated,
      teamName,
      members
    } = req.body;

    if (!hackathonId) {
      return res.status(400).json({ message: 'Hackathon ID is required.' });
    }

    //  Fetch Hackathon to get organizerId
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found.' });
    }

    // Ensuring organizerId exists
    if (!hackathon.organizerId) {
      return res.status(400).json({ message: 'Organizer ID is missing in the Hackathon data.' });
    }
// Ensuring studentId is valid before converting to ObjectId
if (!studentId || studentId === 'null') {
  return res.status(400).json({ message: 'Student ID is missing or invalid.' });
}
  
    // Checking if the user is already registered
    const existingRegistration = await RegisteredHackathon.findOne({ hackathonId, studentId });
    if (existingRegistration) {
      return res.status(400).json({ message: 'You have already registered for this hackathon.' });
    }

    // registration data
    const registrationData = {
      hackathonId,
      organizerId: hackathon.organizerId,
      studentId: new mongoose.Types.ObjectId(studentId), 
      isTeam,
      leaderName: isTeam ? leaderName : name, 
      leaderEmail: isTeam ? leaderEmail : email, 
      datebirth,
      phone,
      education,
      hasParticipated,
      teamName: isTeam ? teamName : undefined, 
    members: isTeam ? members.map((m) => ({
        name: m.name,
        email: m.email,
        dob: m.dob
    })) : [], 
    registrationDate: new Date()
};
  

    // Save registration to the database
    const newRegistration = new RegisteredHackathon(registrationData);
    await newRegistration.save();

    return res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    console.error("Server Error Details:", error);
    res.status(500).json({ message: 'Server error.', error: error.message });
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





 //Route for Fetching Registered Students by Hackathon ID
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