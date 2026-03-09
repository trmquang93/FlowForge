# FlowForge

A visual mobile app flow designer built with React. Design app navigation flows by uploading screen images, placing them on an infinite canvas, defining interactive hotspots, connecting screens with navigation links, and generating AI build instructions from the resulting flow.

## Features

- **Infinite Canvas** — Pan, zoom, and drag screens freely on a dark-themed canvas
- **Screen Management** — Upload screen images, add blank screens, rename, describe, and organize screen states (variants of the same logical screen)
- **Interactive Hotspots** — Draw tap areas directly on screen images, choose element types (button, text-input, toggle, etc.), and define actions (navigate, back, modal, API call, custom)
- **Navigation Connections** — Visually connect screens with bezier arrows; drag endpoints to reroute, click to select, double-click to edit
- **API Flow Support** — Define API endpoints on hotspots with method, success/error follow-up actions, and linked reference documents
- **Project Documents** — Attach reusable project-level documents (API specs, design guides) that can be referenced by hotspots
- **AI Instruction Generation** — Generate structured build instructions (main.md, screens.md, navigation.md, build-guide.md) with platform-specific code patterns for SwiftUI, React Native, Flutter, or Jetpack Compose
- **Export / Import** — Save and load `.flowforge` project files; merge flows from multiple files
- **Auto-Save** — File System Access API integration for silent auto-save to a connected `.flowforge` file (Chromium browsers)
- **Undo / Redo** — Full snapshot-based undo/redo with keyboard shortcuts
- **ZIP Download** — Download generated instructions and extracted screen images as a ZIP

## Getting Started

### Prerequisites

- Node.js 18+

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Run Tests

```bash
npm test
```

## Usage

1. **Upload screens** — Click "Upload Screens" or drag-and-drop images onto the canvas
2. **Arrange screens** — Drag screen cards to organize your flow layout
3. **Define hotspots** — Click and drag on a screen image to draw a tap area, then configure the action in the modal
4. **Connect screens** — Drag from a hotspot's green handle to another screen, or set the target in the hotspot modal
5. **Add descriptions** — Select a screen and add context in the sidebar
6. **Generate instructions** — Click "Generate" to produce AI-ready build instructions, then copy or download as ZIP

## Tech Stack

- **React 19** — UI framework (no external state management)
- **Vite** — Dev server and build tool
- **Vitest** — Test runner
- No TypeScript, no routing — single-view application with plain JSX

## Project Structure

```
src/
  FlowForge.jsx            — Main orchestrator component
  components/              — UI components (ScreenNode, ConnectionLines, HotspotModal, TopBar, Sidebar, etc.)
  hooks/                   — Custom hooks (useCanvas, useScreenManager, useFilePersistence)
  styles/                  — Theme and shared style objects
  utils/                   — ID generation, instruction generation, import/export, ZIP builder
```

## License

MIT
