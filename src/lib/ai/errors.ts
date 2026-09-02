import { AIErrorCode } from './types';

export class AIServiceError extends Error {
  public readonly code: AIErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;

  constructor(code: AIErrorCode, message: string, userMessage?: string, statusCode = 500) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage || getDefaultUserMessage(code);
  }
}

function getDefaultUserMessage(code: AIErrorCode): string {
  switch (code) {
    case 'MISSING_API_KEY':
      return 'AI generation is not configured. Please verify that the GEMINI_API_KEY environment variable is set in your server settings.';
    case 'INVALID_API_KEY':
      return 'AI authentication failed. Please verify that your GEMINI_API_KEY is active and valid.';
    case 'RATE_LIMITED':
      return 'Too many generation requests in a short period. Please wait a moment before trying again.';
    case 'QUOTA_EXCEEDED':
      return 'AI service quota has been reached for this period. Please try again later or verify your API limits.';
    case 'TIMEOUT':
      return 'The AI model took too long to respond. Please try again or simplify the prompt.';
    case 'MALFORMED_RESPONSE':
      return 'The AI service returned an unexpected response format. Please try again.';
    case 'PROVIDER_UNAVAILABLE':
      return 'The AI service is temporarily unreachable. Please try again in a few seconds.';
    case 'DUPLICATE_REQUEST':
      return 'A generation request is already in progress. Please wait for it to complete.';
    case 'INTERNAL_ERROR':
    default:
      return 'An unexpected error occurred during AI generation. Please try again.';
  }
}

/**
 * Maps any raw exception (from GoogleGenerativeAI, fetch, or runtime)
 * into a safe, sanitized AIServiceError without exposing secrets or stack traces.
 */
export function sanitizeAIError(error: unknown): AIServiceError {
  if (error instanceof AIServiceError) {
    return error;
  }

  const rawMessage = error instanceof Error ? error.message : String(error || '');
  const lowerMsg = rawMessage.toLowerCase();

  if (
    (lowerMsg.includes('api key') || lowerMsg.includes('api_key') || lowerMsg.includes('gemini_api_key')) &&
    (lowerMsg.includes('not configured') || lowerMsg.includes('missing') || lowerMsg.includes('empty'))
  ) {
    return new AIServiceError('MISSING_API_KEY', 'API key missing in environment', undefined, 500);
  }

  if (
    lowerMsg.includes('api_key_invalid') ||
    lowerMsg.includes('invalid api key') ||
    lowerMsg.includes('invalid api_key') ||
    lowerMsg.includes('api key not valid') ||
    lowerMsg.includes('api_key not valid') ||
    lowerMsg.includes('403') ||
    lowerMsg.includes('permission_denied')
  ) {
    return new AIServiceError('INVALID_API_KEY', 'Invalid API key or authentication failure', undefined, 401);
  }

  if (
    lowerMsg.includes('quota') ||
    lowerMsg.includes('exceeded quota') ||
    lowerMsg.includes('quota exceeded')
  ) {
    return new AIServiceError('QUOTA_EXCEEDED', 'API quota exceeded', undefined, 429);
  }

  if (
    lowerMsg.includes('429') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('too many requests')
  ) {
    return new AIServiceError('RATE_LIMITED', 'Rate limit exceeded', undefined, 429);
  }

  if (lowerMsg.includes('timeout') || lowerMsg.includes('aborted') || lowerMsg.includes('deadline')) {
    return new AIServiceError('TIMEOUT', 'AI request timed out', undefined, 504);
  }

  if (lowerMsg.includes('json') || lowerMsg.includes('syntaxerror') || lowerMsg.includes('unexpected token')) {
    return new AIServiceError('MALFORMED_RESPONSE', 'Failed to parse structured AI output', undefined, 502);
  }

  if (
    lowerMsg.includes('503') ||
    lowerMsg.includes('service unavailable') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('fetch failed')
  ) {
    return new AIServiceError('PROVIDER_UNAVAILABLE', 'AI provider service unavailable', undefined, 503);
  }

  return new AIServiceError('INTERNAL_ERROR', 'Internal AI generation error', undefined, 500);
}
