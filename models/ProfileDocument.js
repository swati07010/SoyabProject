const mongoose = require("mongoose");

const ProfileDocumentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  aadhaarFront: { type: String },
  aadhaarBack: { type: String },
  idFront: { type: String },
  idBack: { type: String },
  licenseOrProof: { type: String },
  address: { type: String },
});

module.exports = mongoose.model("ProfileDocument", ProfileDocumentSchema);
