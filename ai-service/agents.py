"""
PydanticAI agents for the AI Study Assistant.

Three simple, independent agents -- no orchestration between them:
1. summary_agent   -> turns raw notes text into a study summary
2. flashcard_agent  -> turns raw notes text into a list of Q&A flashcards
3. qa_agent         -> answers a question using only the given notes text
"""

from typing import List

from pydantic import BaseModel
from pydantic_ai import Agent

# google:gemini-flash-latest reads the GEMINI_API_KEY environment variable automatically.
GEMINI_MODEL = "google:gemini-flash-latest"


class Flashcard(BaseModel):
    question: str
    answer: str


class FlashcardSet(BaseModel):
    flashcards: List[Flashcard]


# Shared formatting rules so summaries and Q&A answers both read like clean,
# student-friendly notes instead of one long paragraph.
FORMATTING_RULES = (
    "Format your answer as well-structured markdown, never as one long paragraph:\n"
    "- Break the content into sections using ## headings when it covers more than one topic.\n"
    "- Use '- ' bullet points for lists of facts, and numbered '1. ' lists for steps or sequences.\n"
    "- Keep each bullet concise (one short line where possible).\n"
    "- Never write more than 3-4 lines of continuous prose before breaking into bullets or a new heading.\n"
    "- Use **bold** for key terms.\n"
    "- Leave one blank line between sections.\n"
    "- Group related concepts under the same heading.\n"
    "- If the content covers multiple topics, end with a '## Quick Revision' section containing "
    "5 to 10 short revision bullet points.\n"
    "- For a short, single-fact question, a brief 1-3 line answer is fine -- don't force headings "
    "or a Quick Revision section onto something that doesn't need it."
)

summary_agent = Agent(
    GEMINI_MODEL,
    output_type=str,
    system_prompt=(
        "You are a study assistant. Read the given study notes and write a clear, "
        "well-organized educational summary that a student can revise from quickly.\n\n"
        + FORMATTING_RULES
    ),
)

flashcard_agent = Agent(
    GEMINI_MODEL,
    output_type=FlashcardSet,
    system_prompt=(
        "You are a study assistant. Read the given study notes and generate 10 to 15 "
        "flashcards to help a student revise. Each flashcard needs a short, clear "
        "question and a concise, correct answer based only on the notes."
    ),
)

qa_agent = Agent(
    GEMINI_MODEL,
    output_type=str,
    system_prompt=(
        "You are a study assistant. Answer the student's question using ONLY the study "
        "notes provided as context. If the answer is not in the notes, say so honestly "
        "instead of making something up.\n\n"
        "Broad questions -- like 'what should I study', 'important topics', 'exam preparation', "
        "'summary', 'explain this chapter', or 'key concepts' -- need the full structured "
        "treatment below. A short, specific factual question just needs a short, direct answer.\n\n"
        + FORMATTING_RULES
    ),
)
