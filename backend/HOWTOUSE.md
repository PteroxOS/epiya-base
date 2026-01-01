# 🧪 Testing Guide - EPIYA-AI Backend

## Quick Test Commands

### 1. Test Health

```bash
curl http://localhost:3001/api/v1/health
```

---

### 2. List All Models

```bash
curl http://localhost:3001/api/v1/models | jq
```

**Expected Output:**

```json
{
  "success": true,
  "total": 11,
  "models": [...]
}
```

---

### 3. Get Specific Model Info

```bash
# Test GPT-4o-mini
curl http://localhost:3001/api/v1/models/gpt-4o-mini | jq

# Test MiniMax
curl http://localhost:3001/api/v1/models/MiniMax-M2 | jq
```

---

### 4. Test Chat with Default Model

```bash
curl -X POST http://localhost:3001/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is 2+2?",
    "conversationId": "chat-test-'$(date +%s)'"
  }' | jq
```

---

### 5. Test Specific Model - GPT-4o-mini

```bash
curl -X POST http://localhost:3001/api/v1/models/gpt-4o-mini/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain machine learning in one sentence",
    "conversationId": "chat-gpt4-test"
  }' | jq
```

---

### 6. Test Specific Model - DeepSeek Coder

```bash
curl -X POST http://localhost:3001/api/v1/models/deepseek-coder-v2/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Write a Python function to reverse a string",
    "conversationId": "chat-deepseek-test"
  }' | jq
```

---

### 7. Test Model with History

```bash
curl -X POST http://localhost:3001/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What did I ask before?",
    "model": "gpt-4o-mini",
    "conversationId": "chat-history-test",
    "history": [
      {
        "role": "user",
        "content": "My name is John"
      },
      {
        "role": "assistant",
        "content": "Nice to meet you, John!"
      }
    ]
  }' | jq
```

---

### 8. Test Model Selection (Test Endpoint)

```bash
curl -X POST http://localhost:3001/api/v1/models/gpt-5-mini/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Say hello",
    "temperature": 0.5
  }' | jq
```

---

### 9. Test Models by Provider

```bash
# Get models grouped by provider
curl http://localhost:3001/api/v1/models/providers | jq

# Expected:
# {
#   "success": true,
#   "providers": ["local", "minitool"],
#   "models": {
#     "local": [...],
#     "minitool": [...]
#   }
# }
```

---

### 10. Test Models by Category

```bash
# Get models grouped by category
curl http://localhost:3001/api/v1/models/categories | jq

# Expected:
# {
#   "success": true,
#   "categories": ["general", "coding", "openai"],
#   "models": {...}
# }
```

---

## 🔄 Test All Minitool Models

```bash
#!/bin/bash
# test-all-minitool.sh

MODELS=(
  "gpt-4o-mini"
  "gpt-4.1-mini"
  "gpt-4.1-nano"
  "gpt-5-mini"
  "gpt-5-nano"
  "gpt-3.5-turbo"
)

for MODEL in "${MODELS[@]}"; do
  echo "Testing $MODEL..."

  curl -X POST http://localhost:3001/api/v1/models/$MODEL/test \
    -H "Content-Type: application/json" \
    -d '{
      "message": "Say hello and tell me your model name"
    }' | jq -r '.response'

  echo ""
  echo "---"
  sleep 2
done
```

---

## 🔄 Test All Local Models

```bash
#!/bin/bash
# test-all-local.sh

MODELS=(
  "deepseek-coder-v2"
  "llama3.1:8b"
  "qwen2.5:1.5b"
  "MiniMax-M2"
  "MiniMax-M2-Stable"
)

for MODEL in "${MODELS[@]}"; do
  echo "Testing $MODEL..."

  curl -X POST http://localhost:3001/api/v1/models/$MODEL/chat \
    -H "Content-Type: application/json" \
    -d '{
      "message": "What is your name?",
      "conversationId": "test-'$(date +%s)'"
    }' | jq -r '.response'

  echo ""
  echo "---"
  sleep 2
done
```

---

## 📊 Performance Testing

### Measure Response Time

```bash
time curl -X POST http://localhost:3001/api/v1/models/gpt-4o-mini/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quick test",
    "conversationId": "perf-test"
  }'
```

### Concurrent Requests (stress test)

```bash
# Install apache bench (ab)
# Ubuntu: sudo apt install apache2-utils
# Mac: brew install apache-bench

ab -n 50 -c 10 -p payload.json -T application/json \
  http://localhost:3001/api/v1/health
```

**payload.json:**

```json
{
  "message": "Test",
  "conversationId": "stress-test"
}
```

---

## 🐍 Python Testing Script

