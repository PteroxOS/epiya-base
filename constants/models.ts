// constants/models.ts - Updated untuk match dengan backend

export const AI_MODELS = [
  {
    id: "MiniMax-M2-Stable",
    name: "MiniMax M2 Stable",
    shortName: "MM2 Stable",
    description: "Stable release with reliable performance",
    recommended: true
  },
  {
    id: "MiniMax-M2",
    name: "MiniMax M2",
    shortName: "MiniMax",
    description: "Balanced performance model"
  },
  {
    id: "deepseek-coder-v2",
    name: "DeepSeek Coder V2",
    shortName: "DeepSeek",
    description: "Best for coding tasks"
  },
  {
    id: "llama3.1:8b",
    name: "Llama 3.1 8B",
    shortName: "Llama 3.1",
    description: "Fast general purpose"
  },
  {
    id: "qwen2.5:1.5b",
    name: "Qwen 2.5 1.5B",
    shortName: "Qwen 2.5",
    description: "Lightweight & quick"
  },
] as const

export type ModelId = (typeof AI_MODELS)[number]["id"]

// Default model sekarang MiniMax-M2-Stable (sesuai backend)
export const DEFAULT_MODEL: ModelId = "MiniMax-M2-Stable"