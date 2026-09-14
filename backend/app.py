import os
import json
import base64
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from google import genai
from google.genai import types


# =========================================================
# ENVIRONMENT
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)

ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path=ENV_FILE, override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash"
)

GEMINI_IMAGE_MODEL = os.getenv(
    "GEMINI_IMAGE_MODEL",
    "gemini-2.5-flash-image"
)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="SanskritiX API",
    version="0.4.0",
    description="AI-powered cultural heritage discovery and storytelling API."
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# GEMINI CLIENT
# =========================================================

client = None

if GEMINI_API_KEY:
    client = genai.Client(
        api_key=GEMINI_API_KEY
    )


# =========================================================
# PATHS
# =========================================================

FRONTEND_DIR = os.path.join(
    PROJECT_DIR,
    "frontend"
)

INDEX_FILE = os.path.join(
    FRONTEND_DIR,
    "index.html"
)


# =========================================================
# BASIC ROUTES
# =========================================================

@app.get("/")
def root():
    if os.path.exists(INDEX_FILE):
        return FileResponse(INDEX_FILE)

    return {
        "project": "SanskritiX",
        "message": "SanskritiX backend is running.",
        "gemini_configured": client is not None
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "gemini_configured": client is not None
    }


@app.get("/api/status")
def api_status():
    return {
        "status": "ok",
        "gemini_configured": client is not None,
        "gemini_model": GEMINI_MODEL,
        "gemini_image_model": GEMINI_IMAGE_MODEL
    }


# =========================================================
# FRONTEND FILE ROUTES
# =========================================================

@app.get("/discover.html")
def discover_page():
    return FileResponse(
        os.path.join(FRONTEND_DIR, "discover.html")
    )


@app.get("/memory.html")
def memory_page():
    return FileResponse(
        os.path.join(FRONTEND_DIR, "memory.html")
    )


@app.get("/styles.css")
def styles_css():
    return FileResponse(
        os.path.join(FRONTEND_DIR, "styles.css")
    )


@app.get("/discover.css")
def discover_css():
    return FileResponse(
        os.path.join(FRONTEND_DIR, "discover.css")
    )


@app.get("/discover.js")
def discover_js():
    return FileResponse(
        os.path.join(FRONTEND_DIR, "discover.js")
    )


@app.get("/script.js")
def script_js():
    return FileResponse(
        os.path.join(FRONTEND_DIR, "script.js")
    )


@app.get("/memory.js")
def memory_js():
    memory_file = os.path.join(
        FRONTEND_DIR,
        "memory.js"
    )

    if os.path.exists(memory_file):
        return FileResponse(memory_file)

    raise HTTPException(
        status_code=404,
        detail="memory.js not found."
    )


# =========================================================
# IMAGE VALIDATION
# =========================================================

ALLOWED_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif"
}

MAX_FILE_SIZE = 10 * 1024 * 1024


async def read_image(file: UploadFile):

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file has no detected image type."
        )

    content_type = file.content_type.lower()

    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, JPEG, PNG, WEBP, or GIF image."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty."
        )

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image size must be 10 MB or less."
        )

    return image_bytes, content_type


# =========================================================
# JSON HELPERS
# =========================================================

def clean_json_text(text: str) -> str:

    text = text.strip()

    if text.startswith("```"):

        lines = text.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]

        text = "\n".join(lines).strip()

        if text.lower().startswith("json"):
            text = text[4:].strip()

    return text


def parse_json_response(text: str):

    cleaned = clean_json_text(text)

    try:
        return json.loads(cleaned)

    except json.JSONDecodeError:

        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start != -1 and end != -1 and end > start:

            try:
                return json.loads(
                    cleaned[start:end + 1]
                )

            except json.JSONDecodeError:
                pass

    raise HTTPException(
        status_code=502,
        detail="Gemini returned an invalid structured response."
    )


# =========================================================
# ANALYZE HERITAGE PHOTOGRAPH
# =========================================================

