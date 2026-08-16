# NIMANTRAN AI — Product Requirements Document (PRD)

## 1. Executive Summary
Nimantran AI is an India-first AI-powered digital invitation, event management, guest CRM, gate check-in, real-time Smart Welcome Screen, digital Shagun, and post-event memory platform. 
Tagline: **"One Invitation. One Link. Entire Celebration."**

## 2. Product Vision & Target Users
Nimantran AI transforms physical/PDF invitation cards into a permanent public event webpage (`/i/:slug`). The webpage dynamically evolves across the event lifecycle:
- **Before Event**: "You're Graciously Invited" (Invitation, Schedule, Map, RSVP, Shagun)
- **During Event**: "Welcome to the Celebration" (Live venue updates, Gate QR Entry Pass, Real-Time TV Smart Welcome Screen)
- **After Event**: "Relive the Memories" (Photo Gallery, AI Story Timeline, Memory Book, Thank You Messages)

### Target User Segments
1. Families & Wedding Hosts
2. Birthday & Anniversary Organizers
3. Event Planners & Wedding Coordinators
4. Corporate Event Organizers & Institutions

## 3. Core Features & Functional Requirements
- **Permanent Event URL Engine**: Public slug routing (`https://nimantran.ai/i/rahul-neha`).
- **Multi-Step Event Wizard**: Event details, multi-function schedule (Haldi, Mehendi, Wedding, Reception).
- **AI Invitation Generator**: Natural language input -> Multi-lingual wording (Hindi, English, Hinglish).
- **Guest CRM & Excel Import**: Bulk upload, group management, personalized welcome quotes.
- **Gate Reception Scanner & Cryptographic Pass**: Unique signed QR codes (`NIM-ENTRY-XXXX`) with duplicate check-in protection.
- **WebSocket Smart Welcome Screen**: Fullscreen TV app (`/welcome/:eventId`) displaying glowing welcome animation when reception scans a guest QR pass.
- **Immutable AI Credit Ledger**: Double-entry credit wallet (`credit_wallets`, `credit_transactions`) metering AI features separately from normal platform features.
