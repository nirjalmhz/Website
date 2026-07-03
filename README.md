# 🌦️ Aether Weather Dashboard

A premium, professional-grade Weather Dashboard engineered with real-time atmospheric telemetry, dynamic weather canvas backgrounds, interactive weather chart profiles, custom user favorites persistence, and a multi-user secure Administrator Control Room.

---

### 🚀 Live Deployment
Access the live application directly in your browser:
**[👉 Click Here to Open the Live Web Application 👈](https://ais-pre-6qpamulrytwrtxu634i6yb-141863628620.asia-southeast1.run.app)**

---

## 🌟 Primary Features

### 1. Unified Atmospheric Intelligence
*   **Real-time Forecasts:** Deep visual widgets containing atmospheric pressure, wind metrics, UV index indices, humidity percentages, and visibility telemetry.
*   **Hourly & Weekly Outlooks:** Visualizing dynamic trends via clean responsive line charts.
*   **Air Quality Indexes:** Integrated telemetry monitoring pollutant particles with clear health recommendations.

### 2. Immersive Visual & Dynamic Experiences
*   **Interactive Particle Engine:** The interface morphs visually in response to current forecast conditions (e.g., real-time floating snow, falling rain, active wind currents, or starry night skies).
*   **Interactive Location Maps:** Spatial projection tools for tracking precise weather fronts.

### 3. Active User Registries & Custom Profiles
*   **Account Gateways:** Secure sign-up/login system with full server-side JWT authentication.
*   **Persistent Favorites:** Save, remove, and reorder preferred locations. Your configurations are saved securely inside **Google Cloud Firestore**.
*   **Unit Preferences:** Seamlessly toggle default temperatures (Celsius vs. Fahrenheit) and wind speeds (km/h vs. mph).

### 4. 🛡️ Developer Administrator Console
A restricted backend command room accessible only to authorized administrators (`69nirjalmaharjan@gmail.com` with password `616931367@nm`):
*   **System Analytics:** High-level telemetry displaying registered subscriber count, stored favorites count, and average lookups.
*   **Live Meteorology Bulletins:** Craft, schedule, and broadcast custom system alert bulletins that immediately display on all active user dashboards.
*   **Database Management:** Complete subscriber registry view with profile deactivation controls to maintain safe directories.

---

## 🛠️ Stack Architecture

*   **Frontend:** React 18 (Vite build engine), Tailwind CSS, Framer Motion (`motion/react` for elegant UI transitions), Lucide Icons.
*   **Backend:** Node.js, Express, tsx.
*   **Database/Storage:** Google Cloud Firestore (via `firebase-admin`).
*   **Auth System:** Custom hashing verification and secure authorization tokens.

---

## ⚙️ Development Guide

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm

### Installation
1.  Clone this repository to your local workspace.
2.  Install all applet dependencies:
    ```bash
    npm install
    ```
3.  Boot up the local dual-stack development server:
    ```bash
    npm run dev
    ```
4.  Navigate to `http://localhost:3000` to preview the local environment.

### Production Compiles
To bundle both the frontend static assets and server-side CommonJS bundle:
```bash
npm run build
npm start
```
