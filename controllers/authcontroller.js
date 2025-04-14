const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const StudentUser = require("../modules/studentuser");
const OrganizerUser = require("../modules/organizerusers");
const Admin = require("../modules/admin");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; 

// ================== REGISTER STUDENT ==================
const registerStudent = async (req, res) => {
  const { name, email, username, password, userType } = req.body;   
  if (!userType) {
    return res.status(400).json({ message: 'User type is required' });
}
  try {
    const existingUser = await StudentUser.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new StudentUser({ name, email, username, password: hashedPassword, userType: "student" });
    await newUser.save();
    res.status(201).json({ success: true, message: "Student registered successfully!", studentId: newUser._id  
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================== REGISTER ORGANIZER ==================
const registerOrganizer = async (req, res) => {
  const { name, email, username, password, address, certificate, userType } = req.body;
  if (!userType) {
    return res.status(400).json({ message: 'User type is required' });
}
  try {
    const existingUser = await OrganizerUser.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new OrganizerUser({ name, email, username, password: hashedPassword, address, certificate, userType: "organizer" });
    await newUser.save();
    res.status(201).json({ success: true, message: "Organizer registered successfully!", organizerId: newUser._id  // ✅ Send organizerId back
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ================== LOGIN ==================
const login = async (req, res) => {
  const { username, password, userType } = req.body;

  try {
    let user;

    if (userType === "student") {
      user = await StudentUser.findOne({ username }).select("userType _id username password").lean();
    } else if (userType === "organizer") {
      user = await OrganizerUser.findOne({ username }).select("userType _id username password").lean();
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }

    if (!user) return res.status(400).json({ message: "User not found" });

    console.log("Logging in user:", user); // Debug log
    console.log("User Type before signing token:", user.userType); // Debug log

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, userType: user.userType }, process.env.JWT_SECRET, { expiresIn: "24h" });
    console.log("Generated Token:", token);

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      studentId: user.userType === "student" ? user._id :null, 
      organizerId: user.userType === "organizer" ? user._id : null, 
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================== ADMIN LOGIN ==================
const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: "Admin not found" });

    if (admin.password !== password) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: admin._id, userType: "admin" }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerStudent,
  registerOrganizer,
  login,
  adminLogin,
};
