# WARROOM // GLOBAL CONFLICT INTELLIGENCE TERMINAL

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ WARROOM // GLOBAL CONFLICT INTELLIGENCE TERMINAL                         ● NEAR-REAL-TIME │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ DATA WINDOW :: LAST 7 DAYS   │   SYNC :: 4 MIN AGO   │   DATA SOURCE :: ACLED             │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

WARROOM is a terminal-style geopolitical conflict intelligence workstation. It is engineered for analysts, researchers, and operations observers to monitor armed conflict, political violence, military escalations, civilian impacts, and ceasefires across the globe in near-real-time.

---

## 1. Project Overview

Unlike generic news portals or consumer dashboards, WARROOM operates as an intelligence terminal workstation:
- **Strict Recent-Data Temporal Window**: Defaults to a rolling **7-day** operational window, with user toggle to **3-day** or **10-day** windows. Never populates the main operational map with obsolete historical records.
- **Dynamic UTC Operations**: Current date/time is calculated dynamically in UTC at runtime. No dates are ever hardcoded.
- **Real Conflict Data Provider**: Powered by **Google Gemini API with Search Grounding**, retrieving verified real-world conflict incidents, exact coordinates, dates/times, and source URLs. Cached automatically for 4 hours to respect API quotas while maintaining near-real-time situational awareness.
- **Transparent Severity & Escalation Modeling**: Deterministic formulas calculate event severity and 24-hour velocity change (0–100 Escalation Index) without subjective or fabricated ratings.
- **Zero Hardware Telemetry & Zero Synthetic Data**: No mock/synthetic data. Available screen estate is dedicated exclusively to real conflicts, maps, actors, timelines, and verified intelligence.

---

## 2. Key Features

- **Strategic Operations Map (MapLibre GL)**:
  - High-performance GPU-rendered dark cartography.
  - Interactive clustering (`EVENT CLUSTER :: 24`) with click-to-zoom.
  - Multi-tier severity markers: Critical (Red), High (Orange), Moderate (Yellow), Low (Cyan).
  - Subtle pulsing indicator for events occurring within the last 24 hours.
  - Tactical modes: `[CONFLICTS]`, `[EVENTS]`, `[ESCALATION]`, and `[HEATMAP]`.
  - **NASA FIRMS Satellite Thermal Anomaly & Strike Sensor Overlay**:
    - Near-Real-Time space-based detection from **NOAA-20 / Suomi-NPP VIIRS (375m)** sensors.
    - Highlights active kinetic artillery barrages, airstrikes, and burning infrastructure within hours of occurrence.
    - Scaled Fire Radiative Power (MW) and Brightness Temperature (Kelvin) heat orbs with dedicated tactical HUD inspector card.
    - Zero API key required by default with automatic 15-minute server-side caching.
- **Conflict Intelligence Panel**:
  - Live theater metrics, intensity histogram, reported fatalities, and identified belligerents.
  - Chronological developments feed with raw incident logs.
- **Strictly Evidenced AI Analysis**:
  - Server-side integration with Google Gemini or Anthropic Claude.
  - Enforces strict factual constraints: AI is supplied solely with retrieved incident records and prohibited from extrapolating future military predictions or hallucinating casualties.
  - Rigorous separation: `// VERIFIED / RETRIEVED DATA` vs. `// AI ANALYSIS`.
- **Integrated Terminal Command Line (`war@warroom:~$`)**:
  - Fast keyboard-driven command execution (`world`, `conflicts`, `country <name>`, `region <name>`, `event <id>`, `search <query>`, `filter 3d/7d/10d`, `sync`, `clear`, `about`).
- **Global Keybindings**:
  - `/` or `Ctrl+K`: Focus terminal command line
  - `M`: Focus strategic world map
  - `T`: Focus chronological timeline
  - `1`: Switch to 7-day rolling window
  - `2`: Switch to 10-day rolling window
  - `Esc`: Dismiss modal terminals

---

