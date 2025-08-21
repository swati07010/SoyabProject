// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("../config/storage"); // Import multer instance
const ProfileDocument = require("../models/ProfileDocument");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_jwt_secret";
const EditProfile = require("../models/EditProfile");
const authMiddleware = require("../middleware/authMiddleware");

// Single file upload (profile image)
// router.post("/upload-profile", multer.single("profileImg"), (req, res) => {
//   try {
//     // req.file will contain the uploaded file info
//     res.json({
//       success: true,
//       message: "File uploaded successfully",
//       file: req.file,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// GET  → fetch profile
router.get("/edit-profile", authMiddleware, async (req, res) => {
  try {
    const user = req.user; // now req.user is defined
    const profile = await EditProfile.findOne({ user: user._id }).select(
      "name email profileImage"
    );

    const profileData = {
      mobile: user.mobile,
      name: profile?.name || "",
      email: profile?.email || user.email,
      profileImage: profile?.profileImage || "",
    };

    res.status(200).json({ success: true, data: profileData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST update profile
router.put("/edit-profile", authMiddleware, async (req, res) => {
  const { name, email, profileImage, newMobile, otp } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Mobile update with in-memory OTP verification
    if (newMobile && newMobile !== user.mobile) {
      const validOtp = otpStore[newMobile];
      if (!otp || otp !== validOtp) {
        return res
          .status(400)
          .json({ message: "Invalid or expired OTP for new mobile" });
      }
      user.mobile = newMobile;
      delete otpStore[newMobile];
      await user.save();
    }

    // Update user profile fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    // Update or create EditProfile document
    let profile = await EditProfile.findOne({ user: user._id });
    if (profile) {
      profile.name = user.name;
      profile.email = user.email;
      profile.profileImage = user.profileImage;
      profile.mobile = user.mobile; // updated mobile
      await profile.save();
    } else {
      profile = new EditProfile({
        user: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        mobile: user.mobile,
      });
      await profile.save();
    }

    res
      .status(200)
      .json({ message: "Profile updated successfully", data: profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/send-otp", authMiddleware, (req, res) => {
  const { mobile } = req.body;
  if (!mobile)
    return res.status(400).json({ message: "Mobile number required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[mobile] = otp;

  // expire OTP after 5 mins
  setTimeout(() => delete otpStore[mobile], 5 * 60 * 1000);

  console.log(`OTP for ${mobile}: ${otp}`);
  res.status(200).json({ message: "OTP sent", otp }); // only for testing
});

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

router.post("/signup", async (req, res) => {
  const { name, email, mobile, password, dob, gender, dlNo, aadharNo } =
    req.body;

  try {
    // Check if email or mobile already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      } else {
        return res
          .status(400)
          .json({ message: "Mobile number already exists" });
      }
    }

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
    // Handle duplicate key error from MongoDB
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Email or mobile already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
