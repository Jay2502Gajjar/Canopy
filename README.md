<div align="center">
  
# 🌳 Canopy 
**AI-Powered HR Intelligence & Risk Detection Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Groq](https://img.shields.io/badge/AI-Groq_Llama_3-f55a3c?style=for-the-badge)](https://groq.com/)
[![Pinecone](https://img.shields.io/badge/Vector-Pinecone-000000?style=for-the-badge)](https://pinecone.io/)

*Shift your HR department from reactive administration to proactive intelligence.*

</div>

---

## 📖 Overview

Canopy is a next-generation Human Resources Intelligence platform designed to act as a proactive co-pilot for HR Business Partners (HRBPs) and organizational leadership. 

Traditional HR software focuses on tracking payroll and time-off. **Canopy focuses on preventing expensive employee attrition before it happens.** By connecting to your existing operational workflows (Gmail, Zoho HRMS) and analyzing 1:1 meeting transcripts, Canopy's AI engine automatically calculates real-time employee sentiment, flags flight risks, and tracks unfulfilled promises (commitments) made by management.

---

## ✨ Key Features

*   🧠 **Proactive Sentiment Engine:** Automatically scores employee sentiment (1-100) and flags flight risks (e.g., "Critical", "Watch") by analyzing meeting transcripts and HR email contexts.
*   🤝 **Automated Commitment Tracking:** Uses Groq LLM to automatically extract action items and promises made during 1:1 meetings (e.g., *"I will review your promotion timeline next month"*), ensuring leadership follows through.
*   📚 **Interactive Vector Memory (RAG):** Powered by Pinecone, Canopy remembers past employee interactions, allowing you to converse with the AI about an employee's historical journey.
*   ⚡ **Smart Meeting Briefs:** Generate instant, AI-synthesized prep sheets for upcoming 1:1s, summarizing past notes, unresolved commitments, and suggested discussion strategies.
*   📥 **ATS Scanning Pipeline:** Upload batches of resumes and instantly filter candidates against required skills using high-speed AI information extraction.
*   🔌 **Zero-Friction Integrations:** Native background sync with **Zoho People HRMS** and **Gmail API** (inbox scanning & SMTP OTPs).
*   📊 **Role-Based Dashboards:** Optimized, real-time metrics for HR Operators (HRO), HR Business Partners (HRBP), and Chief HR Officers (CHRO).

---

## 🏗️ Architecture & Tech Stack

Canopy utilizes a decoupled, high-performance architecture configured for rapid AI inference.

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI & Styling:** React 19, TailwindCSS 4, Radix UI Primitives, Framer Motion
- **State Management:** Zustand (Client state), TanStack Query v5 (Server state)
- **Data Visualization:** Recharts

### Backend Core
- **Framework:** FastAPI (Python 3.11)
- **Database Driver:** AsyncPG (high-throughput asynchronous PostgreSQL)
- **Authentication:** Custom JWT RBAC + Gmail SMTP 2FA Pipeline

### Data & AI Layer
- **Relational DB:** PostgreSQL (Cloud-hosted via Neon.tech) 
- **LLM Inference:** Groq API (Llama 3.1 8B / 3.3 70B for near-instant 500+ tok/s inference)
- **Vector Database:** Pinecone (Semantic embeddings for Retrival-Augmented Generation)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- A [Neon PostgreSQL](https://neon.tech/) database (or local Postgres)
- API Keys: [Groq](https://console.groq.com) and optionally [Pinecone](https://pinecone.io)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/canopy.git
cd canopy

# Install Frontend dependencies
cd frontend
npm install

# Install Backend dependencies
cd ../backend
python3 -m venv venv
source venv/bin/activate  # Or `.\venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```ini
# backend/.env

# === REQUIRED ===
POSTGRES_URL="postgresql://user:pass@host/dbname?sslmode=require"
JWT_SECRET="generate_a_secure_random_string"
GROQ_API_KEY="gsk_your_groq_api_key"

# === SERVER ===
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL=http://localhost:3000

# === PINECONE (Optional: Enables AI Vector Memory) ===
PINECONE_API_KEY="your_pinecone_key"
PINECONE_ENVIRONMENT="us-east-1"
PINECONE_INDEX="canopy-hr"

# === ZOHO PEOPLE HRMS (Optional: Enables Org Sync) ===
ZOHO_CLIENT_ID="your_client_id"
ZOHO_CLIENT_SECRET="your_secret"
ZOHO_REFRESH_TOKEN="your_refresh_token"

# === GMAIL (Optional: Enables AI Inbox Sync & OTP) ===
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REFRESH_TOKEN="your_google_refresh_token"
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="your_app_password"
```

Create a `.env.local` file in the `frontend/` directory:

```ini
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Initialize Database & Run

The backend utilizes `asyncpg` context managers to automatically initialize necessary PostgreSQL tables on boot. To populate demo data:

```bash
# Seed the database (from the backend folder)
python db/seed.py
```

Start the application:

```bash
# Terminal 1: Start the FastAPI Backend
cd backend
python -m uvicorn main:app --port 5000 --reload

# Terminal 2: Start the Next.js Frontend
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## 🛡️ Security & Privacy
Canopy handles sensitive HR data. The architecture enforces strict RBAC (Role-Based Access Control) via JWTs. System environment configurations gracefully degrade—if external email SMTP or Zoho credentials are inadvertently removed, the system continues to process core HR workflows locally without breaking the user experience.

---

## 🤝 Contributing
Contributions are welcome! Please examine the `REPORTS.md` file in the repository root for a highly detailed Technical Report regarding systemic boundaries and API designs before submitting substantial PRs.

---

<div align="center">
  <i>Built to make the workplace more human through better intelligence.</i>
</div>
