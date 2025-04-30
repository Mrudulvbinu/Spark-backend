const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const Hackathon = require("../modules/hackathon");
const RegisteredHackathon = require("../modules/registeredhackathon");
const mongoose = require("mongoose");
const verifyToken = require("../middleware/authmiddleware");
const OrganizerUser = require("../modules/organizerusers");

router.use(
  cors({
    origin: ["https://spark2.netlify.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

router.get("/", async (req, res) => {
  try {
    const hackathons = await Hackathon.find();
    res.status(200).json(hackathons);
  } catch (error) {
    console.error(" Error fetching hackathons:", error);
    res.status(500).json({ message: "Failed to fetch hackathons.", error: error.message });
  }
});


router.post("/add", verifyToken, async (req, res) => {
  try {
    console.log(" Received request to add hackathon");
    console.log(" Request Body:", req.body);
    console.log(" Decoded Token:", req.user);

    if (!req.user || req.user.userType !== "organizer") {
      return res.status(403).json({ message: "Forbidden: Only organizers can create hackathons." });
    }

    const organizerId = req.user.id;
    
    // Fetch the organizer's details from OrganizerUser model
    const organizer = await OrganizerUser.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found." });
    }

    const { typeofhk, ename, venue, date, regstart, regend, details, durofhk, prize, isTeamHackathon } = req.body;
    if (!typeofhk || !ename || !venue || !date || !regstart || !regend || !details || !durofhk || !prize) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newHackathon = new Hackathon({
      organizerId: new mongoose.Types.ObjectId(organizerId),
      orgname: organizer.name, // Set the organizer's name here
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
    console.log(" Hackathon added successfully:", newHackathon);
    res.status(201).json({ message: "Hackathon added successfully!", hackathon: newHackathon });
  } catch (error) {
    console.error(" Error adding hackathon:", error);
    res.status(500).json({ message: "Failed to add hackathon.", error: error.message });
  }
});


// Generate and download PDF report for a conducted hackathon
router.get("/generate-report/:hackathonId", async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ error: "Hackathon not found" });
    }
    const totalRegistrations = await RegisteredHackathon.countDocuments({ hackathonId });

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const reportsDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfPath = path.join(reportsDir, `hackathon_${hackathonId}.pdf`);
    const stream = fs.createWriteStream(pdfPath);
    const logoPath = path.join(__dirname, "../assets/sparkventure.png");

    doc.pipe(stream);

    // PDF content
    if (fs.existsSync(logoPath)) {
      const imageWidth = 200; 
      const pageWidth = doc.page.width;
      const centerX = (pageWidth - imageWidth) / 2; 
  
      doc.image(logoPath, centerX, 50, { width: imageWidth });
      doc.moveDown(4);
  }
  
    doc.fontSize(18).text("Hackathon Event Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Event Name: ${hackathon.ename}`);
    doc.text(`Date: ${new Date(hackathon.date).toDateString()}`);
    doc.text(`Venue: ${hackathon.venue || "N/A"}`);
    doc.text(`Total Registrations: ${totalRegistrations}`);
    doc.text(`Hackathon Type: ${hackathon.isTeamHackathon ? "Team-Based" : "Solo"}`);
    doc.moveDown(2);


doc.fontSize(12).text("Introduction", { underline: true });
doc.moveDown(0.5);
doc.text(
  "The hackathon event provided an exciting opportunity for participants to showcase their coding and problem-solving skills. Teams and individuals competed to develop innovative solutions within a limited timeframe."
);
doc.moveDown();

doc.fontSize(12).text("Objectives", { underline: true });
doc.moveDown(0.5);
doc.text(
  "The primary goals of the hackathon were:"
);
doc.moveDown(0.5);
doc.list([
  "Encourage innovation and creativity in technology.",
  "Provide a platform for networking and collaboration.",
  "Develop practical solutions to real-world problems.",
  "Enhance coding, teamwork, and problem-solving skills."
]);
doc.moveDown();

doc.fontSize(12).text("Event Highlights", { underline: true });
doc.moveDown(0.5);
doc.text(
  "The event witnessed enthusiastic participation from students, developers, and tech enthusiasts. Key highlights include:"
);
doc.moveDown(0.5);
doc.list([
  `Total Teams Participated: ${hackathon.isTeamHackathon ? totalRegistrations : "N/A"}`,
  `Total Individual Participants: ${hackathon.isTeamHackathon ? "N/A" : totalRegistrations}`,
  "Keynote speech by industry experts.",
  "Hands-on workshops and mentorship sessions.",
  "Live product demonstrations and project pitches."
]);
doc.moveDown();

doc.fontSize(12).text("Judging Criteria", { underline: true });
doc.moveDown(0.5);
doc.text(
  "The projects were evaluated based on the following parameters:"
);
doc.moveDown(0.5);
doc.list([
  "Innovation and originality of the idea.",
  "Technical complexity and feasibility.",
  "Presentation and user experience.",
  "Impact and real-world applicability."
]);
doc.moveDown();

doc.fontSize(12).text("Winners & Recognition", { underline: true });
doc.moveDown(0.5);
doc.text(
  "The top-performing teams and individuals were awarded for their outstanding contributions. Special recognitions were given for:"
);
doc.moveDown(0.5);
doc.list([
  "Best Innovative Solution",
  "Most Technically Advanced Project",
  "Best Teamwork and Collaboration",
  "Audience Choice Award"
]);
doc.moveDown();

doc.fontSize(12).text("Conclusion", { underline: true });
doc.moveDown(0.5);
doc.text(
  "The hackathon was a resounding success, fostering innovation and collaboration among participants. The solutions developed during the event demonstrated great potential for real-world impact. We look forward to hosting more such events in the future."
);
doc.moveDown();

// End the PDF
doc.end();

    stream.on("finish", () => {
      res.download(pdfPath, `Hackathon_Report_${hackathon.ename}.pdf`);
    });

  } catch (error) {
    console.error("❌ Error generating report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found" });
    }
    res.status(200).json(hackathon);
  } catch (error) {
    console.error("Error fetching hackathon:", error);
    res.status(500).json({ message: "Failed to fetch hackathon", error: error.message });
  }
});

module.exports = router;
