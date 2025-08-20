const multer = require("multer");
const path = require("path");

// File storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save in uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  },
});

// Multer instance
const upload = multer({ storage });

module.exports = upload;
