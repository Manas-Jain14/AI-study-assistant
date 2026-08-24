import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import api from "../api";

function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  function handleDrag(event, active) {
    event.preventDefault();
    setDragActive(active);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) uploadFile(file);
  }

  async function uploadFile(file) {
    if (file.type !== "application/pdf") {
      setStatusText("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setStatusText("Uploading PDF...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
          if (percent === 100) {
            setStatusText("Extracting text...");
          }
        },
      });

      // The summary itself is generated (and streamed) on the Summary page.
      navigate(`/summary/${response.data._id}`);
    } catch (error) {
      console.error("Upload failed:", error);
      setStatusText("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div
        onDragOver={(e) => handleDrag(e, true)}
        onDragLeave={(e) => handleDrag(e, false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl py-16 flex flex-col items-center justify-center text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <UploadCloud size={40} className="text-primary mb-4" />
        <p className="text-textPrimary font-medium mb-1">
          Drag & drop a PDF here
        </p>
        <p className="text-textSecondary text-sm mb-4">or click to browse</p>

        <label className="cursor-pointer bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Choose File
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {isUploading && (
        <div className="w-full bg-card border border-border rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {statusText && (
        <p className="text-textSecondary text-sm text-center">{statusText}</p>
      )}
    </div>
  );
}

export default Upload;
