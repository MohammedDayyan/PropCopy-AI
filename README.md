# PropCopy AI — Real Estate Marketing SaaS

A modern, responsive, premium-looking SaaS application designed specifically for Indian real estate agents and brokers. It enables uploading property images and floor plans to automatically extract property details (using Multimodal Vision APIs) and generate high-converting MLS descriptions, Instagram reels captions, email blasts, and Facebook ads.

---

## 💻 Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS (using Custom CSS Design tokens in `globals.css` for a rich glassmorphism theme).
- **Backend**: FastAPI (Python) + Pydantic v2 + Uvicorn.
- **Database & Auth**: Supabase (PostgreSQL, Supabase Storage, and Supabase Auth).
- **AI Models**: Groq Cloud API:
  - **Vision Model**: `meta-llama/llama-4-scout-17b-16e-instruct` (Concurrent, OCR and visual parsing).
  - **Copywriting Text Model**: `llama-3.3-70b-versatile` (JSON mode).
- **Payments Gateway**: Razorpay (Credit-based system to circumvent Indian RBI international recurring subscription e-mandate rules).

---

## 📂 Project Structure
```
├── backend/                  # FastAPI Python backend
│   ├── migrations/           # Database migration files
│   │   └── 001_schema.sql    # PostgreSQL schema, indexes, RLS setup
│   ├── routers/              # API Route Handlers (auth, property pipeline, payments)
│   ├── services/             # Core logic layers (Groq Vision/text services, Supabase DB service)
│   ├── middleware/           # FastAPI Auth JWT verify middleware
│   ├── config.py             # Pydantic environment configurations
│   ├── main.py               # Main uvicorn server application entry
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variables template
│
├── frontend/                 # Next.js React frontend
│   ├── app/                  # Pages router (Landing, Dashboard, Generate, Billing, Login)
│   ├── components/           # Reusable UI Elements (Navbar, ImageZone, ResultsDashboard, Banner)
│   ├── lib/                  # Helpers (api wrapper, supabase client initialization)
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies
│   └── .env.local.example    # Frontend env variables template
│
└── README.md                 # Project document guide
```

---

## 🚀 Setup & Installation

### 1. Database & Storage setup (Supabase)
1. Register/Sign-in at [supabase.com](https://supabase.com/).
2. Create a new project.
3. Open the **SQL Editor** tab, paste the contents of `backend/migrations/001_schema.sql`, and execute it. This creates tables for properties, property images, marketing assets, credits, payment logs, indexes, and enables Row Level Security (RLS) policies.
4. Go to **Storage**, click "Create Bucket":
   - Name it: `property-images`
   - Set to **Public**
   - Click "Save". Add an INSERT policy allowing authenticated users to upload files to folders matching their `auth.uid()`.

### 2. Backend Setup
1. Create a virtual environment and activate it:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill out your Groq API Key, Razorpay key credentials, and your Supabase URL/keys.
4. Start the FastAPI local server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Open a new terminal:
   ```bash
   cd frontend
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and paste your project's public Supabase URL, Anon Key, and Backend URL (`http://localhost:8000`).
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 The Data Pipeline Flow

1. **Authentication & Trial**: When a user first registers or signs in, the frontend triggers `/api/user/init` to create a `user_credits` record setting their 7-day free trial date and awarding **5 free generation credits**.
2. **Upload Direct to Bucket**: The agent selects up to 5 images (photos or floor plans). The React frontend uploads these files directly to the public Supabase storage bucket `property-images` inside the user's specific subfolder (`user_id/...`).
3. **Pipeline Trigger**: The frontend hits the FastAPI endpoint `POST /api/process-property` passing the storage paths and the agent's raw bullet points.
4. **Credit Deduct**: The backend checks and deducts **1 credit** from their balance.
5. **Concurrent Vision Loop**: The backend spawns async tasks to call the Groq Vision model (`llama-4-scout-17b`) for all uploaded images simultaneously:
   - For floor plans/text: Extracts precise dimensions and area details (OCR Mode).
   - For property photos: Notes building materials (Italian marble, vitrified tiles, granite counter tops), layout, condition, and visual quality.
   - Individual analyses are saved under `property_images.ai_analysis`.
6. **Synthesis Writing**: The backend combines all image analyses with the agent's raw notes, prompting the `llama-3.3-70b-versatile` model in **JSON mode** to structure the output:
   - **MLS description**: Suitable for Magicbricks/99acres.
   - **Instagram script**: Captions with emojis and local hashtags.
   - **Email blast**: Structured sales outreach template.
   - **Facebook ad**: Ad copy layout.
7. **Save & Respond**: Assets are saved in `marketing_assets` table and sent back as a unified response to the agent.

---

## 🇮🇳 India Real Estate Localization
The prompts are engineered to output content suited for the Indian real estate vocabulary:
- Replaces American "beds/baths" with standard "BHK" configurations (1 BHK, 2 BHK, 3 BHK, etc.).
- Measures areas using standard Indian "carpet area" and "super built-up area" in sq. ft.
- Highlights "Vastu-compliant", "ready to move", and "gated community/society amenities".
- Optimizes marketing locations relative to nearest metro stations, tech parks, and IT corridors.

---

## 💳 RBI Compliance Payments Workaround
Because RBI rules make automated recurring payments hard to set up on cards without active e-mandate integrations, PropCopy AI operates on a **Credits-Based Top-up System**. Agents can purchase a flat pack of **20 property generations for ₹499** via Razorpay. This allows agents to pay easily via UPI, Indian debit/credit cards, and NetBanking.
