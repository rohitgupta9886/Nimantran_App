# NIMANTRAN AI — System Architecture & Design Document

## 1. Modular Monolith Architecture
Nimantran AI is constructed as a modular monolith using Python FastAPI (Backend) and React TypeScript (Frontend).

```
 +-------------------------------------------------------------------------+
 |                          React TypeScript Frontend                      |
 |      (Landing, Host Dashboard, Event Wizard, Scanner App, TV Welcome)   |
 +------------------------------------+------------------------------------+
                                      |
                                      | HTTP REST / WebSockets
                                      v
 +-------------------------------------------------------------------------+
 |                          FastAPI Backend Core                           |
 |  [Auth] [Events] [Guests] [QR Scanner] [WebSocket WS] [Credits] [Admin] |
 +------------------+------------------+-------------------+---------------+
                    |                  |                   |
                    v                  v                   v
            +---------------+  +---------------+  +-----------------+
            | PostgreSQL DB |  |  Redis Store  |  | Integrations    |
            | (SQLAlchemy   |  | (PubSub WS,   |  |  - Mock/OpenAI  |
            |  Async engine)|  |  Cache/Queue) |  |  - WhatsApp API |
            +---------------+  +---------------+  |  - Razorpay Pay |
                                                  |  - S3 / Local   |
                                                  +-----------------+
```

## 2. Real-Time Smart Welcome Screen Data Flow
1. Receptionist opens Mobile Gate Scanner (`/scan/:eventId`).
2. Receptionist scans Guest QR Code (`NIM-ENTRY-1001`).
3. Gate Scanner invokes `POST /api/v1/scanner/verify`.
4. Backend verifies cryptographic pass, updates `checked_in = True`, creates `checkin` audit record, and triggers `welcome_manager.broadcast_checkin()`.
5. WebSocket (`WS /ws/events/{event_id}/welcome`) broadcasts checkin payload to connected TV/LED displays.
6. Welcome Screen UI renders glowing 3-6s welcome animation with guest name, relationship, quote, and celebratory confetti.
