import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import api from "../api";
import FlashcardView from "../components/FlashcardView";

function Flashcards() {
  const [searchParams, setSearchParams] = useSearchParams();
  const documentId = searchParams.get("documentId") || "";

  const [documents, setDocuments] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load the document list once, so the student can pick which notes to study.
  useEffect(() => {
    api.get("/api/documents").then((res) => setDocuments(res.data));
  }, []);

  // Whenever the selected document changes, load its existing flashcards.
  useEffect(() => {
    if (!documentId) {
      setFlashcards([]);
      return;
    }
    setLoading(true);
    setCurrentIndex(0);
    api
      .get(`/api/flashcards/${documentId}`)
      .then((res) => setFlashcards(res.data))
      .finally(() => setLoading(false));
  }, [documentId]);

  function selectDocument(id) {
    setSearchParams({ documentId: id });
  }

  async function generateFlashcards() {
    setGenerating(true);
    try {
      const response = await api.post(`/api/flashcards/${documentId}`);
      setFlashcards(response.data);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
    } finally {
      setGenerating(false);
    }
  }

  function goToPrevious() {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function goToNext() {
    setCurrentIndex((index) => Math.min(flashcards.length - 1, index + 1));
  }

  if (!documentId) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-textSecondary text-sm mb-4">
          Choose a document to study flashcards from:
        </p>
        <div className="space-y-2">
          {documents.map((document) => (
            <button
              key={document._id}
              onClick={() => selectDocument(document._id)}
              className="w-full text-left bg-card border border-border hover:border-primary rounded-lg px-4 py-3 text-textPrimary text-sm transition-colors"
            >
              {document.title}
            </button>
          ))}
          {documents.length === 0 && (
            <p className="text-textSecondary text-sm">
              No documents yet. Upload a PDF first.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center">
      {loading && <p className="text-textSecondary text-sm">Loading flashcards...</p>}

      {!loading && flashcards.length === 0 && (
        <div className="text-center">
          <p className="text-textSecondary text-sm mb-4">
            No flashcards yet for this document.
          </p>
          <button
            onClick={generateFlashcards}
            disabled={generating}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors mx-auto"
          >
            <Sparkles size={16} />
            {generating ? "Generating..." : "Generate Flashcards"}
          </button>
        </div>
      )}

      {!loading && flashcards.length > 0 && (
        <>
          <p className="text-textSecondary text-sm mb-4">
            Card {currentIndex + 1} of {flashcards.length}
          </p>

          <FlashcardView card={flashcards[currentIndex]} />

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 bg-card border border-border hover:border-primary disabled:opacity-40 text-textPrimary text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === flashcards.length - 1}
              className="flex items-center gap-1 bg-card border border-border hover:border-primary disabled:opacity-40 text-textPrimary text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Flashcards;
