## Bremi.Ai – Mental Health Companion (Local Setup Guide)

Bremi.Ai is a culturally aware mental‑health companion for Nigerians, built as a **React (Vite) frontend** plus a **FastAPI backend** (“memory service”) that does deeper risk analysis and follow‑ups.

This guide explains:
- **Project structure**
- **Dependencies**
- **Environment variables**
- **How to run the app locally (frontend + backend)**
- **How to avoid a blank page when offline fonts/CDNs are blocked**

---

### 1. Project structure

Top‑level folders/files:

- `App.tsx` – main React app shell (routes between onboarding, chat, relax tools, history, profile, emergency).
- `components/` – all major UI components:
  - `ChatInterface.tsx` – main chat experience with Bremi, TTS, analysis, wiki links.
  - `Relaxation.tsx` – calming tools hub (breathing, grounding, body scan, progressive muscle relaxation, safe place, self‑compassion) with guided voice.
  - `Emergency.tsx` – crisis support and helplines.
  - `ChatHistory.tsx`, `UserProfile.tsx`, `Navigation.tsx`, `Onboarding.tsx`, etc.
- `contexts/` – `UserContext`, `SessionContext` for auth/profile and chat sessions.
- `services/` – browser‑side service layer:
  - `geminiService.ts` – calls Gemini for chat, analysis, TTS, and wiki generation.
  - `apiService.ts` – calls the Python `analysis_service` for background sync/risk analysis.
- `analysis_service/` – Python backend (FastAPI):
  - `main.py` – FastAPI app, risk analysis + follow‑up scheduler + WhatsApp webhook.
  - `chat_service.py` – server‑side chat with Gemini.
  - `risk_model.py`, `analyzer.py` – risk/insight models using Gemini.
  - `database.py`, `email_service.py`, `whatsapp_service.py` – persistence & integrations.
  - `requirements.txt` – Python dependencies.
- `psychoWiki.ts` – base psycho‑education “wiki” entries (Emotional Lability, Burnout, etc.).
- `constants.tsx`, `types.ts` – shared UI strings, types, icons.
- `vite.config.ts` – Vite + PWA config, API wiring.

---

### 2. Dependencies

#### Frontend (React/Vite)

Node version: **>= 18** recommended.

Key packages (from `package.json`):

- React stack:
  - `react`, `react-dom`
  - `@vitejs/plugin-react`, `vite`, `typescript`
- AI + Google:
  - `@google/genai` – Gemini client in the browser.
- Auth + Google:
  - `@react-oauth/google`
- Markdown + rendering:
  - `react-markdown`, `remark-gfm`
- PWA:
  - `vite-plugin-pwa`

Install with:

```bash
npm install
```

#### Backend (`analysis_service`)

Python version: **3.10+** recommended.

From `analysis_service/requirements.txt`:

- `fastapi`, `uvicorn`
- `sqlalchemy`
- `apscheduler`
- `google-genai`
- `python-dotenv`
- `pydantic`
- `requests`, `httpx`

Install in a virtualenv:

```bash
cd analysis_service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

### 3. Environment variables

You need a valid **Gemini API key**.

#### Frontend `.env` (Vite)

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key
```

`vite.config.ts` exposes this as:

- `process.env.API_KEY`
- `process.env.GEMINI_API_KEY`

Both are used by the frontend Gemini client.

#### Backend `.env` (`analysis_service`)

Inside `analysis_service/`, create a `.env` file:

```bash
GEMINI_API_KEY=your_gemini_api_key

# Optional extras if you want the full memory service features:
DATABASE_URL=sqlite:///./bremi_memory.db
VERIFY_TOKEN=bremi_secure_token  # WhatsApp webhook verify token
BREVO_API_KEY=your_brevo_key
WHATSAPP_TOKEN=your_whatsapp_token
```

At minimum, the backend needs `GEMINI_API_KEY`.

---

### 4. Running the app locally

#### Step 1 – Start the backend (optional but recommended)

If you want session risk analysis, follow‑up email scheduling, and WhatsApp webhook handling, run the FastAPI service:

```bash
cd analysis_service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The frontend will call it (e.g. at `http://localhost:8000/sync-chat`) via `services/apiService.ts`.

#### Step 2 – Start the frontend (Vite dev server)

In the project root:

```bash
npm install
npm run dev
```

By default Vite runs on `http://localhost:3000` (and is configured to be reachable on `0.0.0.0`).

Open that URL in your browser, sign in with Google, and start chatting with Bremi.

---

### 5. Avoiding a blank page locally (fonts / network)

The UI uses modern fonts and PWA assets. In some environments (e.g. offline or with aggressive corporate filtering) you may see a **blank page** if:

- External font/CDN requests are blocked, and
- The browser treats them as fatal style/script errors.

To avoid issues locally:

- Make sure you are **online** the first time you load the app so fonts and assets can be fetched and cached.
- If you want a fully offline‑safe build:
  - Replace any remote font imports (e.g. in `index.html` or global CSS) with **system fonts** only, or
  - Download the font files into `public/` and reference them locally instead of from a CDN.
- When in doubt, check the browser console (F12 → Network/Console) for blocked font or script URLs.

If the page is blank, the most common quick fixes are:

1. Confirm `GEMINI_API_KEY` is set correctly in `.env.local` and you restarted `npm run dev`.
2. Temporarily **disable strict ad‑blockers** for `localhost:3000`.
3. Try a hard reload (`Cmd/Ctrl + Shift + R`).

---

### 6. Core user flows

- **Onboarding** – user signs in with Google, chooses language, and lands in chat.
- **Chat** – primary conversation with Bremi:
  - TTS (“listen” to responses).
  - Psycho‑education wiki links and “mind pattern” chips.
  - Session reflection (CBT/DBT/ACT‑style insights) via the **Reflect** button.
- **Relaxation** – multiple calming tools:
  - 4‑7‑8 breathing with animation.
  - Box breathing, 5‑4‑3‑2‑1 grounding, body scan.
  - Progressive muscle relaxation, safe‑place visualization, self‑compassion break.
  - All with optional guided voice (TTS) and access to the **Mind Patterns Wiki**.
- **Emergency** – triggered when Bremi detects high‑risk language (suicide, self‑harm / “end it all”), showing helplines and crisis guidance.
- **History & Profile** – view/edit sessions and user preferences.

---

### 7. Building and previewing production build

```bash
npm run build
npm run preview
```

`npm run preview` serves the built app on a local server (by default `http://localhost:4173`).

---

### 8. Contributing / extending

- Add new mind patterns to `psychoWiki.ts`, or let Bremi generate them dynamically via wiki links.
- Extend the Relaxation tools in `components/Relaxation.tsx`.
- Adjust prompts and safety behavior in:
  - `services/geminiService.ts` (frontend chat behavior)
  - `analysis_service/chat_service.py` (WhatsApp + memory service behavior)

Please keep all changes aligned with the core principle: **Bremi is a mental‑health companion, not a generic AI assistant.**


