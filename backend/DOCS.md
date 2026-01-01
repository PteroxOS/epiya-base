# EPIYA-AI Backend API Documentation

## 🎯 Overview

Backend multi-provider yang mendukung:

- **Local Provider**: MiniMax, DeepSeek, Llama, Qwen (dengan streaming)
- **Minitool Provider**: GPT-4o-mini, GPT-4.1, GPT-5 models (via scraper)

---

## 📋 Base URL

```
http://localhost:3001/api/v1
```

---

## 🔐 Authentication

Saat ini tidak ada authentication. CORS protection sudah aktif untuk security.

---

## 📚 Endpoints

### 1. **Model Management**

#### **GET /models** - List All Models

**Response:**

```json
{
  "success": true,
  "total": 11,
  "default": "MiniMax-M2",
  "models": [
    {
      "id": "deepseek-coder-v2",
      "name": "DeepSeek Coder V2",
      "description": "Best for coding tasks",
      "provider": "local",
      "category": "coding",
      "recommended": false,
      "streaming": true
    },
    {
      "id": "gpt-4o-mini",
      "name": "GPT-4O-MINI",
      "description": "GPT-4o Mini - Fast and efficient",
      "provider": "minitool",
      "category": "openai",
      "recommended": true,
      "streaming": false
    }
  ],
  "categories": {
    "general": 4,
    "coding": 1,
    "openai": 6
  }
}
```

---

#### **GET /models/providers** - Models by Provider

**Response:**

```json
{
  "success": true,
  "providers": ["local", "minitool"],
  "models": {
    "local": [
      { "id": "MiniMax-M2", ... }
    ],
    "minitool": [
      { "id": "gpt-4o-mini", ... }
    ]
  }
}
```

---

#### **GET /models/categories** - Models by Category

**Response:**

```json
{
  "success": true,
  "categories": ["general", "coding", "openai"],
  "models": {
    "general": [...],
    "coding": [...],
    "openai": [...]
  }
}
```

---

#### **GET /models/:modelId** - Get Model Info

**Example:** `GET /models/gpt-4o-mini`

**Response:**

```json
{
  "success": true,
  "model": {
    "id": "gpt-4o-mini",
    "name": "GPT-4O-MINI",
    "description": "GPT-4o Mini - Fast and efficient",
    "provider": "minitool-ai",
    "available": true,
    "features": {
      "streaming": false,
      "contextWindow": 4096,
      "maxTokens": 4096,
      "temperature": {
        "min": 0,
        "max": 1,
        "default": 0.7
      }
    }
  }
}
```

---

#### **POST /models/:modelId/chat** - Chat with Specific Model

**Request:**

```json
{
  "message": "Explain quantum computing",
  "conversationId": "chat-abc123",
  "history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help?"
    }
  ],
  "temperature": 0.7
}
```

**Response:**

```json
{
  "success": true,
  "response": "Quantum computing is...",
  "conversationId": "chat-abc123",
  "model": "gpt-4o-mini",
  "provider": "minitool-ai",
  "usage": null,
  "duration": 2341
}
```

**Example cURL:**

```bash
curl -X POST http://localhost:3001/api/v1/models/gpt-4o-mini/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from GPT-4o-mini!",
    "conversationId": "chat-test-123"
  }'
```

---

#### **POST /models/:modelId/test** - Test Model (No Save)

Sama seperti chat, tapi tidak menyimpan conversation.

**Response:**

```json
{
  "success": true,
  "response": "Test response...",
  "model": "gpt-4o-mini",
  "provider": "minitool-ai",
  "duration": 1523
}
```

---

### 2. **Chat (Auto-detect Provider)**

#### **POST /chat** - Send Message

**Request:**

```json
{
  "message": "What is machine learning?",
  "model": "gpt-4o-mini",  // Optional, auto-detect provider
  "conversationId": "chat-abc123",
  "history": [...],
  "temperature": 0.7,
  "stream": true  // Default true for local, false for minitool
}
```

**Response (Non-Streaming):**

```json
{
  "success": true,
  "response": "Machine learning is...",
  "conversationId": "chat-abc123",
  "model": "gpt-4o-mini",
  "provider": "minitool-ai",
  "usage": null,
  "duration": 2156
}
```

**Response (Streaming - SSE):**

```
data: {"choices":[{"delta":{"content":"Machine"}}]}

data: {"choices":[{"delta":{"content":" learning"}}]}

data: [DONE]
```

---

#### **GET /chat/models** - Get Models (Deprecated)

⚠️ **Deprecated!** Gunakan `GET /models` instead.

---

### 3. **Conversations**

#### **GET /conversations** - Get All Conversations

**Response:**

```json
{
  "success": true,
  "count": 5,
  "conversations": [
    {
      "id": "chat-abc123",
      "createdAt": "2025-12-31T08:00:00Z",
      "updatedAt": "2025-12-31T10:30:00Z",
      "messageCount": 10,
      "lastMessage": "Thank you for helping..."
    }
  ]
}
```

---

#### **GET /conversations/:id** - Get Specific Conversation

**Response:**

