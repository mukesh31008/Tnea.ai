import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createAiProvider(apiKey: string, opts?: { baseURL?: string; structuredOutputs?: boolean }) {
  const baseURL = opts?.baseURL || process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  return createOpenAICompatible({
    name: "ai-provider",
    baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    ...(opts?.structuredOutputs ? { includeUsage: true } : {}),
  });
}
