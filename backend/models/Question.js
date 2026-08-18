const mongoose = require("mongoose");

// One question a student asked about a document, and the AI's answer.
const questionSchema = new mongoose.Schema({
  document_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
  },
  question: String,
  answer: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Question", questionSchema);