```json
{
  "success": true,
  "conversation": {
    "id": "chat-abc123",
    "createdAt": "2025-12-31T08:00:00Z",
    "messages": [
      {
        "id": "msg-123",
        "role": "user",
        "content": "Hello",
        "timestamp": "2025-12-31T08:00:00Z"
      }
    ],
    "metadata": {
      "totalMessages": 10,
      "userMessages": 5,
      "assistantMessages": 5
    }
  }
}
```

---

#### **GET /conversations/:id/history?limit=50**

Get conversation history dengan limit.

---

#### **DELETE /conversations/:id** - Delete Conversation

**Response:**

```json
{
  "success": true,
  "message": "Conversation deleted successfully",
  "conversationId": "chat-abc123"
}
```

---

### 4. **Health Check**

#### **GET /health** - Basic Health

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-12-31T10:00:00Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

---

#### **GET /health/detailed** - Detailed Info

**Response:**

```json
{
  "status": "healthy",
  "server": {
    "uptime": 3600.5,
    "memory": {...},
    "cpu": {...}
  },
  "application": {
    "name": "EPIYA-AI",
    "version": "2.0.0",
    "defaultModel": "MiniMax-M2"
  },
  "statistics": {
    "totalConversations": 150,
    "activeConversations": 42
  }
}
```

---

## 🎨 Usage Examples

### Example 1: Chat dengan Model Default

```javascript
const response = await fetch("http://localhost:3001/api/v1/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Hello AI!",
    conversationId: "chat-" + Date.now(),
  }),
});

const data = await response.json();
console.log(data.response);
```

---

### Example 2: Chat dengan GPT-4o-mini (Minitool Provider)

```javascript
const response = await fetch(
  "http://localhost:3001/api/v1/models/gpt-4o-mini/chat",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Explain AI in simple terms",
      conversationId: "chat-gpt4-" + Date.now(),
    }),
  }
);

const data = await response.json();
console.log(data.response);
console.log("Provider:", data.provider); // "minitool-ai"
```

---

### Example 3: Get All Available Models

```javascript
const response = await fetch("http://localhost:3001/api/v1/models");
const data = await response.json();

data.models.forEach((model) => {
  console.log(`${model.id} (${model.provider}) - ${model.description}`);
});
```

---

### Example 4: Streaming Response (Local Models)

```javascript
const response = await fetch("http://localhost:3001/api/v1/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Write a story",
    model: "MiniMax-M2",
    conversationId: "chat-stream-" + Date.now(),
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split("\n\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      if (data === "[DONE]") break;

      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
      }
    }
  }
}
```

---

## ⚡ Available Models

### **Local Provider** (Streaming ✅)

| Model ID            | Category | Description          |
| ------------------- | -------- | -------------------- |
| `deepseek-coder-v2` | Coding   | Best for code        |
| `llama3.1:8b`       | General  | Fast general-purpose |
| `qwen2.5:1.5b`      | General  | Lightweight          |
| `MiniMax-M2`        | General  | Balanced performance |
| `MiniMax-M2-Stable` | General  | Stable (Recommended) |

### **Minitool Provider** (No Streaming ❌)

| Model ID        | Description               |
| --------------- | ------------------------- |
| `gpt-4o-mini`   | GPT-4o Mini (Recommended) |
| `gpt-4.1-mini`  | GPT-4.1 Mini              |
| `gpt-4.1-nano`  | GPT-4.1 Nano              |
| `gpt-5-mini`    | GPT-5 Mini                |
| `gpt-5-nano`    | GPT-5 Nano                |
| `gpt-3.5-turbo` | Classic GPT-3.5           |

---

## 🛡️ Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid request",
  "message": "Message is required"
}
```

### 404 Not Found

```json
{
  "error": "Model not found",
  "message": "Model 'gpt-99' does not exist"
}
```

### 429 Too Many Requests

```json
{
  "error": "Too many requests",
  "message": "Please slow down and try again later."
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Failed to process chat request"
}
```

---

## 📊 Rate Limits

- **General API**: 100 requests per 15 minutes
- **Chat Endpoint**: 20 requests per minute
- **Per IP Address**

---

## 🔧 Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000

# AI Config
AI_NAME=EPIYA-AI
DEFAULT_MODEL=MiniMax-M2
DEFAULT_TEMPERATURE=0.7
MAX_TOKENS=4096

# Local Provider
AI_BASE_URL=http://161.97.152.192:8002
AI_API_ENDPOINT=/v1/chat/completions

# Security
RATE_LIMIT_MAX_REQUESTS=100
CHAT_RATE_LIMIT_MAX_REQUESTS=20

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true

# Storage
CONVERSATION_RETENTION_DAYS=30
```

---

## 🚀 Quick Start

```bash
# Install
npm install

# Setup .env
cp .env.example .env

# Run
npm start

# Test
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/v1/models
```

---

## 📝 Notes

1. **Minitool models** tidak support streaming (pakai non-streaming mode)
2. **Local models** full support streaming via SSE
3. System prompt otomatis ditambahkan untuk semua provider
4. History context dibatasi 20 messages terakhir
5. Conversation auto-cleanup setelah 30 hari

---

## 🐛 Troubleshooting

### Minitool scraper gagal?

- Check internet connection
- CF bypass API mungkin down
- Coba lagi beberapa saat

### Streaming tidak bekerja?

- Pastikan model dari local provider
- Minitool models tidak support streaming

### Rate limit terus?

- Tunggu beberapa menit
- Check environment variables untuk adjust limit
