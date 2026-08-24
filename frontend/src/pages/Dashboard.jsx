import { useState, useEffect } from "react";
import { FileText, Layers, MessageCircle } from "lucide-react";
import api from "../api";
import StatCard from "../components/StatCard";
import DocumentCard from "../components/DocumentCard";

function Dashboard() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalFlashcards: 0,
    totalQuestions: 0,
  });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [statsRes, documentsRes] = await Promise.all([
        api.get("/api/stats"),
        api.get("/api/documents"),
      ]);
      setStats(statsRes.data);
      setDocuments(documentsRes.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={stats.totalDocuments}
          color="#3B82F6"
        />
        <StatCard
          icon={Layers}
          label="Total Flashcards"
          value={stats.totalFlashcards}
          color="#06B6D4"
        />
        <StatCard
          icon={MessageCircle}
          label="Total Questions"
          value={stats.totalQuestions}
          color="#3B82F6"
        />
      </div>

      <div>
        <h2 className="text-textPrimary text-base font-semibold mb-3">
          Recent Documents
        </h2>

        {loading && (
          <p className="text-textSecondary text-sm">Loading documents...</p>
        )}

        {!loading && documents.length === 0 && (
          <p className="text-textSecondary text-sm">
            No documents uploaded yet. Go to the Upload page to add your first PDF.
          </p>
        )}

        <div className="space-y-2">
          {documents.slice(0, 8).map((document) => (
            <DocumentCard key={document._id} document={document} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
