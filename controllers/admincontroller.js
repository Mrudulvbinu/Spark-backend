const StudentUser = require("../modules/studentuser");
const OrganizerUser = require("../modules/organizerusers");
const Hackathon = require("../modules/hackathon");
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Simplified event counts calculation
exports.getEventCounts = async (req, res) => {
    try {
        const currentDate = new Date();
        const allHackathons = await Hackathon.find().lean();
        
        const upcomingCount = allHackathons.filter(h => 
            new Date(h.date) >= currentDate
        ).length;
        
        const conductedCount = allHackathons.filter(h => 
            new Date(h.date) < currentDate
        ).length;
        
        res.status(200).json({
            success: true,
            activeEvents: upcomingCount,
            upcomingCount,
            conductedCount
        });
    } catch (error) {
        console.error("Error fetching event counts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch event counts",
            error: error.message
        });
    }
};

// Get all hackathons with automatic status determination
exports.getAllHackathons = async (req, res) => {
    try {
        const currentDate = new Date();
        const hackathons = await Hackathon.find()
            .populate('organizerId', 'name username email')
            .sort({ date: 1 })
            .lean();
          // Format dates and add status
          const hackathonsWithStatus = hackathons.map(h => ({
            ...h,
            date: formatDate(h.date),
            regstart: formatDate(h.regstart),
            regend: formatDate(h.regend),
            status: new Date(h.date) >= currentDate ? 'upcoming' : 'conducted'
        }));
        
        res.status(200).json({
            success: true,
            hackathons: hackathonsWithStatus
        });
    } catch (error) {
        console.error("Error fetching hackathons:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch hackathons",
            error: error.message
        });
    }
};

// Keep getUserCounts the same as before
exports.getUserCounts = async (req, res) => {
    try {
        const [studentCount, organizerCount] = await Promise.all([
            StudentUser.countDocuments(),
            OrganizerUser.countDocuments()
        ]);
        
        res.status(200).json({
            success: true,
            studentCount,
            organizerCount,
        });
    } catch (error) {
        console.error("Error fetching user counts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user counts",
            error: error.message
        });
    }
};