```python
# test_api.py
import requests
import json
import time

BASE_URL = "http://localhost:3001/api/v1"

def test_health():
    print("Testing health...")
    r = requests.get(f"{BASE_URL}/health")
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    print()

def test_models():
    print("Testing models list...")
    r = requests.get(f"{BASE_URL}/models")
    data = r.json()
    print(f"Total models: {data['total']}")
    for model in data['models']:
        print(f"  - {model['id']} ({model['provider']})")
    print()

def test_chat(model_id, message):
    print(f"Testing chat with {model_id}...")
    r = requests.post(
        f"{BASE_URL}/models/{model_id}/chat",
        json={
            "message": message,
            "conversationId": f"test-{int(time.time())}"
        }
    )
    data = r.json()
    print(f"Response: {data.get('response', 'ERROR')[:100]}...")
    print(f"Duration: {data.get('duration')}ms")
    print(f"Provider: {data.get('provider')}")
    print()

if __name__ == "__main__":
    test_health()
    test_models()

    # Test different models
    test_chat("gpt-4o-mini", "What is AI?")
    test_chat("MiniMax-M2", "Explain quantum computing")
    test_chat("deepseek-coder-v2", "Write a fibonacci function in Python")
```

**Run:**

```bash
python test_api.py
```

---

## 🎯 JavaScript/Node.js Testing

```javascript
// test-api.js
const axios = require("axios");

const BASE_URL = "http://localhost:3001/api/v1";

async function testModels() {
  console.log("📋 Testing Models Endpoint...\n");

  const { data } = await axios.get(`${BASE_URL}/models`);

  console.log(`Total Models: ${data.total}`);
  console.log(`Default: ${data.default}\n`);

  console.log("Local Models:");
  data.models
    .filter((m) => m.provider === "local")
    .forEach((m) => console.log(`  ✓ ${m.id} - ${m.description}`));

  console.log("\nMinitool Models (GPT):");
  data.models
    .filter((m) => m.provider === "minitool")
    .forEach((m) => console.log(`  ✓ ${m.id} - ${m.description}`));

  console.log("\n");
}

async function testChat(modelId, message) {
  console.log(`💬 Testing ${modelId}...`);

  try {
    const { data } = await axios.post(`${BASE_URL}/models/${modelId}/chat`, {
      message,
      conversationId: `test-${Date.now()}`,
    });

    console.log(`Response: ${data.response.substring(0, 100)}...`);
    console.log(`Provider: ${data.provider}`);
    console.log(`Duration: ${data.duration}ms\n`);
  } catch (error) {
    console.error(`Error: ${error.message}\n`);
  }
}

async function main() {
  await testModels();

  // Test different providers
  await testChat("gpt-4o-mini", "Say hello in 5 words");
  await testChat("MiniMax-M2", "Explain AI briefly");
  await testChat("deepseek-coder-v2", "Write hello world in Python");
}

main();
```

**Run:**

```bash
node test-api.js
```

---

## ✅ Expected Results Checklist

- [ ] Health endpoint returns status "healthy"
- [ ] Models endpoint returns 11 total models
- [ ] 5 local models (MiniMax, DeepSeek, Llama, Qwen)
- [ ] 6 minitool models (GPT variants)
- [ ] GPT-4o-mini chat returns response from "minitool-ai"
- [ ] MiniMax-M2 chat returns response from "local"
- [ ] Invalid model returns 404
- [ ] Missing message returns 400
- [ ] Rate limiting works after 20 requests/min
- [ ] Conversation saved in data/conversations/

---

## 🐛 Common Issues

### Issue: "Model not found"

**Solution:** Check model ID spelling, use `GET /models` to see available models

### Issue: "CF bypass failed"

**Solution:** Minitool scraper depends on external API, might be temporarily down

### Issue: "Rate limit exceeded"

**Solution:** Wait 1 minute or adjust RATE_LIMIT in .env

### Issue: "Connection refused"

**Solution:** Ensure server is running on correct port

---

## 📝 Test Report Template

```
# Test Report - EPIYA-AI Backend
Date: YYYY-MM-DD
Tester: Your Name

## Test Results

### Health Check
- [ ] Basic health: PASS/FAIL
- [ ] Detailed health: PASS/FAIL

### Models
- [ ] List all models: PASS/FAIL
- [ ] Get model info: PASS/FAIL
- [ ] Models by provider: PASS/FAIL
- [ ] Models by category: PASS/FAIL

### Chat - Local Models
- [ ] MiniMax-M2: PASS/FAIL
- [ ] DeepSeek: PASS/FAIL
- [ ] Llama: PASS/FAIL

### Chat - Minitool Models
- [ ] GPT-4o-mini: PASS/FAIL
- [ ] GPT-3.5-turbo: PASS/FAIL
- [ ] GPT-5-mini: PASS/FAIL

### Conversations
- [ ] Save conversation: PASS/FAIL
- [ ] Get conversation: PASS/FAIL
- [ ] Delete conversation: PASS/FAIL

### Performance
- Average response time: ___ms
- Max concurrent requests: ___
- Memory usage: ___MB

## Issues Found
1.
2.
3.

## Recommendations
1.
2.
```
