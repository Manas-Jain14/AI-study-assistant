"""
FastAPI service that exposes the PydanticAI agents over REST.
Only the Node.js backend is expected to call this service.
"""

from typing import List

from dotenv import load_dotenv

# Must run before importing agents -- agents.py creates the PydanticAI Agent
# objects at import time, and they need GEMINI_API_KEY already in the environment.
load_dotenv()

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agents import summary_agent, flashcard_agent, qa_agent, Flashcard

app = FastAPI(title="AI Study Assistant - AI Service")

# Gemini has a context limit, so very long notes are trimmed before being sent.
MAX_CHARS = 20000


class ProcessPdfRequest(BaseModel):
    # min_length=1 rejects an empty string with a clear message instead of
    # silently calling Gemini with nothing.
    text: str = Field(..., min_length=1)


class FlashcardRequest(BaseModel):
    text: str = Field(..., min_length=1)


class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]


class AskQuestionRequest(BaseModel):
    text: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)


@app.get("/")
def root():
    return {"message": "AI Study Assistant AI Service is running"}


@app.post("/process-pdf")
async def process_pdf(request: ProcessPdfRequest):
    """Streams the summary back as plain text chunks, as Gemini generates them."""
    notes = request.text[:MAX_CHARS]

    async def generate_chunks():
        try:
            async with summary_agent.run_stream(notes) as result:
                async for chunk in result.stream_text(delta=True):
                    yield chunk
        except Exception as error:
            yield f"\n\n[Error generating summary: {error}]"

    return StreamingResponse(generate_chunks(), media_type="text/plain")


@app.post("/generate-flashcards", response_model=FlashcardResponse)
async def generate_flashcards(request: FlashcardRequest):
    notes = request.text[:MAX_CHARS]
    result = await flashcard_agent.run(notes)
    return FlashcardResponse(flashcards=result.output.flashcards)


@app.post("/ask-question")
async def ask_question(request: AskQuestionRequest):
    """Streams the answer back as plain text chunks, as Gemini generates them."""
    notes = request.text[:MAX_CHARS]
    prompt = f"Study notes:\n{notes}\n\nQuestion: {request.question}"

    async def generate_chunks():
        try:
            async with qa_agent.run_stream(prompt) as result:
                async for chunk in result.stream_text(delta=True):
                    yield chunk
        except Exception as error:
            yield f"\n\n[Error generating answer: {error}]"

    return StreamingResponse(generate_chunks(), media_type="text/plain")
