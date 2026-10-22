import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Layers,
  MessageCircle,
  BarChart3,
  GraduationCap,
} from "lucide-react";

// Left navigation shown on every page.
const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: UploadCloud },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/ask", label: "Ask Questions", icon: MessageCircle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <GraduationCap className="text-primary" size={26} />
        <span className="text-textPrimary font-semibold text-lg">
          Study Assistant
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-textSecondary hover:bg-card hover:text-textPrimary"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
