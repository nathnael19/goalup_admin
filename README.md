# Football Admin Panel 🏆

A premium, high-performance administration dashboard for managing football tournaments, teams, players, and live match operations. Built with a focus on rich aesthetics, real-time updates, and professional-grade tactical tools.

## ✨ Key Features

### 📊 Comprehensive Dashboard

- **Role-Based Views**: Tailored experiences for Super Admins, Tournament Admins, Coaches, Referees, and News Reporters.
- **Live Pulse**: Real-time monitoring of matches currently in progress.
- **Assigned Tasks**: Quick access to referee assignments, coach squad management, and reporter articles.
- **Audit Logs**: Transparent tracking of all administrative actions.

### ⚽ Match Command Center

- **Live Operations**: Surgical control for match kickoff, halftime, and full-time events.
- **Surgical Event Logging**: Log goals (including own goals and assists), disciplinary cards (yellow/red), and tactical substitutions.
- **Interactive Timeline**: A real-time, chronological feed of all match occurrences.
- **Match Hero View**: A dynamic, premium scoreboard featuring team logos, status badges, and live scores.

### 🏟️ Tactical Analysis & Lineups

- **Interactive Pitch**: Drag-and-drop style tactical board for distributing the starting XI.
- **Formation Management**: Support for multiple professional formations (4-3-3, 4-4-2, 3-5-2, etc.).
- **Bench Management**: Rapid selection and management of substitutes.
- **Coach Portal**: Dedicated interface for coaches to submit lineups before kickoff.

### 🛡️ Team & Player Administration

- **Squad Management**: Detailed roster views for goalkeepers, defenders, midfielders, and forwards.
- **Statistics Hub**: Aggregate performance metrics including win rate, clean sheets, and top scorers.
- **Profile Management**: Full CRUD operations for teams and players, including image uploads and position tracking.

### 🏆 Tournament Control

- **Hierarchical Structure**: Manage competitions, tournaments, and seasons with a structured hierarchy.
- **League Standings**: Automated, real-time league table calculations based on match results.
- **Knockout Support**: specialized handling for knockout stages and multi-leg fixtures.

## 🛠️ Technology Stack

- **Core**: React 18, TypeScript, Vite
- **Data Fetching**: TanStack Query (React Query) for robust caching and state synchronization.
- **Styling**: Vanilla CSS with a custom design system featuring:
  - Glassmorphic UI elements
  - Vibrant, harmonious color palettes
  - Responsive layouts (Mobile/Desktop)
  - Smooth micro-animations
- **Icons**: React Icons (Feather/Lucide set)
- **Services**: Pattern-based API service layer for clean communication with the backend.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- NPM or Yarn

### Installation

```bash
# Clone the repository and navigate to the admin directory
cd frontend/admin

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

### Build

```bash
# Create a production build
npm run build
```

## 📂 Project Structure

- `src/components`: UI components organized by feature (dashboard, match, team).
- `src/pages`: Top-level page components and routing logic.
- `src/hooks`: Custom React hooks for data fetching and business logic.
- `src/services`: API client layer for backend communication.
- `src/types`: Centralized TypeScript definitions and interfaces.
- `src/utils`: Helper functions for image processing, date formatting, and sports logic.

---

_Built with ❤️ for professional football management._
