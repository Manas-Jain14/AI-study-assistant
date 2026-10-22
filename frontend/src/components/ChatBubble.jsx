import { User, Bot } from "lucide-react";
import { renderMarkdownLite } from "../markdown";

// One message bubble in the Ask Questions chat -- either the student's question
// or the AI's answer, styled differently based on `role`. AI answers are rendered
// as markdown (headings/bullets/bold) since the agent replies in that format.
function ChatBubble({ role, text, isStreaming }) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={`max-w-lg rounded-xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-white"
            : "bg-card border border-border text-textPrimary"
        }`}
      >
        {isUser ? (
          text
        ) : (
          <>
            {text ? renderMarkdownLite(text) : null}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-accent ml-0.5 animate-pulse align-middle" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ChatBubble;
