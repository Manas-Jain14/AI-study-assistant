import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../api";

function Analytics() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalFlashcards: 0,
    totalQuestions: 0,
  });

  useEffect(() => {
    api.get("/api/stats").then((res) => setStats(res.data));
  }, []);

  // One series (counts), so every bar uses the same color -- the x-axis
  // labels already identify each category, no legend needed.
  const chartData = [
    { name: "Documents Uploaded", value: stats.totalDocuments },
    { name: "Flashcards Generated", value: stats.totalFlashcards },
    { name: "Questions Asked", value: stats.totalQuestions },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-textPrimary text-base font-semibold mb-6">
        Activity Overview
      </h2>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={13} tickLine={false} />
          <YAxis stroke="#94A3B8" fontSize={13} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#F8FAFC",
            }}
            cursor={{ fill: "#334155", opacity: 0.3 }}
          />
          <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Analytics;
