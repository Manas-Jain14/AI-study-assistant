// Turns the simple markdown the AI agents are asked to produce (headings,
// bullets, numbered lists, **bold**) into React elements. Used by both the
// Summary page and the Ask Questions chat, including while text is still
// streaming in -- it just re-runs on the growing accumulated string each time.

function renderInline(line) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== "");
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="text-textPrimary">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

export function renderMarkdownLite(text) {
  const lines = text.split("\n");
  const elements = [];
  let listItems = [];
  let listType = null; // "ul" | "ol"

  function flushList() {
    if (listItems.length === 0) return;
    const ListTag = listType === "ol" ? "ol" : "ul";
    const listClass = listType === "ol" ? "list-decimal" : "list-disc";
    elements.push(
      <ListTag key={`list-${elements.length}`} className={`${listClass} ml-5 space-y-1 mb-3`}>
        {listItems}
      </ListTag>
    );
    listItems = [];
    listType = null;
  }

  lines.forEach((line, index) => {
    const numberedMatch = /^\d+\.\s+(.*)/.exec(line);

    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(<li key={index}>{renderInline(line.slice(2))}</li>);
      return;
    }

    if (numberedMatch) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(<li key={index}>{renderInline(numberedMatch[1])}</li>);
      return;
    }

    flushList();

    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={index} className="text-textPrimary font-semibold mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={index} className="text-textPrimary text-lg font-semibold mt-5 mb-2">
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={index} className="text-textPrimary text-xl font-bold mt-5 mb-2">
          {renderInline(line.slice(2))}
        </h2>
      );
    } else if (line.trim() !== "") {
      elements.push(
        <p key={index} className="text-textSecondary mb-2">
          {renderInline(line)}
        </p>
      );
    }
  });

  flushList();
  return elements;
}
