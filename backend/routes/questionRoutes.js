const express = require("express");
const axios = require("axios");

const Document = require("../models/Document");
const Question = require("../models/Question");

const router = express.Router();

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL;

// POST /api/ask - ask a question about a document's content.
// Streams the answer back as plain text, then saves the full Q&A pair once done.
router.post("/ask", async (req, res) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({ error: "documentId and question are required" });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // An unprocessed document has no extracted_text, which would otherwise
    // reach FastAPI as an incomplete payload.
    if (!document.extracted_text) {
      return res.status(400).json({
        error:
          "This document has no extracted text yet. It may still be processing, or its upload failed -- try re-uploading the PDF.",
      });
    }

    const pythonResponse = await axios.post(
      `${PYTHON_SERVICE_URL}/ask-question`,
      { text: document.extracted_text, question },
      { responseType: "stream" }
    );

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    let fullAnswer = "";
    pythonResponse.data.on("data", (chunk) => {
      fullAnswer += chunk.toString();
      res.write(chunk);
    });

    pythonResponse.data.on("end", async () => {
      await Question.create({
        document_id: document._id,
        question,
        answer: fullAnswer,
      });
      res.end();
    });

    pythonResponse.data.on("error", (streamError) => {
      console.error("Ask stream error:", streamError.message);
      res.end();
    });
  } catch (error) {
    console.error("Ask question error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

// GET /api/questions/:documentId - chat history for a document
router.get("/questions/:documentId", async (req, res) => {
  try {
    const questions = await Question.find({
      document_id: req.params.documentId,
    }).sort({ created_at: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

module.exports = router;
