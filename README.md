<div align="center">

# 🪔 Nimantran AI (निमंत्रण AI)
### **One Invitation. One Link. Entire Celebration.**

*Next-Generation AI-Powered Event Management, Luxury Digital Invitations & Multi-Channel Broadcasting Engine*

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-State_Engine-FF6F00.svg?logo=langchain&logoColor=white)](https://langchain.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

</div>

## 📖 Overview

**Nimantran AI** is a production-grade, full-stack celebration OS built specifically for modern Indian and multicultural celebrations (Weddings, Sangeet, Mehendi, Anniversaries, Birthdays, Housewarmings, Corporate Galas, and Festivals).

It replaces fragmented wedding planning workflows with an integrated, intelligent platform that automates event design, guest list curation, luxury digital cards, multi-channel messaging (WhatsApp, SMS, Email), live QR check-ins, and venue TV welcome screens.

---

## 🏛️ Environment Matrix: Development vs. Production

| Dimension | Local Development | Production Environment |
| :--- | :--- | :--- |
| **Database** | **SQLite** (`sqlite+aiosqlite`) default zero-setup or local PostgreSQL | **PostgreSQL 16+** (`postgresql+asyncpg`) with persistent volume & connection pooling |
| **Cache / Queue** | In-memory asyncio background worker / local Redis | **Redis 7+** (AOF enabled, protected auth mode) |
| **Network & Ports** | `localhost:5173` (Vite), `localhost:8000` (FastAPI), direct access | **Nginx Gateway (80/443)** only. PostgreSQL (5432), Redis (6379), and FastAPI (8000) are internal to Docker network |
| **Orchestration** | Python venv + Vite OR `docker compose up --build` | `docker compose -f docker-compose.prod.yml up -d` OR Kubernetes (`k8s/`) |
| **Secrets** | `.env` (ignored by Git) | Environment variables injected via Vault / AWS Secrets / CI/CD |

---

## ✨ Key Features

### 1. 🤖 LangGraph Conversational AI Event Architect
- **Multi-Turn Stateful Planning Engine**: Chat with an AI wedding planner that understands regional traditions (North/South Indian, Marathi, Punjabi, Gujarati, Bengali, etc.).
- **Slot Filling & Event Generation**: Automatically generates multi-day itineraries, itineraries with muhurats, dress codes, and host details through natural language.
- **Dynamic Wording Synthesis**: Creates personalized Hindi, Sanskrit, and English invitation copy with traditional shlokas and blessings.

### 2. 🚀 Multi-Channel Invitation Broadcasting Engine
- **WhatsApp Cloud API Integration**: Dispatches rich media invitations and QR entry passes directly via Meta Graph API v21.0.
- **SMS / Text Gateways**: Integrated with Twilio and Fast2SMS (Indian DLT compliant).
- **Luxury Royal Email Cards**: High-aesthetic HTML email cards with shloka headers, venue map embeds, RSVP buttons, and calendar attachments.
- **Asynchronous Queue & Idempotency**: Built-in background rate-limiting, exponential backoff retries (3 attempts), and strict idempotency on `(campaign_id, guest_id, channel)` preventing duplicate dispatches.
- **Real-Time Delivery Dashboard**: Host-friendly KPIs (*Delivered, Sending, Waiting, Read, Failed*), guest delivery logs, and 1-tap retry for failed messages.

### 3. 💌 Interactive Live Guest Experience (`/i/:slug`)
- **Interactive Digital Cards**: Royal Indian theme engine (Rose Gold, Champagne, Emerald, Royal Marigold, Midnight Navy).
- **One-Tap RSVP Engine**: Real-time RSVP responses with dietary preferences, party size, and notes.
- **Live Google Maps & Itinerary**: Turn-by-turn navigation directly to the venue and event functions.
- **Digital Guest Wishes & Memory Wall**: Guests can leave blessings, upload celebration photos, and listen to background music.

### 4. 🎟️ Entry QR Pass & Scanner Dashboard
- **Unique Cryptographic Guest Passes**: Every guest receives a unique QR pass for VIP check-in.
- **Mobile Camera QR Scanner**: Fast, live camera scanner with sound/vibration feedback on check-in.
- **Real-Time Attendance Analytics**: Track arriving guest count, party size, and check-in timeline.

### 5. 📺 Big-Screen TV Welcome System (`/live-screen/:id`)
- **Live WebSocket Feed**: Real-time celebration screen designed for venue LED displays and TV lobby monitors.
- **Dynamic Guest Greeting**: When a guest scans in, the TV screen instantly welcomes them with animated photo cards and custom family quotes.

### 6. 👥 Master Contacts & Guest Management
- **Saved Master Contact Book**: Reusable family contact list with tagging, groups (Bride, Groom, VIP), and import/export.
- **Bulk CSV / Excel Import**: Smart phone normalization (E.164 standard) and deduplication.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Public["Public Internet (Port 80 / 443)"]
        Nginx["Nginx Reverse Proxy / Load Balancer"]
    end

    subgraph InternalNet["Isolated Internal Network (nimantran_prod_net)"]
        Frontend["Frontend SPA (React 19)"]
        Backend["FastAPI Backend (Port 8000)"]
        Worker["Campaign Queue Worker (Asyncio / Redis)"]
        Postgres[(PostgreSQL 16 Database)]
        Redis[(Redis 7 Cache / Broker)]
    end

    subgraph External["External Services"]
        MetaWA["Meta WhatsApp Cloud API"]
        SMS["Twilio / Fast2SMS"]
        SMTP["SMTP Email Service"]
        Gemini["Google Gemini 1.5 API"]
    end

    Public --> Nginx
    Nginx -->|/ | Frontend
    Nginx -->|/api/ | Backend
    Nginx -->|/uploads/ | Backend
    Backend --> Postgres
    Backend --> Redis
    Backend --> Gemini
    Worker --> Postgres
    Worker --> Redis
    Worker --> MetaWA
    Worker --> SMS
    Worker --> SMTP
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas-Confetti, HTML5 QR Scanner |
| **Backend** | FastAPI, Python 3.11+, SQLAlchemy 2.0 (Async), Pydantic v2, Uvicorn, Asyncio |
| **AI & LLM** | LangGraph State Machine, LangChain, Google Gemini 1.5 Flash API |
| **Messaging** | Meta WhatsApp Cloud API (v21.0), Twilio REST API, Fast2SMS API, Python smtplib / aiosmtplib |
| **Database** | SQLite with `aiosqlite` (Development) / PostgreSQL with `asyncpg` (Production) |
| **Security** | Passlib (Bcrypt), PyJWT (HMAC-SHA256), CORS Middleware, Strict Input Sanitization |

---

## 🚀 Quick Start Guide (Local Development)

### Prerequisites
- **Node.js** v18.0.0 or higher (`node -v`)
- **Python** 3.11 or higher (`python --version`)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/rohitgupta9886/Nimantran_App.git
cd Nimantran_App
```

---

### Step 2: Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # On Windows (Command Prompt):
   python -m venv venv
   .\venv\Scripts\activate.bat
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *(For development, SQLite is used out-of-the-box. Add your `GEMINI_API_KEY` for AI features.)*
5. Run the backend server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Backend will be running at `http://127.0.0.1:8000`. Swagger API docs are live at `http://127.0.0.1:8000/docs`.

---

### Step 3: Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend application will be live at `http://localhost:5173`.

---

### Step 4: Alternative Local Setup with Docker Compose
To run the full stack (Frontend, Backend, PostgreSQL, Redis) locally using Docker:

```bash
docker compose up --build
```

---

## 🚢 Production Deployment

### 1. Production Docker Compose (`docker-compose.prod.yml`)

The production Compose architecture enforces strict network isolation:
- **Only Nginx / Frontend** exposes port `80` and `443` publicly.
- **PostgreSQL (5432)**, **Redis (6379)**, and **FastAPI (8000)** are kept internal to the Docker network.

```bash
# 1. Create production environment configuration from template
cp .env.production.example .env.production

# 2. Configure your production domain, PostgreSQL password, JWT secret, and messaging credentials
# (Edit .env.production)

# 3. Launch hardened production stack
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### 2. Kubernetes Deployment (`k8s/`)

Production manifests with Ingress, PersistentVolumeClaims, HorizontalPodAutoscalers, and ConfigMaps:

```bash
kubectl apply -k k8s/
```

---

## ⚙️ Environment Configuration

| File | Purpose | Version Controlled? |
| :--- | :--- | :--- |
| `.env.example` | Local development configuration template | ✅ Yes |
| `.env.production.example` | Production environment template with all providers | ✅ Yes |
| `.env` | Local machine active configuration | ❌ No (Ignored by Git) |
| `.env.production` | Production server active credentials | ❌ No (Ignored by Git) |

> [!NOTE]
> When `WHATSAPP_PROVIDER_MODE="mock"`, `SMS_PROVIDER="mock"`, and `EMAIL_PROVIDER="mock"`, the system runs an automated background delivery simulator with real database state updates without requiring external API keys.

---

## 🧪 Testing & Verification

Run automated unit and end-to-end integration tests:

```bash
cd backend
python -m pytest tests/test_broadcast_system.py tests/test_e2e_broadcasting.py -v
```

Typecheck the frontend:
```bash
cd frontend
npx tsc --noEmit
```

---

## 📁 Repository Structure

```
Nimantran_App/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST routes (auth, events, guests, campaigns, webhooks)
│   │   ├── core/               # App config, database, security, logging
│   │   ├── models/             # SQLAlchemy ORM models (Event, Guest, Campaign, User)
│   │   ├── schemas/            # Pydantic v2 schemas and validation
│   │   └── services/           # Business logic, LangGraph engine, worker, messaging providers
│   │       ├── whatsapp/       # Meta Cloud API & Simulator
│   │       ├── sms/            # Twilio & Fast2SMS Gateways
│   │       └── email/          # SMTP & Luxury HTML Email Engine
│   ├── tests/                  # Pytest automated test suites
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Backend env template
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components (Wizard, Dashboard, Modals, Cards)
│   │   ├── pages/              # Main routes (Dashboard, EventDetail, EventWizard, LiveScreen)
│   │   ├── services/           # Client API layer, sharing service
│   │   └── utils/              # Export utilities, theme engines
│   ├── package.json            # Node.js dependencies
│   ├── nginx.conf              # Production Nginx reverse proxy configuration
│   └── vite.config.ts          # Vite build config
├── k8s/                        # Production Kubernetes manifests
├── docker-compose.yml          # Local development Docker Compose
├── docker-compose.prod.yml     # Hardened production Docker Compose (isolated network)
├── .gitignore                  # Master Git ignore (protects secrets, DBs, logs)
├── .env.example                # Root environment template
├── .env.production.example     # Production environment template
└── README.md                   # Project documentation
```

---

## 🔒 Security & Privacy Practices

- **Zero Secret Leakage**: All `.env`, `.env.*`, `*.key`, `*.pem`, `*.db`, and token files are strictly ignored in `.gitignore`.
- **Internal Network Isolation**: PostgreSQL, Redis, and FastAPI are not exposed to the public internet in production.
- **HMAC Webhook Verification**: Meta WhatsApp webhooks require valid SHA-256 HMAC signature verification (`X-Hub-Signature-256`).
- **Atomic Idempotency**: Broadcast campaigns enforce deduplication tokens (`idempotency_key`) preventing double-billing or duplicate messages.
- **Password Hashing**: Modern Bcrypt hashing with salted iterations.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <b>Crafted with ❤️ for Celebrations Worldwide</b><br/>
  <i>Nimantran AI — Every Invitation Deserves Royalty.</i>
</div>
