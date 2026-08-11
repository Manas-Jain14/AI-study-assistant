const mongoose = require("mongoose");

// One question/answer flashcard, linked to the document it was generated from.
const flashcardSchema = new mongoose.Schema({
  document_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
  },
  question: String,
  answer: String,
});

module.exports = mongoose.model("Flashcard", flashcardSchema);