@app.post("/api/analyze")
async def analyze_heritage(
    image: UploadFile = File(...)
):

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Check backend/.env."
        )

    image_bytes, content_type = await read_image(image)

    prompt = """
You are the cultural heritage analysis engine for SanskritiX,
an Indian cultural heritage discovery platform.

Analyze the uploaded photograph carefully.

The photograph may contain:
- monuments
- temples
- sculptures
- architecture
- streets
- crafts
- festivals
- cultural objects
- landscapes
- traditional clothing
- religious symbols

Identify the most likely cultural heritage location or subject.

IMPORTANT:

Do NOT blindly guess.

Use visible evidence such as:
- architecture
- inscriptions
- sculptures
- symbols
- religious iconography
- landscape
- clothing
- objects
- signs
- distinctive structures

If the exact place cannot be identified confidently,
say so clearly.

FACTUALITY RULES:

1. Do not invent historical facts.
2. Separate visible evidence from interpretation.
3. Do not claim certainty when the photograph does not support it.
4. Do not invent dates, rulers, dynasties, traditions, or events.
5. If something is uncertain, mention the uncertainty.
6. Keep historical storytelling grounded in the analysis.
7. Do not present legends as verified historical facts.
8. The result should be useful for a young person exploring Indian heritage.

Return ONLY valid JSON.

Use exactly this structure:

{
  "possible_place": "string",
  "confidence": 0.0,
  "summary": "short explanation",
  "visible_evidence": [
    "evidence 1",
    "evidence 2"
  ],
  "cultural_elements": [
    "element 1",
    "element 2"
  ],
  "cultural_context": "grounded cultural explanation",
  "history": "historical background when reasonably supported",
  "architecture": "architectural explanation",
  "significance": "cultural significance",
  "traditions": "relevant traditions when reasonably supported",
  "story": "short engaging heritage story grounded in available evidence",
  "story_disclaimer": "short disclaimer",
  "uncertainty": "what may be uncertain or should be verified",
  "facts": [
    "fact 1",
    "fact 2"
  ]
}

The confidence value must be between 0 and 1.

If the exact location cannot be determined,
use a cautious description instead of inventing a place.
"""

    try:

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=content_type
                ),
                prompt
            ]
        )

        text = response.text or ""

        result = parse_json_response(text)

        result.setdefault(
            "story_disclaimer",
            "Historical information should be verified with authoritative sources."
        )

        result.setdefault(
            "uncertainty",
            "AI identification may not always be certain."
        )

        return {
            "status": "success",
            **result
        }

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "Gemini analysis error:",
            repr(exc)
        )

        raise HTTPException(
            status_code=502,
            detail=f"Gemini analysis failed: {str(exc)}"
        )


# =========================================================
# HISTORICAL RECONSTRUCTION
# =========================================================

@app.post("/api/reconstruct")
async def reconstruct_history(

    image: UploadFile = File(...),

    possible_place: str = Form(
        "Unknown heritage location"
    ),

    cultural_context: str = Form(""),

    historical_context: str = Form("")
):

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Check backend/.env."
        )

    image_bytes, content_type = await read_image(image)

    prompt = f"""
Create an AI-assisted historical visualization inspired by this
heritage photograph.

Possible place:
{possible_place}

Cultural context:
{cultural_context}

Historical context:
{historical_context}

This image is an ARTISTIC HISTORICAL RECONSTRUCTION.

It is NOT a verified historical photograph.

Create a historically inspired scene that is meaningfully
different from the modern reference photograph.

Where historically plausible:

- remove modern vehicles
- remove modern electrical infrastructure
- remove modern security barriers
- remove modern advertisements
- remove modern signs
- reduce modern construction
- use historically inspired architecture
- use traditional stone paths or courtyards
- use historically plausible lamps
- use appropriate traditional flags or decorations
- use historically inspired clothing
- create a quieter traditional atmosphere

Preserve the recognizable cultural identity of the location
when the evidence supports it.

Do NOT create a generic fantasy temple.

Do NOT add:

- written labels
- captions
- watermarks
- logos
- modern advertisements
- text inside the image
- identifiable real people

The image should feel like a cinematic reconstruction
of how the place might have appeared in an earlier period.

Do not imply that every visual detail is historically verified.
"""

    try:

        response = client.models.generate_content(

            model=GEMINI_IMAGE_MODEL,

            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=content_type
                ),
                prompt
            ],

            config=types.GenerateContentConfig(
                response_modalities=[
                    "TEXT",
                    "IMAGE"
                ]
            )
        )

        image_base64: Optional[str] = None

        for candidate in response.candidates or []:

            content = candidate.content

            if not content:
                continue

            for part in content.parts or []:

                inline_data = getattr(
                    part,
                    "inline_data",
                    None
                )

                if inline_data and inline_data.data:

                    image_base64 = base64.b64encode(
                        inline_data.data
                    ).decode("utf-8")

                    break

            if image_base64:
                break

        if not image_base64:

            raise HTTPException(
                status_code=502,
                detail=(
                    "Gemini did not return a historical image. "
                    "Check the configured image model."
                )
            )

        return {
            "status": "success",
            "image_base64": image_base64,
            "disclaimer": (
                "AI-assisted historical visualization — "
                "artistic reconstruction, not a verified "
                "historical photograph."
            )
        }

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "Gemini historical reconstruction error:",
            repr(exc)
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Historical reconstruction failed: "
                f"{str(exc)}"
            )
        )


# =========================================================
# STATIC FRONTEND FALLBACK
# =========================================================

if os.path.isdir(FRONTEND_DIR):

    app.mount(
        "/frontend",
        StaticFiles(
            directory=FRONTEND_DIR
        ),
        name="frontend"
    )