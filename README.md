# 🎓 UniHut (Campus Hustle) — Verified University Marketplace

[![Google Cloud Run](https://img.shields.io/badge/Deployed%20on-Cloud%20Run-blue?logo=google-cloud)](https://ais-pre-g6c5k6tmnxfimfkkxh7bf6-807849025208.asia-southeast1.run.app)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-orange?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passed-brightgreen?logo=vitest)](https://vitest.dev/)

> **Live Cloud Run URL:** [https://ais-pre-g6c5k6tmnxfimfkkxh7bf6-807849025208.asia-southeast1.run.app](https://ais-pre-g6c5k6tmnxfimfkkxh7bf6-807849025208.asia-southeast1.run.app)

---

## 📌 Problem Statement
College students face major hurdles when buying and selling pre-owned essentials:
1. **Chaotic Campus Channels:** Student transactions are scattered across noisy WhatsApp/Telegram groups where listings get lost within minutes.
2. **Overpriced Used Goods:** First-year students frequently overpay for second-hand textbooks, scientific calculators, or hostel gear because fair resale data is unavailable.
3. **Safety & Scam Vulnerabilities:** Online advance payments and off-campus meetups create fraud risks for students.
4. **Search Friction:** Traditional keyword search fails when students search naturally in mixed college lingo (e.g., *"Casio FX-991 under 500"* or *"engineering maths book sem 3"*).

---

## 💡 Solution: UniHut
**UniHut** is a purpose-built, secure, student-to-student marketplace featuring:
- **🎙️ Multimodal AI Voice Search:** Voice-driven search intent extractor supporting English and Hinglish with automatic budget capping and category identification.
- **💬 Floating "Ask AI" Campus Advisor:** A dedicated, strictly bounded chatbot powered by Google Gemini that answers student marketplace queries, guides respectful bargaining, and recommends verified daylight campus meetup points.
- **🏷️ AI Price Advisor & Listing Assistant:** Automated appraisal estimating fair campus resale values in Indian Rupees (₹) and drafting student-friendly listing descriptions.
- **⚖️ "Should I Buy This?" Deal Evaluator:** Comprehensive analysis calculating pros, cautions, and peer-to-peer bargain targets.
- **📍 Verified Campus Handover Points:** Recommending daylight meetups at campus landmarks (Central Library, Student Activity Center, Campus Main Gate, Hostel Mess) with a strict zero-advance-payment policy.

---

## 🏗️ System Architecture & Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express proxy routes with full input validation
- **AI Engine:** Google Gemini API (`@google/genai`) with automatic model cascading (`gemini-flash-latest`, `gemini-3.1-flash-lite`, `gemini-3.8-flash`) and offline campus heuristic fallbacks
- **Database & Auth:** Firebase Firestore & Authentication integration
- **Deployment:** Google Cloud Run (`ais-pre-...run.app`)
- **Testing:** Vitest automated test suite

---

## 🔒 Security & Privacy

1. **No Client-Exposed Keys:** All Gemini AI calls are secured behind server-side proxy routes (`/api/gemini/*`). No API keys or credentials are leaked in client bundles.
2. **Input Validation:** Strict sanitization and boundary constraints on all incoming requests.
3. **Guardrails & Relevance Boundary:** Ask AI strictly enforces relevance to the UniHut marketplace and rejects off-topic queries.
4. **Zero Advance Payment Guarantee:** Built-in safeguards urging students to transact in person upon item inspection.

---

## 🧪 Testing & Quality Assurance

Automated unit and integration tests verify the core business logic and AI heuristics:

```bash
npm run test
```

Test coverage includes:
- Smart search query & natural language intent parser
- Campus price appraisal & fair value range calculations
- Peer-to-peer negotiation messaging
- Deal evaluation ("Should I Buy This?") logic
- Ask AI campus guardrails and topic boundaries

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
# Clone the repository
git clone <repository-url>.git
cd <repository-directory>

# Install dependencies
npm install

# Run automated tests
npm run test

# Start the development server (runs full-stack on port 3000)
npm run dev
```

### Production Build
```bash
npm run build
npm start
```
