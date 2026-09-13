"""
SanskritiX image-analysis API.

Uploads are used in memory only. Gemini analysis carefully separates visible
evidence, a possible identification, and AI-generated cultural context.
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Annotated, Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types


logger = logging.getLogger(__name__)

# backend/.env stays local and is ignored by Git. No key is in source code.
load_dotenv(Path(__file__).with_name(".env"))

app = FastAPI(
    title="SanskritiX API",
    description="Local API for careful cultural heritage photo discovery.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
DEFAULT_MODEL = "gemini-3.6-flash"

ANALYSIS_PROMPT = """
You are a careful assistant for SanskritiX, an Indian cultural heritage discovery
project. Analyze the supplied image conservatively.

Return only valid JSON with exactly these fields:
{
  "visible_evidence": ["specific things visibly present in the image"],
  "possible_place": "specific place and state, or null",
  "confidence": 0.0,
  "cultural_elements": ["visual cultural or architectural features"],
  "cultural_context": "brief, cautious interpretation or null",
  "story": "short AI-generated cultural context, clearly cautious, or null",
  "uncertainty": "what the image does not establish and why"
}

Rules:
- First report only what is visibly present. Do not describe details you cannot see.
- Name a specific location only when distinctive visual evidence strongly supports it.
- If evidence is insufficient, ambiguous, blurry, or generic, set possible_place to
  null and confidence to 0.0. Explain the limitation in uncertainty.
- Do not turn a possible identification into a fact.
- Cultural context and story are AI-generated interpretations, not verified history.
- Never invent dates, rulers, legends, inscriptions, or historical events.
- confidence must be a number from 0.0 to 1.0.
"""


def get_extension(filename: str | None) -> str:
    """Return a lower-case extension, or an empty string when one is missing."""
    if not filename or "." not in filename:
        return ""
    return f".{filename.rsplit('.', 1)[-1].lower()}"


def unavailable_response(message: str) -> dict[str, Any]:
    """Keep the response shape predictable whenever analysis cannot run."""
    return {
        "status": "unavailable",
        "message": message,
        "visible_evidence": [],
        "possible_place": None,
        "confidence": None,
        "cultural_elements": [],
        "cultural_context": None,
        "story": None,
        "uncertainty": message,
        "story_disclaimer": "No AI-generated cultural context is available.",
    }


def clean_analysis(data: Any) -> dict[str, Any]:
    """Validate Gemini JSON before returning it to the frontend."""
    if not isinstance(data, dict):
        raise ValueError("Gemini did not return a JSON object.")

    def text_or_none(value: Any) -> str | None:
        return value.strip() if isinstance(value, str) and value.strip() else None

    def string_list(value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]

    possible_place = text_or_none(data.get("possible_place"))
    confidence = data.get("confidence")
    if not isinstance(confidence, (int, float)) or isinstance(confidence, bool):
        confidence = None
    elif not 0 <= confidence <= 1:
        confidence = None

    uncertainty = text_or_none(data.get("uncertainty"))
    if possible_place is None and not uncertainty:
        uncertainty = "The image does not provide enough distinctive visual evidence for a specific place."

    return {
        "status": "success",
        "message": "Image analyzed by Gemini. Treat possible locations as tentative.",
        "visible_evidence": string_list(data.get("visible_evidence")),
        "possible_place": possible_place,
        "confidence": confidence,
        "cultural_elements": string_list(data.get("cultural_elements")),
        "cultural_context": text_or_none(data.get("cultural_context")),
        "story": text_or_none(data.get("story")),
        "uncertainty": uncertainty,
        "story_disclaimer": "AI-generated cultural context, not verified historical fact.",
    }


def request_gemini_analysis(image_bytes: bytes, mime_type: str) -> dict[str, Any]:
    """Send in-memory image bytes to Gemini; no local file is created."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Gemini is not configured. Add GEMINI_API_KEY to backend/.env and restart the server."
        )

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL", DEFAULT_MODEL),
        contents=[
            ANALYSIS_PROMPT,
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )
    if not response.text:
        raise ValueError("Gemini returned an empty analysis.")
    return clean_analysis(json.loads(response.text))


@app.get("/")
def health_check() -> dict[str, str]:
    """Confirm that the local API is running."""
    return {"status": "online", "message": "SanskritiX API is running"}


@app.post("/api/analyze")
async def analyze_image(
    image: Annotated[UploadFile, File(description="A JPG, JPEG, PNG, or WEBP image")]
) -> dict[str, Any]:
    """Validate an upload, then ask Gemini for cautious cultural-heritage context."""
    file_extension = get_extension(image.filename)
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.",
        )
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file extension. Please use .jpg, .jpeg, .png, or .webp.",
        )

    # Read the upload only in memory; nothing is stored permanently.
    image_bytes = await image.read()
    await image.close()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Please upload an image smaller than 10 MB.",
        )

    try:
        # The Google SDK is synchronous, so keep FastAPI's event loop responsive.
        return await asyncio.to_thread(
            request_gemini_analysis, image_bytes, image.content_type
        )
    except RuntimeError as error:
        # A missing local key is a setup issue, not an identification result.
        logger.exception("Gemini analysis failed (%s): %s", type(error).__name__, error)
        return unavailable_response(str(error))
    except (ValueError, json.JSONDecodeError) as error:
        logger.exception("Gemini analysis failed (%s): %s", type(error).__name__, error)
        return unavailable_response(
            "Gemini returned an unreadable analysis. Please try another photograph."
        )
    except Exception as error:
        # Never expose provider internals or credentials in a response.
        logger.exception("Gemini analysis failed (%s): %s", type(error).__name__, error)
        return unavailable_response(
            "The AI analysis service is temporarily unavailable. Please try again shortly."
        )