## 3. Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                               WARROOM UI                               │
├─────────────────┬──────────────────────────────────┬───────────────────┤
│ LEFT NAV        │ OPERATIONAL CENTER               │ RIGHT INTEL       │
│ - 6 Views       │ - MapLibre GL Strategic Map      │ - Conflict Metrics│
│ - Region filter │ - Dynamic KPI Strip              │ - Timeline Tree   │
│ - 3D/7D/10D     │ - Live Incident Stream           │ - AI Brief        │
├─────────────────┴──────────────────────────────────┴───────────────────┤
│ TERMINAL CLI: war@warroom:~$ (Interactive keyboard commands)           │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                         API Routes / REST
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS BACKEND                               │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ - /api/events      │ - Gemini Provider  │ - Deterministic Clustering   │
│ - /api/conflicts   │   (Search Grounded)│ - Transparent Severity Score │
│ - /api/sync        │ - 4h Cache Engine  │ - 24h Escalation Index       │
│ - /api/ai/brief    │ - Deduplication    │ - Severity Stratification    │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## 4. Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers)
- **Runtime**: Node.js v20+ / v24+
- **Language**: TypeScript 5.7 (Strict Mode)
- **Styling**: Tailwind CSS with custom terminal color palette & monospace typography
- **Mapping**: MapLibre GL JS (Vector/Raster Dark Matter tiles)
- **Icons**: Lucide React
- **AI Engine**: Google Gemini API (`@google/genai` / REST) or Anthropic Claude API

---

## 5. Installation & Setup

### Prerequisites
- Node.js 20+ installed
- npm or yarn

### Quickstart

1. **Clone or enter the project directory**:
   ```bash
   cd s:\Projects\WarRoom
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Environment Variables

Create `.env.local` in the project root (or simply paste your key in the UI):

```env
# Google Gemini API Key (Server-side & Browser UI Setup)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional AI Analysis Key (Anthropic Claude fallback)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/warroom

# Map Tile Configuration (Defaults to zero-key CartoDB Dark Matter)
NEXT_PUBLIC_MAP_STYLE_URL=https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
```

---

## 7. Gemini API Setup & Activation

1. Obtain a free API key at Google AI Studio: [https://aistudio.google.com/](https://aistudio.google.com/).
2. You can activate it in either of two ways:
   - **Direct UI Setup**: Click `[+ CONFIGURE GEMINI API KEY]` in the top header, paste your API key, and click **SAVE & ACTIVATE (API-LIVE)**.
   - **Environment Variable**: Add `GEMINI_API_KEY=your_key_here` to `.env.local`.
3. Once configured, the header status automatically switches to:
   ```
   ● API-LIVE   DATA SOURCE :: GEMINI API (4H CACHE)
   ```
4. Click `[SYNC NOW]` at any time to force a fresh real-time retrieval from Gemini with Google Search Grounding. Data is automatically cached for 4 hours to preserve API limits.

---

## 8. Date Filtering & Dynamic Window Logic

The system strictly enforces temporal freshness through the `getRecentDateRange(days)` utility:
- **3-Day Window**: `now - 3 days` to `now`
- **7-Day Window (Default)**: `now - 7 days` to `now`
- **10-Day Window**: `now - 10 days` to `now`

All queries to `/api/events` and `/api/conflicts` validate and discard records outside this boundary on both the server and client.

---

## 9. Severity & Escalation Scoring Formulas

### Severity Model (`calculateSeverity`)
- **Fatalities (0–40 pts)**: Graded from 0 to 25+ casualties.
- **Lethality / Weaponry (0–35 pts)**: Airstrikes, drone strikes, remote shelling (35 pts), armed battles (30 pts), civilian violence (28 pts), protests (8 pts).
- **Recency (0–15 pts)**: Events within 24h receive 15 pts; 48h receive 10 pts.
- **Actor Involvement (0–10 pts)**: Multilateral military/state engagements receive 10 pts.
- **Thresholds**: 70+ (CRITICAL), 45–69 (HIGH), 25–44 (MODERATE), 0–24 (LOW).

### Escalation Index (`calculateEscalationIndex`)
Measures the velocity of incidents in the current 24-hour interval against the daily average of preceding baseline days in the rolling window:
$$\text{Baseline Rate} = \frac{\text{Prior Events}}{\text{Prior Days}}$$
If the current 24h event volume exceeds the baseline by $\ge 25\%$, the trend is classified as **UP** (`↑`); if decreased by $\ge 25\%$, **DOWN** (`↓`); otherwise **STABLE** (`→`).

---

## 10. Verification & Build Validation

Run verification checks:
```bash
# Type check
npm run build
```

---

## 11. Disclaimer & Data Limitations

WARROOM is an informational conflict monitoring and geospatial visualization platform. Event classifications may be revised by providers as ground evidence solidifies. The platform does not make predictive warfare claims. AI summaries are analytical aids derived strictly from retrieved evidence.
