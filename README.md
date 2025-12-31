# EPIYA-AI Terminal

Terminal-style web interface untuk chat dengan AI. Dibangun menggunakan Next.js 16, React 19, dan TypeScript dengan desain retro-futuristic yang clean.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

---

## Tentang Project

EPIYA-AI Terminal adalah full-stack web application untuk chat AI dengan interface terminal macOS-style. Project ini mencakup frontend Next.js dan backend Express server yang sudah terintegrasi penuh.

**Key Features:**

- Real-time streaming chat dengan AI
- Multiple AI model selection
- Terminal-style UI dengan macOS aesthetic
- Markdown rendering dengan syntax highlighting
- Persistent conversation dengan shareable URLs
- Command system untuk navigasi
- Auto-save chat history

---

## Struktur Project

### **app/** - Application Routes

- `page.tsx` - Landing page dengan input card
- `chat/page.tsx` - Main chat interface
- `layout.tsx` - Root layout dan metadata
- `globals.css` - Global styles dan CSS variables

### **components/** - UI Components

**terminal/** - Core terminal components

- `terminal.tsx` - Main container dan logic handler
- `message.tsx` - Message display component
- `command-input.tsx` - Input field dengan model selector
- `terminal-header.tsx` - macOS-style header dengan traffic lights
- `terminal-body.tsx` - Message container
- `model-selector.tsx` - Dropdown untuk pilih AI model
- `welcome-screen.tsx` - ASCII art welcome screen
- `help-display.tsx` - Command help screen
- `about-display.tsx` - About screen

**markdown/** - Content rendering

- `markdown-renderer.tsx` - Parse dan render markdown
- `code-block.tsx` - Code blocks dengan syntax highlighting

**landing/** - Landing page

- `landing-terminal.tsx` - Terminal preview di landing page

### **constants/** - Configuration

- `models.ts` - Daftar AI models yang available
- `commands.ts` - Terminal command definitions
- `themes.ts` - Color scheme dan ASCII art

### **hooks/** - Custom React Hooks

- `use-typewriter.ts` - Typing animation effect
- `use-command-history.ts` - Command history navigation (arrow up/down)
- `use-terminal-scroll.ts` - Auto-scroll ke bottom saat ada message baru

### **utils/** - Utility Functions

- `command-handler.ts` - Process terminal commands
- `markdown-parser.ts` - Parse markdown ke HTML
- `conversation-utils.ts` - Manage conversation state dan localStorage

### **types/** - TypeScript Definitions

- `message.types.ts` - Type definitions untuk messages dan conversations

---

## Cara Kerja Aplikasi

### 1. Landing Page Flow

```
User buka "/"
→ Tampil landing page dengan input card
→ User ketik message dan pilih model
→ Submit redirect ke "/chat?message={msg}&model={model}"
```

### 2. Chat Page Flow

```
User di "/chat"
→ Cek URL params (message, model, chatid)
→ Load existing conversation (jika ada chatid)
→ User kirim message
→ Generate conversation ID (jika belum ada)
→ Update URL dengan chatid
→ Process message (command atau chat)
→ Save conversation ke localStorage
→ Display response dengan typing animation
```

### 3. Command System

```
User ketik "/command"
→ Detect slash prefix
→ Execute command handler
→ Return system message
→ Display output tanpa call API
```

Available commands:

- `/help` - List semua commands
- `/clear` - Clear chat history
- `/about` - Info project
- `/history` - Command history

### 4. Conversation Management

Setiap chat session punya unique conversation ID dengan format:

```
chat-{timestamp}-{random}
Example: chat-1704067200000-abc123xyz
```

**URL Structure:**

```
/?message={encoded_message}&model={model_id}&chatid={conversation_id}
```

**LocalStorage Key:**

```
conversation-{conversation_id}
```

**Benefits:**

- Shareable conversations via URL
- Persistent state setelah refresh
- Multi-session support
- Backend tracking per conversation

---

## Message Styling

### User Messages

- Position: Kanan
- Background: Abu-abu gelap (#3a3a3a)
- Style: Bubble dengan rounded corners

### AI Messages

- Position: Kiri
- Background: Transparent
- Color: Terminal green (#00ff00)
- Feature: Typewriter animation, markdown rendering

### System Messages

- Style: Clean text
- Usage: Command outputs (help, about, etc)

---

## AI Model Options

Project support multiple AI models:

- **DeepSeek Coder V2** - Optimized untuk coding tasks
- **Llama 3.1 8B** - Fast general purpose model
- **Qwen 2.5 1.5B** - Lightweight dan quick response
- **MiniMax M2** - Balanced performance
- **MiniMax M2 Stable** - Stable release version

Model selector dropdown dengan auto-positioning (buka ke atas/bawah tergantung available space).

---

## Code Highlighting

Support syntax highlighting untuk berbagai bahasa:

- Python, JavaScript, TypeScript, JSX, TSX
- HTML, CSS, JSON, Markdown
- Shell, Bash, SQL, dan lainnya

Code blocks auto-detect bahasa dan apply highlighting dengan color scheme yang match dengan terminal theme.

---

## Backend Server

Project ini sudah include **complete backend server** yang siap pakai dengan fitur lengkap.

### Backend Features

**Core:**

- Real-time streaming dengan SSE (Server-Sent Events)
- Support 5 AI models berbeda
- Persistent conversation storage
- Learning system untuk analytics

**Security:**

- CORS protection dengan whitelist
- Rate limiting (100 req/15min general, 20 req/min chat)
- Bot detection dan automatic blocking
- IP blocking untuk suspicious activity
- Helmet.js security headers

**Monitoring:**

- JSON logging system (per day)
- Request/response tracking
- AI interaction analytics
- Conversation insights generation

### Backend Setup

1. **Navigate ke folder backend:**

```bash
cd epiya-ai-backend
npm install
```

2. **Setup environment variables:**

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan:

```env
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000

AI_NAME=EPIYA-AI
DEFAULT_MODEL=MiniMax-M2-Stable
AI_BASE_URL=http://161.97.152.192:8002

RATE_LIMIT_MAX_REQUESTS=100
CHAT_RATE_LIMIT_MAX_REQUESTS=20
```

3. **Start backend server:**

```bash
npm run dev  # development
npm start    # production
```

### Backend API Endpoints

**Chat:**

- `POST /api/v1/chat` - Send message, get streaming response
- `GET /api/v1/chat/models` - List available AI models

**Conversations:**

- `GET /api/v1/conversations` - Get all conversations
- `GET /api/v1/conversations/:id` - Get specific conversation
- `GET /api/v1/conversations/:id/history` - Get conversation history
- `DELETE /api/v1/conversations/:id` - Delete conversation
- `GET /api/v1/conversations/analytics/insights` - Generate insights

**Health:**

- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed system stats

### Backend Integration

Frontend sudah configured untuk connect ke backend. Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Backend akan handle:

- AI model selection dan routing
- Conversation storage dan tracking
- Streaming response ke frontend
- Rate limiting dan security
- Logging dan analytics

Detail lengkap tentang backend ada di folder `epiya-ai-backend/`.

---

## Tech Stack

- **Next.js 16** - React framework dengan App Router
- **React 19** - UI library dengan modern hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **Lucide React** - Icon library

---

## Development

### Prerequisites

- Node.js 18+
- npm/pnpm/yarn/bun

### Installation

```bash
git clone https://github.com/PteroxOS/epiya-ai.git
cd epiya-ai
npm install
```

### Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### Build Production

```bash
npm run build
npm start
```

---

## Customization

### Ganti Primary Color

Edit `constants/themes.ts`:

```typescript
export const PRIMARY_COLOR = "#00ff00"; // Change this
```

### Tambah AI Model

Edit `constants/models.ts` dan tambah object baru ke array `models`

### Ubah Typing Speed

Edit `hooks/use-typewriter.ts`:

```typescript
const TYPING_SPEED = 10; // milliseconds per character
```

### Custom Command

Edit `utils/command-handler.ts` dan tambah case baru di switch statement

---

## Project Status

**Current:** Full-stack implementation (Frontend + Backend)
**Status:** Production-ready dengan complete features
**Documentation:** Complete dengan deployment guide

---

## License

Open Source - Free untuk learning dan development

## Author

**PteroxOS**  
GitHub: [@PteroxOS](https://github.com/PteroxOS)

---

**Note:** Project ini ready untuk production setelah integrasi dengan backend API. Semua frontend logic sudah complete dan tested.
