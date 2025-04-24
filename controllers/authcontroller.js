const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const StudentUser = require("../modules/studentuser");
const OrganizerUser = require("../modules/organizerusers");
const Admin = require("../modules/admin");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Helper function for validation
const validateRegistrationInput = (data, isOrganizer = false) => {
  const { name, email, username, password } = data;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
  if (!username || username.length < 4) errors.push('Username must be at least 4 characters');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  if (isOrganizer && !data.address) errors.push('Address is required for organizers');

  return errors;
};

// ================== REGISTER STUDENT ==================
const registerStudent = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Validate input
    const validationErrors = validateRegistrationInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationErrors 
      });
    }

    // Check for existing user
    const existingUser = await StudentUser.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: existingUser.email === email 
          ? 'Email already in use' 
          : 'Username already taken'
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new StudentUser({ 
      name, 
      email, 
      username, 
      password: hashedPassword, 
      userType: "student" 
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, userType: "student" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ 
      success: true,
      message: "Student registered successfully!",
      data: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        userType: "student",
        token
      }
    });

  } catch (error) {
    console.error("Student registration error:", error);
    res.status(500).json({ 
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ================== REGISTER ORGANIZER ==================
const registerOrganizer = async (req, res) => {
  try {
    const { name, email, username, password, address, certificate } = req.body;

    // Validate input
    const validationErrors = validateRegistrationInput(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: validationErrors 
      });
    }

    // Check for existing user
    const existingUser = await OrganizerUser.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: existingUser.email === email 
          ? 'Email already in use' 
          : 'Username already taken'
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new OrganizerUser({ 
      name, 
      email, 
      username, 
      password: hashedPassword, 
      address,
      certificate: certificate || null,
      userType: "organizer" 
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, userType: "organizer" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ 
      success: true,
      message: "Organizer registered successfully!",
      data: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        userType: "organizer",
        token
      }
    });

  } catch (error) {
    console.error("Organizer registration error:", error);
    res.status(500).json({ 
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ================== LOGIN ==================
const login = async (req, res) => {
  try {
    const { username, password, userType } = req.body;

    // Basic validation
    if (!username || !password || !userType) {
      return res.status(400).json({ 
        success: false,
        message: "Username, password and user type are required" 
      });
    }

    // Find user based on type
    let user;
    const userModel = userType === "student" ? StudentUser : OrganizerUser;
    
    user = await userModel.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, userType },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Prepare user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      userType
    };

    if (userType === "organizer") {
      userData.address = user.address;
      userData.certificate = user.certificate;
    }

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      userId: user.id,
      studentId: userType === "student" ? user.id : null,  // Add back
      organizerId: userType === "organizer" ? user.id : null,  // Add back
      userType,
      user: userData
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ================== ADMIN LOGIN ==================
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Username and password are required" 
      });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // In a real app, you should hash admin passwords too!
    if (admin.password !== password) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const token = jwt.sign(
      { id: admin._id, userType: "admin" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful!",
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  registerStudent,
  registerOrganizer,
  login,
  adminLogin
};