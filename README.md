# ☀️ Sunny Start

**Sunny Start** is a gamified morning chore tracker designed to help kids finish their routines on time while having fun! It transforms the "boring" morning prep into an interactive "mission" with rewards, timers, and progress tracking.

![Sunny Start Icon](frontend/icon.png)

## 🚀 Features

- **Gamified Missions**: Chores are displayed as big, interactive cards.
- **Quest Timer**: Tracks how long the routine takes each day.
- **Victory Rewards**: Confetti explosions and random fun GIFs (Minions, Snoopy, etc.) upon completion.
- **Adventure Log**: Persistent history to track improvement day-to-day.
- **PWA Ready**: Install it on iPhone or Android as a native app (Standalone mode).
- **Secure**: Authentication via Google OAuth.
- **Full Stack**: Powered by a Node.js backend with SQLite persistence.

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript + CSS + HTML (Served via Nginx).
- **Backend**: Node.js + Express + SQLite.
- **Auth Proxy**: `oauth2-proxy` handles Google OAuth at the gate.
- **CI/CD**: GitHub Actions builds and pushes multi-platform Docker images to GHCR.

## 🛠️ Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose.
- Google OAuth Client ID & Secret (via [Google Cloud Console](https://console.cloud.google.com/)).

### Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd 12.131_website_chores
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your secrets:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth ID.
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Secret.
   - `COOKIE_SECRET`: A random 32-character string.

3. **Launch the app**:
   ```bash
   docker compose up --build
   ```

4. **Access the app**:
   Visit [http://localhost:4180](http://localhost:4180) in your browser.

## 📱 Mobile Installation (PWA)

### iPhone (Safari)
1. Open the app in Safari.
2. Tap the **Share** button.
3. Tap **"Add to Home Screen"**.

### Android (Chrome)
1. Open the app in Chrome.
2. Tap the **three dots** in the corner.
3. Tap **"Install App"** or **"Add to Home Screen"**.

## 📁 Project Structure

- `frontend/`: Static site, PWA manifest, service worker, and Nginx config.
- `backend/`: Express API and SQLite database logic.
- `.github/workflows/`: CI/CD pipeline for Docker builds.
- `docker-compose.yml`: Local and deployment orchestration.

## 📜 License
MIT
