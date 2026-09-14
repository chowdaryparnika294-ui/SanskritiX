# SanskritiX

SanskritiX is an AI-powered cultural heritage discovery and storytelling platform for Smart India Hackathon 2026.

This first version is a responsive static frontend with a local FastAPI backend. It includes a landing page, an interactive local photo-preview experience, and Gemini-powered image analysis for careful cultural-heritage discovery.

## Structure

```
frontend/  Website files
backend/   FastAPI foundation and local backend setup
data/      Local sample heritage data
assets/    Reserved for future original media
```

## Run locally

No installation is needed.

1. Open `frontend/index.html` in a web browser.
2. Select **Begin exploring** or **Explore heritage** to open the Discover page.
3. Drop an image onto the upload area (or choose one from your computer). The preview is displayed only in your browser; no file is uploaded or saved.

You may optionally use VS Code's Live Server extension while developing.

## Run the backend locally

Install Python 3.10 or newer, then run the following from the SanskritiX project root:

    python --version
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r backend/requirements.txt
    uvicorn app:app --reload --app-dir backend

If PowerShell prevents activation, run the following once for the current terminal before activating the virtual environment:

    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

The API will run at http://127.0.0.1:8000. Open http://127.0.0.1:8000/docs to test it interactively.

### API endpoint

POST /api/analyze

Send the image in a form-data field named image. It accepts JPG, JPEG, PNG, and WEBP files up to 10 MB. The endpoint sends the image to Gemini for cautious analysis and returns visible evidence, a possible place (or null), confidence, cultural elements/context, a short story preview, a detailed story, history, architecture, cultural significance, traditions, interesting facts, and uncertainty. Stories are AI-generated cultural context, not verified historical fact.

### Gemini key safety

Copy backend/.env.example to backend/.env and replace only GEMINI_API_KEY with your real Gemini API key. You may also change GEMINI_MODEL there if needed. The .env file must remain local: never commit it, paste the key into source code, or expose it to the frontend. After changing .env, restart the backend.

## Next steps

Connect the existing Discover page to the API response, then add a verified heritage knowledge layer and saved memories.
