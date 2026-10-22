import { useState, useEffect } from "react";

// A single flip-able flashcard. Click anywhere on the card to flip it.
function FlashcardView({ card }) {
  const [flipped, setFlipped] = useState(false);

  // Reset to the question side whenever a new card is shown.
  useEffect(() => {
    setFlipped(false);
  }, [card]);

  return (
    <div
      className="flip-card w-full max-w-xl h-72 cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`flip-card-inner ${flipped ? "flipped" : ""}`}>
        <div className="flip-card-front bg-card border border-border rounded-2xl p-8 text-center">
          <div>
            <p className="text-textSecondary text-xs uppercase tracking-wide mb-3">
              Question
            </p>
            <p className="text-textPrimary text-xl font-medium">{card.question}</p>
          </div>
        </div>
        <div className="flip-card-back bg-primary/10 border border-primary rounded-2xl p-8 text-center">
          <div>
            <p className="text-accent text-xs uppercase tracking-wide mb-3">
              Answer
            </p>
            <p className="text-textPrimary text-xl font-medium">{card.answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashcardView;
