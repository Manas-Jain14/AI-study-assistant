import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layers, MessageCircle } from "lucide-react";
import api, { streamPost } from "../api";
import { renderMarkdownLite } from "../markdown";

function Summary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [summaryText, setSummaryText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState("");
  const hasStartedStream = useRef(false);

  useEffect(() => {
    loadDocument();
  }, [id]);

  async function loadDocument() {
    try {
      const response = await api.get(`/api/documents/${id}`);
      setDocument(response.data);

      if (response.data.status === "done") {
        setSummaryText(response.data.summary);
      } else if (response.data.status === "processing" && !hasStartedStream.current) {
        // Guard against React StrictMode running effects twice in dev, which
        // would otherwise fire two parallel (and costly) Gemini requests.
        hasStartedStream.current = true;
        streamSummary();
      }
    } catch (error) {
      console.error("Failed to load document:", error);
    } finally {
      setLoading(false);
    }
  }

  async function streamSummary() {
    setIsStreaming(true);
    setSummaryText("");
    try {
      await streamPost(`/api/documents/${id}/summary`, null, (chunk) => {
        setSummaryText((previous) => previous + chunk);
      });
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setStreamError("Something went wrong while generating the summary.");
    } finally {
      setIsStreaming(false);
    }
  }

  if (loading) {
    return <p className="text-textSecondary text-sm">Loading summary...</p>;
  }

  if (!document) {
    return <p className="text-textSecondary text-sm">Document not found.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-textPrimary text-xl font-semibold">{document.title}</h2>
        <p className="text-textSecondary text-sm">
          Uploaded {new Date(document.upload_date).toLocaleDateString()}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {streamError && <p className="text-red-400 text-sm mb-3">{streamError}</p>}

        {summaryText && renderMarkdownLite(summaryText)}

        {/* Blinking cursor while the summary is still streaming in. */}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
        )}

        {!summaryText && !isStreaming && !streamError && (
          <p className="text-textSecondary text-sm">Preparing summary...</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/flashcards?documentId=${document._id}`)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Layers size={16} />
          Generate Flashcards
        </button>
        <button
          onClick={() => navigate(`/ask?documentId=${document._id}`)}
          className="flex items-center gap-2 bg-card border border-border hover:border-primary text-textPrimary text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <MessageCircle size={16} />
          Ask Questions
        </button>
      </div>
    </div>
  );
}

export default Summary;
