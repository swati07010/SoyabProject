// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("../config/storage"); // Import multer instance
const ProfileDocument = require("../models/ProfileDocument");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_jwt_secret";

// POST /upload-documents
router.post(
  "/upload-documents",
  multer.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
    { name: "licenseOrProof", maxCount: 1 },
  ]),
  async (req, res) => {
    const { mobile, address } = req.body;

    try {
      // 1. Find user
      const user = await User.findOne({ mobile });
      if (!user) return res.status(404).json({ message: "User not found" });

      // 2. Create new document record
      const document = new ProfileDocument({
        user: user._id,
        aadhaarFront: req.files?.aadhaarFront?.[0]?.filename || "",
        aadhaarBack: req.files?.aadhaarBack?.[0]?.filename || "",
        idFront: req.files?.idFront?.[0]?.filename || "",
        idBack: req.files?.idBack?.[0]?.filename || "",
        licenseOrProof: req.files?.licenseOrProof?.[0]?.filename || "",
        address: address || "",
      });

      await document.save();
      res.status(201).json({ message: "Documents uploaded", data: document });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// In-memory OTP store (use Redis in real apps)
const otpStore = {}; // { "mobileNumber": "otp" }
// ✅ SEND OTP
router.post("/send-otp", (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  // Store OTP in memory
  otpStore[mobile] = otp;

  // TODO: Integrate with SMS service (Twilio, Fast2SMS, etc.)

  console.log(`OTP for ${mobile} is ${otp}`); // 👈 For testing only

  res.json({
    success: true,
    message: "OTP sent successfully",
    otp, // ⚠️ For testing only – remove in production
  });
});

router.post("/verify-otp", (req, res) => {
  const { mobile } = req.body;

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ message: "Invalid mobile number" });
  }

  if (!mobile || !otp) {
    return res.status(400).json({ message: "Mobile and OTP are required" });
  }

  const validOtp = otpStore[mobile];

  if (!validOtp || validOtp !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // Optionally clear the OTP after verification
  delete otpStore[mobile];
  res.json({ success: true, message: "OTP verified" });
});

// Login route
router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;

  try {
    // 1️⃣ Check if user exists
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2️⃣ Compare password with hashed one
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3️⃣ Generate JWT Token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "30d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Signup route
router.post("/signup", async (req, res) => {
  const { name, email, mobile, password, dob, gender, dlNo, aadharNo } =
    req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      dob,
      gender,
      dlNo,
      aadharNo,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
