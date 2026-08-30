import { AIProvider } from './types';
import { GeminiProvider } from './geminiProvider';

// Singleton instance of the default AI Provider
let activeProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!activeProvider) {
    activeProvider = new GeminiProvider();
  }
  return activeProvider;
}

export const aiProvider = getAIProvider();

export * from './types';
export * from './errors';
export * from './geminiProvider';
