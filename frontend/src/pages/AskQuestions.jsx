import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Send } from "lucide-react";
import api, { streamPost } from "../api";
import ChatBubble from "../components/ChatBubble";

function AskQuestions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const documentId = searchParams.get("documentId") || "";

  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get("/api/documents").then((res) => setDocuments(res.data));
  }, []);

  // Load previous Q&A history for the selected document.
  useEffect(() => {
    if (!documentId) {
      setMessages([]);
      return;
    }
    api.get(`/api/questions/${documentId}`).then((res) => {
      const history = res.data.flatMap((item) => [
        { role: "user", text: item.question },
        { role: "ai", text: item.answer },
      ]);
      setMessages(history);
    });
  }, [documentId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectDocument(id) {
    setSearchParams({ documentId: id });
  }

  async function handleAsk(event) {
    event.preventDefault();
    if (!question.trim() || asking) return;

    const askedQuestion = question;
    // Add the question and an empty AI bubble that grows as chunks stream in.
    setMessages((prev) => [
      ...prev,
      { role: "user", text: askedQuestion },
      { role: "ai", text: "" },
    ]);
    setQuestion("");
    setAsking(true);

    function appendToLastMessage(chunk) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, text: last.text + chunk };
        return updated;
      });
    }

    try {
      await streamPost("/api/ask", { documentId, question: askedQuestion }, appendToLastMessage);
    } catch (error) {
      console.error("Failed to get answer:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          text: "Sorry, something went wrong answering that.",
        };
        return updated;
      });
    } finally {
      setAsking(false);
    }
  }

  if (!documentId) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-textSecondary text-sm mb-4">
          Choose a document to ask questions about:
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
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <p className="text-textSecondary text-sm">
            Ask anything about this document's notes.
          </p>
        )}
        {messages.map((message, index) => (
          <ChatBubble
            key={index}
            role={message.role}
            text={message.text}
            isStreaming={asking && index === messages.length - 1}
          />
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleAsk} className="flex items-center gap-2 pt-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this document..."
          className="flex-1 bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={asking}
          className="flex items-center justify-center bg-primary hover:bg-primary/90 disabled:opacity-60 text-white p-2.5 rounded-lg transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default AskQuestions;
