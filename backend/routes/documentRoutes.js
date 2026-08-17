const express = require("express");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const pdfParse = require("pdf-parse");
const fs = require("fs");

const Document = require("../models/Document");
const Flashcard = require("../models/Flashcard");
const Question = require("../models/Question");

const router = express.Router();

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL;

// Store uploaded PDFs in backend/uploads with a unique file name.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// POST /api/upload - upload a PDF and extract its text.
// The summary itself is generated separately (and streamed) by
// POST /api/documents/:id/summary, once the frontend has this document's id.
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.join(__dirname, "..", "uploads", req.file.filename);
    // new Uint8Array(...) makes a standalone copy instead of a view into Node's
    // shared Buffer pool -- pdf-parse's bundled pdf.js reads the pool slice
    // incorrectly otherwise, which throws "bad XRef entry" on some files.
    const fileBuffer = new Uint8Array(fs.readFileSync(filePath));
    const pdfData = await pdfParse(fileBuffer);

    const newDocument = await Document.create({
      title: req.file.originalname.replace(".pdf", ""),
      file_name: req.file.filename,
      extracted_text: pdfData.text,
      status: "processing",
    });

    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ error: "Failed to process document" });
  }
});

// POST /api/documents/:id/summary - stream a freshly generated summary for a
// document back to the client as plain text, then save the full text once done.
router.post("/documents/:id/summary", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    if (!document.extracted_text) {
      return res.status(400).json({
        error: "This document has no extracted text yet -- try re-uploading the PDF.",
      });
    }

    const pythonResponse = await axios.post(
      `${PYTHON_SERVICE_URL}/process-pdf`,
      { text: document.extracted_text },
      { responseType: "stream" }
    );

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    let fullSummary = "";
    pythonResponse.data.on("data", (chunk) => {
      fullSummary += chunk.toString();
      res.write(chunk);
    });

    pythonResponse.data.on("end", async () => {
      document.summary = fullSummary;
      document.status = "done";
      await document.save();
      res.end();
    });

    pythonResponse.data.on("error", (streamError) => {
      console.error("Summary stream error:", streamError.message);
      res.end();
    });
  } catch (error) {
    console.error("Summary generation error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// GET /api/documents - list all documents (most recent first)
router.get("/documents", async (req, res) => {
  try {
    const documents = await Document.find().sort({ upload_date: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// GET /api/documents/:id - get a single document (used by the Summary page)
router.get("/documents/:id", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// POST /api/flashcards/:documentId - generate flashcards for a document
router.post("/flashcards/:documentId", async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Without this check, a document whose upload never finished (extracted_text
    // is undefined) would send an incomplete payload to FastAPI and get back a
    // confusing 422 instead of a clear message here.
    if (!document.extracted_text) {
      return res.status(400).json({
        error:
          "This document has no extracted text yet. It may still be processing, or its upload failed -- try re-uploading the PDF.",
      });
    }

    const aiResponse = await axios.post(
      `${PYTHON_SERVICE_URL}/generate-flashcards`,
      { text: document.extracted_text }
    );

    // Replace any previously generated flashcards for this document.
    await Flashcard.deleteMany({ document_id: document._id });

    const flashcardsToInsert = aiResponse.data.flashcards.map((card) => ({
      document_id: document._id,
      question: card.question,
      answer: card.answer,
    }));

    const savedFlashcards = await Flashcard.insertMany(flashcardsToInsert);
    res.status(201).json(savedFlashcards);
  } catch (error) {
    console.error("Flashcard generation error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

// GET /api/flashcards/:documentId - fetch existing flashcards for a document
router.get("/flashcards/:documentId", async (req, res) => {
  try {
    const flashcards = await Flashcard.find({
      document_id: req.params.documentId,
    });
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch flashcards" });
  }
});

// GET /api/stats - counts used by the Dashboard and Analytics pages
router.get("/stats", async (req, res) => {
  try {
    const totalDocuments = await Document.countDocuments();
    const totalFlashcards = await Flashcard.countDocuments();
    const totalQuestions = await Question.countDocuments();
    res.json({ totalDocuments, totalFlashcards, totalQuestions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;
