const mongoose = require("mongoose");

const EditProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // reference to User
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profileImage: { type: String }, // optional image URL or filename
  },
  { timestamps: true } // adds createdAt and updatedAt
);

module.exports = mongoose.model("EditProfile", EditProfileSchema);
