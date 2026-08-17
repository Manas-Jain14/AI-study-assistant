import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Summary from "./pages/Summary";
import Flashcards from "./pages/Flashcards";
import AskQuestions from "./pages/AskQuestions";
import Analytics from "./pages/Analytics";

const pageTitles = {
  "/": "Dashboard",
  "/upload": "Upload Notes",
  "/flashcards": "Flashcards",
  "/ask": "Ask Questions",
  "/analytics": "Analytics",
};

function App() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Summary";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/summary/:id" element={<Summary />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/ask" element={<AskQuestions />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
