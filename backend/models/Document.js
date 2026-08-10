const mongoose = require("mongoose");

// Represents one uploaded PDF and everything generated from it.
// extracted_text and status are extra fields beyond the base schema (title, file_name,
// upload_date, summary) -- extracted_text lets flashcards/Q&A reuse the PDF text without
// re-parsing the file, and status drives the "processing" indicator on the Upload page.
const documentSchema = new mongoose.Schema({
  title: String,
  file_name: String,
  extracted_text: String,
  summary: String,
  status: {
    type: String,
    enum: ["processing", "done", "failed"],
    default: "processing",
  },
  upload_date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Document", documentSchema);
