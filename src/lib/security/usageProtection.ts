import { NextRequest, NextResponse } from 'next/server';
import { AIServiceError, sanitizeAIError } from '../ai/errors';

interface RateLimitRecord {
  timestamps: number[];
}

interface InFlightLock {
  timestamp: number;
}

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, RateLimitRecord>();
// In-flight locks to prevent accidental concurrent duplicate requests
const inFlightLocks = new Map<string, InFlightLock>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 40; // 40 AI generation requests per minute
const IN_FLIGHT_LOCK_TIMEOUT_MS = 45 * 1000; // 45 seconds lock expiry safeguard
const REQUEST_TIMEOUT_MS = 40 * 1000; // 40 seconds AI request timeout

/**
 * Extracts a client identifier from standard request headers.
 */
export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const userAgent = req.headers.get('user-agent') || 'unknown-client';
  return `client-${userAgent.slice(0, 32)}`;
}

/**
 * Checks if the client has exceeded the sliding window rate limit.
 */
export function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  let record = rateLimitMap.get(clientId);

  if (!record) {
    record = { timestamps: [now] };
    rateLimitMap.set(clientId, record);
    return true;
  }

  // Filter out timestamps outside the window
  record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.timestamps.push(now);
  return true;
}

/**
 * Acquires an in-flight lock for a specific client and action.
 * Returns true if the lock was acquired, false if a request is already running.
 */
export function acquireInFlightLock(lockKey: string): boolean {
  const now = Date.now();
  const existing = inFlightLocks.get(lockKey);

  if (existing) {
    // If lock is still valid within timeout, reject duplicate
    if (now - existing.timestamp < IN_FLIGHT_LOCK_TIMEOUT_MS) {
      return false;
    }
  }

  inFlightLocks.set(lockKey, { timestamp: now });
  return true;
}

/**
 * Releases the in-flight lock for a specific action.
 */
export function releaseInFlightLock(lockKey: string): void {
  inFlightLocks.delete(lockKey);
}

/**
 * Wraps an async generation operation with timeout, rate limiting, duplicate protection,
 * and sanitized error formatting.
 */
export async function withUsageProtection<T>(
  req: NextRequest,
  actionName: string,
  handler: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const clientId = getClientIdentifier(req);
  const lockKey = `${clientId}:${actionName}`;

  // 1. Rate Limiting Check
  if (!checkRateLimit(clientId)) {
    const error = new AIServiceError(
      'RATE_LIMITED',
      'Rate limit exceeded for client',
      'You have reached the maximum number of generation requests for this minute. Please wait a few moments before trying again.',
      429
    );
    return {
      success: false,
      response: NextResponse.json(
        {
          error: error.userMessage,
          code: error.code,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          },
        }
      ),
    };
  }

  // 2. In-Flight Duplicate Protection Lock
  if (!acquireInFlightLock(lockKey)) {
    const error = new AIServiceError(
      'DUPLICATE_REQUEST',
      'Duplicate request in flight',
      'A generation request is currently running. Please wait for it to complete.',
      409
    );
    return {
      success: false,
      response: NextResponse.json(
        {
          error: error.userMessage,
          code: error.code,
        },
        { status: 409 }
      ),
    };
  }

  try {
    // 3. Enforce AI Timeout via Promise.race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new AIServiceError(
            'TIMEOUT',
            'AI request exceeded deadline',
            'The AI service took too long to generate this content. Please try again.',
            504
          )
        );
      }, REQUEST_TIMEOUT_MS);
    });

    const data = await Promise.race([handler(), timeoutPromise]);
    releaseInFlightLock(lockKey);
    return { success: true, data };
  } catch (err: unknown) {
    releaseInFlightLock(lockKey);
    const sanitized = sanitizeAIError(err);
    return {
      success: false,
      response: NextResponse.json(
        {
          error: sanitized.userMessage,
          code: sanitized.code,
        },
        { status: sanitized.statusCode }
      ),
    };
  }
}
