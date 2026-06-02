import type { Message } from './types';

// Rough heuristic (~4 chars per token). Good enough for a live footer counter —
// not meant to match the model's exact tokenizer.
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.trim().length / 4);
}

export function estimateConversationTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}
