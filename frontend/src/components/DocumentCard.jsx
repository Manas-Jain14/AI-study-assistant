import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

const statusColors = {
  processing: "text-accent bg-accent/15",
  done: "text-primary bg-primary/15",
  failed: "text-red-400 bg-red-400/15",
};

// One row in the "Recent Documents" list. Clicking it opens the Summary page.
function DocumentCard({ document }) {
  const navigate = useNavigate();

  const uploadedOn = new Date(document.upload_date).toLocaleDateString();

  return (
    <button
      onClick={() => navigate(`/summary/${document._id}`)}
      className="w-full flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 hover:border-primary transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <FileText size={18} className="text-textSecondary" />
        <div>
          <p className="text-textPrimary text-sm font-medium">{document.title}</p>
          <p className="text-textSecondary text-xs">Uploaded {uploadedOn}</p>
        </div>
      </div>
      <span
        className={`text-xs px-2.5 py-1 rounded-full capitalize ${
          statusColors[document.status] || statusColors.processing
        }`}
      >
        {document.status}
      </span>
    </button>
  );
}

export default DocumentCard;
