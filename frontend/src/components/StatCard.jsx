import { motion } from "framer-motion";

// Small metric card used on the Dashboard (Total Documents, Flashcards, Questions).
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}22` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-textSecondary text-sm">{label}</p>
        <p className="text-textPrimary text-2xl font-semibold">{value}</p>
      </div>
    </motion.div>
  );
}

export default StatCard;
